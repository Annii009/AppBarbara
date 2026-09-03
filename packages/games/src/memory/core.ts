import type { MemoryCard } from "./types.ts";

/** Dos cartas distintas con el mismo simbolo forman pareja. */
export function isMatch(a: MemoryCard, b: MemoryCard): boolean {
  return a.id !== b.id && a.symbolId === b.symbolId;
}

/** El memorama esta resuelto cuando todas las cartas estan emparejadas. */
export function isPuzzleSolved(
  cards: readonly MemoryCard[],
  matchedIds: ReadonlySet<string>,
): boolean {
  return cards.every((card) => matchedIds.has(card.id));
}
