import { fileURLToPath } from "node:url";
import path from "node:path";
import process from "node:process";

/**
 * Configuracion del servidor, leida del entorno con valores por defecto que
 * funcionan en local sin configurar nada.
 *
 * Node 22 carga .env de forma nativa con --env-file, asi no necesitamos la
 * dependencia dotenv (ver el script "dev" del package.json).
 */

/** Raiz de packages/server, para resolver rutas relativas del .env */
export const SERVER_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../..",
);

function str(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value === "" ? fallback : value;
}

function int(key: string, fallback: number): number {
  const raw = process.env[key];
  if (raw === undefined || raw === "") return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`La variable de entorno ${key} debe ser un numero`);
  }
  return parsed;
}

export const env = {
  nodeEnv: str("NODE_ENV", "development"),
  isProduction: process.env["NODE_ENV"] === "production",
  port: int("PORT", 4000),

  /** Origenes autorizados a llamar a la API desde el navegador. */
  clientOrigins: str("CLIENT_ORIGIN", "http://localhost:5173")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),

  databasePath: path.resolve(
    SERVER_ROOT,
    str("DATABASE_PATH", "data/minibarbara.sqlite"),
  ),

  jwtSecret: str("JWT_SECRET", "dev-secret-inseguro-solo-para-local"),
} as const;

/**
 * Comprueba antes de arrancar que no salimos a produccion con los valores de
 * desarrollo. Es barato ponerlo ahora y evita el clasico despliegue con el
 * secreto de ejemplo.
 */
export function assertProductionConfig(): void {
  if (!env.isProduction) return;
  if (env.jwtSecret.length < 32 || env.jwtSecret.startsWith("dev-")) {
    throw new Error(
      "JWT_SECRET no es valido para produccion: define uno aleatorio de al menos 32 caracteres",
    );
  }
}
