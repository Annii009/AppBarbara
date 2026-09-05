/**
 * Contrato compartido entre cliente y servidor.
 *
 * Todo lo que viaja por HTTP se define aqui una sola vez. Si el servidor cambia
 * la forma de una respuesta y el cliente no se adapta, el typecheck falla en
 * lugar de romperse en tiempo de ejecucion delante del usuario.
 */

/** Identificadores de los minijuegos. Se va ampliando fase a fase. */
export const GAME_IDS = [
  "sudoku",
  "wordsearch",
  "memory",
  "2048",
  "simon",
  "wordguess",
  "minesweeper",
  "slidepuzzle",
  "trivia",
] as const;
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
  "wordguess",
  "minesweeper",
  "slidepuzzle",
  "trivia",
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
// Reto diario
//
// Cada minijuego tiene SU PROPIO reto diario, simultaneo con los demas (no
// uno solo que rota de juego en juego): cada uno con su propia semilla del
// dia, su propia racha y su propio ranking entre amigas. Todos cambian a la
// vez a medianoche UTC (ver currentGameDay en seed.ts).
// ---------------------------------------------------------------------------

export interface DailyStatus {
  gameId: GameId;
  gameDay: string;
  completed: boolean;
  elapsedMs: number | null;
  /** Dias consecutivos completando ESTE juego, contando hoy si ya esta hecho. */
  streak: number;
}

/** El estado de los 5 retos diarios de hoy, de una vez. */
export interface DailyStatusResponse {
  gameDay: string;
  statuses: DailyStatus[];
}

/**
 * Payload de completar el reto diario de un juego concreto: el campo
 * relevante depende de gameId. El servidor sabe cual espera y rechaza la
 * peticion si falta.
 */
export interface CompleteDailyRequest {
  gameId: GameId;
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
  /** wordguess: los intentos de palabra, de principio a fin (el ultimo debe
   *  ser la palabra secreta para contar como completado). */
  guesses?: string[];
  /** minesweeper: indices (fila*columnas + columna) de todas las casillas
   *  descubiertas al ganar. */
  revealed?: number[];
  /** trivia: la opcion elegida (su indice) para cada pregunta de hoy, en el
   *  mismo orden en que se sirvieron. */
  answers?: number[];
}

export interface LeaderboardEntry {
  nick: string;
  elapsedMs: number;
  isMe: boolean;
}

export interface DailyLeaderboardResponse {
  gameId: GameId;
  gameDay: string;
  entries: LeaderboardEntry[];
}

/** Como fue un juego concreto en un dia concreto — una celda del historial. */
export interface DailyHistoryGameEntry {
  gameId: GameId;
  completed: boolean;
  elapsedMs: number | null;
}

/** Un dia del historial, con los 5 juegos de ese dia. */
export interface DailyHistoryDay {
  gameDay: string;
  games: DailyHistoryGameEntry[];
}

/** Los ultimos dias, del mas reciente al mas antiguo — el "historial" tipo
 *  LinkedIn Games, pero con los 5 juegos de cada dia en vez de solo uno. */
export interface DailyHistoryResponse {
  days: DailyHistoryDay[];
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
