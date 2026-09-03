import type { NextFunction, Request, Response } from "express";
import type { ApiErrorBody } from "@minibarbara/shared";
import { ApiError } from "../lib/api-error.ts";
import { env } from "../config/env.ts";

/** 404 para rutas de API que no existen. Va justo antes del errorHandler. */
export function notFoundHandler(_req: Request, _res: Response, next: NextFunction): void {
  next(ApiError.notFound("Esa ruta de la API no existe"));
}

/**
 * Ultimo eslabon de la cadena: convierte cualquier error en la respuesta
 * uniforme del contrato.
 *
 * Express 4 identifica el manejador de errores por tener 4 parametros, asi que
 * `next` debe estar declarado aunque no se use.
 */
export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof ApiError) {
    const body: ApiErrorBody = {
      error: {
        code: err.code,
        message: err.message,
        ...(err.fields ? { fields: err.fields } : {}),
      },
    };
    res.status(err.status).json(body);
    return;
  }

  // Error no previsto: es un bug nuestro. Lo registramos entero en el servidor
  // pero al cliente solo le llega un mensaje generico, para no filtrar rutas de
  // archivos, consultas SQL ni trazas de pila.
  console.error("[error] fallo no controlado:", err);

  const body: ApiErrorBody = {
    error: {
      code: "INTERNAL",
      message: env.isProduction
        ? "Algo ha ido mal por nuestra parte. Intentalo de nuevo."
        : `Fallo interno: ${err instanceof Error ? err.message : String(err)}`,
    },
  };
  res.status(500).json(body);
}
