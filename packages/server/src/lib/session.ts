import { createHmac, timingSafeEqual } from "node:crypto";
import { env } from "../config/env.ts";

/**
 * Token de sesion firmado, formato "header.payload.firma" al estilo JWT pero
 * hecho a mano en vez de anadir la dependencia jsonwebtoken.
 *
 * Al verificar SIEMPRE recalculamos la firma con HMAC-SHA256 fijo: nunca
 * leemos el algoritmo del propio token. Eso evita de raiz el ataque clasico
 * "alg: none" de JWT (un token que dice no llevar firma y la libreria se lo
 * cree). Aqui no hay eleccion de algoritmo posible: o coincide con HMAC-SHA256
 * usando nuestro secreto, o el token se rechaza.
 */

export const SESSION_COOKIE_NAME = "mb_session";
const SESSION_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 dias

interface SessionPayload {
  sub: string;
  iat: number;
  exp: number;
}

function base64url(input: string): string {
  return Buffer.from(input, "utf8").toString("base64url");
}

function signatureFor(header: string, payload: string): string {
  return createHmac("sha256", env.jwtSecret)
    .update(`${header}.${payload}`)
    .digest("base64url");
}

function sign(userId: string): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "MB1" }));
  const now = Math.floor(Date.now() / 1000);
  const payload = base64url(
    JSON.stringify({
      sub: userId,
      iat: now,
      exp: now + SESSION_TTL_SECONDS,
    } satisfies SessionPayload),
  );
  return `${header}.${payload}.${signatureFor(header, payload)}`;
}

/** Devuelve el userId si el token es valido y no ha caducado; si no, null. */
function verify(token: string): string | null {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts as [string, string, string];

  const expected = signatureFor(header, payload);
  const given = Buffer.from(signature, "base64url");
  const wanted = Buffer.from(expected, "base64url");
  if (given.length !== wanted.length || !timingSafeEqual(given, wanted)) {
    return null;
  }

  let parsed: SessionPayload;
  try {
    parsed = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch {
    return null;
  }
  if (typeof parsed.sub !== "string" || typeof parsed.exp !== "number") return null;
  if (Math.floor(Date.now() / 1000) > parsed.exp) return null;

  return parsed.sub;
}

export const session = { sign, verify };

/** Opciones de la cookie de sesion. httpOnly: JavaScript nunca puede leerla. */
export function sessionCookieOptions(): {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  maxAge: number;
  path: string;
} {
  return {
    httpOnly: true,
    sameSite: "lax",
    // "secure" exige HTTPS. En local (HTTP) lo desactivamos o el navegador
    // ignoraria la cookie; en produccion siempre debe ir en true.
    secure: env.isProduction,
    maxAge: SESSION_TTL_SECONDS * 1000,
    path: "/",
  };
}
