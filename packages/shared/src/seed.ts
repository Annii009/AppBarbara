/**
 * Aleatoriedad determinista.
 *
 * Es la pieza que hace que el reto diario sea el mismo para todo el mundo sin
 * guardar ni un solo puzzle en la base de datos: de la fecha sale una semilla,
 * de la semilla sale el puzzle. Cliente y servidor generan exactamente el mismo
 * tablero a partir del mismo string, asi que el servidor puede verificar una
 * solucion sin haber almacenado nada.
 *
 * Regla de oro: los motores de minijuegos NUNCA usan Math.random(). Siempre
 * reciben un Rng creado aqui. Si alguna vez ves Math.random() dentro de
 * packages/games, es un bug: el puzzle dejaria de ser reproducible.
 */

import { DAILY_GAME_IDS, type GameId } from "./types.ts";

/** Generador de numeros pseudoaleatorios reproducible. */
export interface Rng {
  /** Decimal en [0, 1). */
  next(): number;
  /** Entero en [min, max], ambos incluidos. */
  int(min: number, max: number): number;
  /** Elemento al azar de un array no vacio. */
  pick<T>(items: readonly T[]): T;
  /** Copia barajada (Fisher-Yates). No muta el original. */
  shuffle<T>(items: readonly T[]): T[];
}

/** Hash de string a entero de 32 bits (xmur3). Convierte texto en semilla. */
function hashSeed(text: string): number {
  let h = 1779033703 ^ text.length;
  for (let i = 0; i < text.length; i++) {
    h = Math.imul(h ^ text.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507);
  h = Math.imul(h ^ (h >>> 13), 3266489909);
  return (h ^= h >>> 16) >>> 0;
}

/**
 * Crea un Rng a partir de cualquier string.
 * Mismo string => misma secuencia de numeros, siempre y en cualquier maquina.
 */
export function createRng(seed: string): Rng {
  // mulberry32: rapido, sin dependencias y con distribucion suficiente para
  // generar puzzles. No es criptografico y no debe usarse para tokens.
  let state = hashSeed(seed);

  const next = (): number => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };

  const int = (min: number, max: number): number =>
    min + Math.floor(next() * (max - min + 1));

  return {
    next,
    int,
    pick<T>(items: readonly T[]): T {
      if (items.length === 0) {
        throw new Error("rng.pick: el array no puede estar vacio");
      }
      return items[int(0, items.length - 1)] as T;
    },
    shuffle<T>(items: readonly T[]): T[] {
      const copy = [...items];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = int(0, i);
        [copy[i], copy[j]] = [copy[j] as T, copy[i] as T];
      }
      return copy;
    },
  };
}

/**
 * Dia de juego en curso, en formato YYYY-MM-DD y en UTC.
 *
 * Usamos UTC a proposito: si cada usuario calculase el dia en su zona horaria,
 * dos amigas en paises distintos verian retos diferentes y el ranking del dia
 * no tendria sentido. A cambio, el reto cambia a medianoche UTC (01:00 o 02:00
 * en Espana peninsular segun la epoca del ano).
 */
export function currentGameDay(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

/** Semilla canonica del reto diario de un juego concreto. */
export function dailySeed(gameId: string, gameDay: string): string {
  return `daily:${gameId}:${gameDay}`;
}

/**
 * Que minijuego toca de reto diario hoy: se elige deterministamente a partir
 * de la fecha, alternando entre los juegos con soporte de reto diario en vez
 * de ser siempre el mismo. Cliente y servidor llaman a esta misma funcion,
 * asi que siempre coinciden sin necesidad de que el servidor le diga nada al
 * cliente por adelantado.
 */
export function pickDailyGameId(gameDay: string): GameId {
  return createRng(`daily-game-picker:${gameDay}`).pick(DAILY_GAME_IDS);
}
