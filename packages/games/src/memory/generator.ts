import { createRng } from "@minibarbara/shared";
import { MEMORY_SYMBOLS } from "./symbols.ts";
import type { MemoryCard, MemoryPuzzle } from "./types.ts";

/** Numero de parejas del reto diario: la dificultad "media" de la practica libre. */
export const DAILY_PAIR_COUNT = 8;

/**
 * Genera un memorama a partir de una semilla: mismo seed + mismo numero de
 * parejas siempre dan exactamente el mismo orden de cartas.
 */
export function generateMemoryPuzzle(seed: string, pairCount = 8): MemoryPuzzle {
  const rng = createRng(seed);

  const count = Math.min(pairCount, MEMORY_SYMBOLS.length);
  const chosenSymbols = rng.shuffle(MEMORY_SYMBOLS).slice(0, count);

  const cards: MemoryCard[] = chosenSymbols.flatMap((symbolId, index) => [
    { id: `${index}-a`, symbolId },
    { id: `${index}-b`, symbolId },
  ]);

  return { cards: rng.shuffle(cards) };
}
