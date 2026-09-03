import type { NextFunction, Request, Response } from "express";
import { ApiError } from "../lib/api-error.ts";
import { SESSION_COOKIE_NAME, session } from "../lib/session.ts";

/** Exige sesion valida. Si pasa, deja `req.userId` listo para la ruta. */
export function requireAuth(req: Request, _res: Response, next: NextFunction): void {
  const token = req.cookies?.[SESSION_COOKIE_NAME] as string | undefined;
  const userId = token ? session.verify(token) : null;

  if (!userId) {
    next(ApiError.unauthorized());
    return;
  }

  req.userId = userId;
  next();
}
