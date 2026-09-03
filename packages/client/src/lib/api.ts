import { API_BASE_PATH, type ApiErrorBody } from "@minibarbara/shared";

/**
 * Cliente HTTP unico de la app.
 *
 * Todas las llamadas a la API pasan por aqui. Centralizarlo significa que
 * cuando anadamos sesion, reintentos o un estado global de "sin conexion", se
 * toca un solo archivo en lugar de cada componente.
 */

/** Error con la informacion que el servidor envio, ya desempaquetada. */
export class ApiRequestError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: Record<string, string> | undefined;

  constructor(
    status: number,
    code: string,
    message: string,
    fields?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  body?: unknown;
  signal?: AbortSignal;
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, signal } = options;

  let response: Response;
  try {
    response = await fetch(`${API_BASE_PATH}${path}`, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body === undefined ? undefined : JSON.stringify(body),
      // Manda la cookie de sesion en cada peticion (la usaremos al anadir auth).
      credentials: "include",
      ...(signal ? { signal } : {}),
    });
  } catch (cause) {
    // fetch solo rechaza por fallo de red, no por codigos 4xx/5xx. Aqui es
    // literalmente "no se ha podido contactar con el servidor".
    throw new ApiRequestError(
      0,
      "NETWORK",
      "No hemos podido conectar con el servidor. Comprueba tu conexion.",
      undefined,
    );
  }

  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const parsed = payload as ApiErrorBody | null;
    throw new ApiRequestError(
      response.status,
      parsed?.error.code ?? "INTERNAL",
      parsed?.error.message ?? "Ha ocurrido un error inesperado.",
      parsed?.error.fields,
    );
  }

  return payload as T;
}

export const api = {
  get: <T>(path: string, signal?: AbortSignal): Promise<T> =>
    request<T>(path, signal ? { signal } : {}),
  post: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: "POST", ...(body === undefined ? {} : { body }) }),
  patch: <T>(path: string, body?: unknown): Promise<T> =>
    request<T>(path, { method: "PATCH", ...(body === undefined ? {} : { body }) }),
  delete: <T>(path: string): Promise<T> => request<T>(path, { method: "DELETE" }),
};
