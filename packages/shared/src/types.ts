/**
 * Contrato compartido entre cliente y servidor.
 *
 * Todo lo que viaja por HTTP se define aqui una sola vez. Si el servidor cambia
 * la forma de una respuesta y el cliente no se adapta, el typecheck falla en
 * lugar de romperse en tiempo de ejecucion delante del usuario.
 */

/** Identificadores de los minijuegos. Se va ampliando fase a fase. */
export const GAME_IDS = ["sudoku", "wordsearch", "memory", "2048", "simon"] as const;
export type GameId = (typeof GAME_IDS)[number];

/** Que minijuegos tienen soporte de reto diario (verificado por el
 *  servidor). Puede ser un subconjunto de GAME_IDS si en el futuro se anade
 *  un juego que todavia no tenga ese soporte construido. */
export const DAILY_GAME_IDS = [
  "sudoku",
  "wordsearch",
  "memory",
  "2048",
  "simon",
] as const satisfies readonly GameId[];

/** Dificultad comun a todos los minijuegos. */
export const DIFFICULTIES = ["easy", "medium", "hard"] as const;
export type Difficulty = (typeof DIFFICULTIES)[number];

// ---------------------------------------------------------------------------
// Usuario y perfil
// ---------------------------------------------------------------------------

import type { AvatarConfig } from "./avatar-catalog.ts";

/** Usuario tal y como lo ve el cliente. Nunca incluye el hash de contrasena. */
export interface PublicUser {
  id: string;
  nick: string;
  /** Codigo corto para que las amigas te agreguen. Ej: "BRB-7K2Q". */
  friendCode: string;
  createdAt: string;
}

/** Usuario + su avatar. Es lo que devuelve /api/me y las rutas de auth.
 *  La forma de AvatarConfig vive en avatar-catalog.ts, junto al catalogo que
 *  define que valores son validos. */
export interface Profile {
  user: PublicUser;
  avatar: AvatarConfig;
}

// ---------------------------------------------------------------------------
// Autenticacion
// ---------------------------------------------------------------------------

export interface RegisterRequest {
  nick: string;
  password: string;
}

export interface LoginRequest {
  nick: string;
  password: string;
}

// ---------------------------------------------------------------------------
// Respuestas de la API
// ---------------------------------------------------------------------------

/** Sobre de error uniforme. Cualquier fallo del servidor tiene esta forma. */
export interface ApiErrorBody {
  error: {
    code: ApiErrorCode;
    message: string;
    /** Errores por campo, para pintarlos junto al input correspondiente. */
    fields?: Record<string, string>;
  };
}

export type ApiErrorCode =
  | "BAD_REQUEST"
  | "UNAUTHORIZED"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "CONFLICT"
  | "RATE_LIMITED"
  | "INTERNAL";

export interface HealthResponse {
  status: "ok";
  version: string;
  /** Fecha del "dia de juego" en curso, ver seed.ts. */
  gameDay: string;
  db: "ok" | "error";
}

// ---------------------------------------------------------------------------
// Progreso en el mapa
// ---------------------------------------------------------------------------

/** Nodos del mapa que el usuario ya ha completado. */
export interface ProgressResponse {
  completedNodeIds: string[];
}

export interface CompleteNodeRequest {
  nodeId: string;
}

// ---------------------------------------------------------------------------
// Reto diario
// ---------------------------------------------------------------------------

export interface DailyStatus {
  gameDay: string;
  /** Que minijuego toca hoy: se elige deterministamente por fecha, no es
   *  siempre el mismo (ver pickDailyGameId en seed.ts). */
  gameId: GameId;
  completed: boolean;
  elapsedMs: number | null;
  /** Dias consecutivos completando el reto, contando hoy si ya esta hecho. */
  streak: number;
}

/**
 * Payload de completar el reto diario: el campo relevante depende de que
 * gameId toque ese dia (ver DailyStatus.gameId). El servidor sabe cual
 * espera y rechaza la peticion si falta.
 */
export interface CompleteDailyRequest {
  elapsedMs: number;
  /** sudoku: la cuadricula resuelta. */
  grid?: number[][];
  /** wordsearch: las palabras encontradas. */
  foundWords?: string[];
  /** memory: cuantas parejas se encontraron. */
  matchedPairs?: number;
  /** 2048: la secuencia de movimientos jugada, de principio a fin. */
  moves?: string[];
  /** simon: la secuencia de botones pulsada en el intento mas largo logrado. */
  sequence?: number[];
}

export interface LeaderboardEntry {
  nick: string;
  elapsedMs: number;
  isMe: boolean;
}

export interface DailyLeaderboardResponse {
  gameDay: string;
  entries: LeaderboardEntry[];
}

export interface DailyHistoryEntry {
  gameDay: string;
  gameId: GameId;
  completed: boolean;
  elapsedMs: number | null;
}

/** Los ultimos dias del reto diario, del mas reciente al mas antiguo — el
 *  "historial" tipo LinkedIn Games. */
export interface DailyHistoryResponse {
  entries: DailyHistoryEntry[];
}

// ---------------------------------------------------------------------------
// Amigas
// ---------------------------------------------------------------------------

export interface Friend {
  id: string;
  nick: string;
  friendCode: string;
  avatar: AvatarConfig;
}

export interface FriendsResponse {
  friends: Friend[];
}

export interface AddFriendRequest {
  friendCode: string;
}

// ---------------------------------------------------------------------------
// Chat entre amigas
// ---------------------------------------------------------------------------

export interface ChatMessage {
  id: string;
  senderId: string;
  body: string;
  createdAt: string;
}

export interface ChatResponse {
  friend: Friend;
  messages: ChatMessage[];
}

export interface SendMessageRequest {
  body: string;
}
