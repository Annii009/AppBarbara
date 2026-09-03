import type { ApiErrorCode } from "@minibarbara/shared";

/**
 * Error de negocio con codigo HTTP asociado.
 *
 * Cualquier fallo previsible (nick ocupado, contrasena incorrecta, partida no
 * encontrada) se lanza como ApiError. El middleware de errores lo traduce a la
 * respuesta uniforme del contrato. Todo lo demas que llegue al middleware se
 * considera un bug y se responde con 500 sin filtrar detalles al cliente.
 */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly fields: Record<string, string> | undefined;

  constructor(
    status: number,
    code: ApiErrorCode,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }

  static badRequest(message: string, fields?: Record<string, string>): ApiError {
    return new ApiError(400, "BAD_REQUEST", message, fields);
  }

  static unauthorized(message = "Necesitas iniciar sesion"): ApiError {
    return new ApiError(401, "UNAUTHORIZED", message);
  }

  static forbidden(message = "No tienes permiso para esto"): ApiError {
    return new ApiError(403, "FORBIDDEN", message);
  }

  static notFound(message = "No encontrado"): ApiError {
    return new ApiError(404, "NOT_FOUND", message);
  }

  static conflict(message: string, fields?: Record<string, string>): ApiError {
    return new ApiError(409, "CONFLICT", message, fields);
  }
}
