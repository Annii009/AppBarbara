import express, { type Express } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { API_BASE_PATH } from "@minibarbara/shared";
import { env } from "./config/env.ts";
import { healthRouter } from "./modules/health/health.routes.ts";
import { authRouter } from "./modules/auth/auth.routes.ts";
import { avatarRouter } from "./modules/avatar/avatar.routes.ts";
import { progressRouter } from "./modules/progress/progress.routes.ts";
import { dailyRouter } from "./modules/daily/daily.routes.ts";
import { friendsRouter } from "./modules/friends/friends.routes.ts";
import { chatRouter } from "./modules/chat/chat.routes.ts";
import { errorHandler, notFoundHandler } from "./middleware/error.ts";

/**
 * Construccion de la app de Express, separada del arranque del servidor.
 * Asi los tests pueden montar la app en memoria sin abrir ningun puerto.
 */
export function createApp(): Express {
  const app = express();

  // Express expone su version en esta cabecera. No aporta nada y le dice a un
  // atacante contra que esta jugando.
  app.disable("x-powered-by");

  app.use(
    cors({
      origin: env.clientOrigins,
      // Necesario para que el navegador envie la cookie de sesion cuando el
      // cliente (5173) y la API (4000) estan en puertos distintos.
      credentials: true,
    }),
  );

  // Limite bajo a proposito: los cuerpos que manejamos son configuraciones de
  // avatar y jugadas, nunca ficheros. Sin limite, un POST enorme puede tumbar
  // el proceso.
  app.use(express.json({ limit: "64kb" }));
  // Sin firma: nuestra propia cookie de sesion ya va firmada (ver lib/session.ts),
  // asi que cookie-parser aqui solo necesita trocear la cabecera Cookie.
  app.use(cookieParser());

  app.use(API_BASE_PATH, healthRouter);
  app.use(API_BASE_PATH, authRouter);
  app.use(API_BASE_PATH, avatarRouter);
  app.use(API_BASE_PATH, progressRouter);
  app.use(API_BASE_PATH, dailyRouter);
  app.use(API_BASE_PATH, friendsRouter);
  app.use(API_BASE_PATH, chatRouter);

  app.use(API_BASE_PATH, notFoundHandler);
  app.use(errorHandler);

  return app;
}
