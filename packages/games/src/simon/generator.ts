import { createRng } from "@minibarbara/shared";
import type { SimonButton } from "./types.ts";

/** Objetivo del reto diario: repetir correctamente una secuencia de esta
 *  longitud (cada ronda repite la secuencia entera desde el principio, como
 *  el juego clasico, asi que la ultima ronda es la que de verdad cuenta). */
export const DAILY_TARGET_ROUNDS = 10;

/** Genera la secuencia objetivo completa a partir de una semilla: misma
 *  semilla, misma secuencia siempre. */
export function generateSimonSequence(seed: string, length: number): SimonButton[] {
  const rng = createRng(seed);
  return Array.from({ length }, () => rng.int(0, 3) as SimonButton);
}
