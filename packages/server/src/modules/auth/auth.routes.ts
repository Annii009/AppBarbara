import { Router } from "express";
import rateLimit from "express-rate-limit";
import type { LoginRequest, Profile, RegisterRequest } from "@minibarbara/shared";
import { getDb } from "../../db/index.ts";
import { ApiError } from "../../lib/api-error.ts";
import { SESSION_COOKIE_NAME, session, sessionCookieOptions } from "../../lib/session.ts";
import { requireAuth } from "../../middleware/auth.ts";
import { createAuthService } from "./auth.service.ts";

export const authRouter: Router = Router();

/**
 * Limite de intentos en registro/login. Sin esto, nada impide probar miles de
 * contrasenas por segundo contra una cuenta. 30 intentos / 15 min por IP es
 * generoso para un fallo humano y molesto para un script.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { code: "RATE_LIMITED", message: "Demasiados intentos. Espera unos minutos." },
  },
});

function readCredentials(body: unknown): { nick: string; password: string } {
  if (typeof body !== "object" || body === null) {
    throw ApiError.badRequest("Falta el cuerpo de la peticion.");
  }
  const { nick, password } = body as Record<string, unknown>;
  if (typeof nick !== "string" || typeof password !== "string") {
    throw ApiError.badRequest("Nick y contrasena son obligatorios.");
  }
  return { nick, password };
}

authRouter.post("/auth/register", authLimiter, async (req, res, next) => {
  try {
    const { nick, password } = readCredentials(req.body as RegisterRequest);
    const profile = await createAuthService(getDb()).register(nick, password);

    res.cookie(SESSION_COOKIE_NAME, session.sign(profile.user.id), sessionCookieOptions());
    res.status(201).json(profile satisfies Profile);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/login", authLimiter, async (req, res, next) => {
  try {
    const { nick, password } = readCredentials(req.body as LoginRequest);
    const { profile, userId } = await createAuthService(getDb()).login(nick, password);

    res.cookie(SESSION_COOKIE_NAME, session.sign(userId), sessionCookieOptions());
    res.json(profile satisfies Profile);
  } catch (error) {
    next(error);
  }
});

authRouter.post("/auth/logout", (_req, res) => {
  res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
  res.status(204).end();
});

authRouter.get("/me", requireAuth, (req, res, next) => {
  try {
    // requireAuth garantiza que userId esta presente si llegamos aqui.
    const profile = createAuthService(getDb()).getProfile(req.userId as string);
    res.json(profile satisfies Profile);
  } catch (error) {
    next(error);
  }
});
