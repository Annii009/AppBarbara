import assert from "node:assert/strict";
import { test } from "node:test";
import { generateMemoryPuzzle, isMatch, isPuzzleSolved, MEMORY_SYMBOLS } from "./index.ts";

test("genera el numero de parejas pedido, cada una exactamente dos veces", () => {
  const { cards } = generateMemoryPuzzle("memory-seed-1", 8);
  assert.equal(cards.length, 16);

  const counts = new Map<string, number>();
  for (const card of cards) {
    counts.set(card.symbolId, (counts.get(card.symbolId) ?? 0) + 1);
  }
  assert.equal(counts.size, 8);
  for (const count of counts.values()) {
    assert.equal(count, 2);
  }
});

test("todas las cartas tienen un id unico", () => {
  const { cards } = generateMemoryPuzzle("memory-seed-2", 8);
  const ids = new Set(cards.map((c) => c.id));
  assert.equal(ids.size, cards.length);
});

test("no pide mas parejas de las que hay simbolos en el catalogo", () => {
  const { cards } = generateMemoryPuzzle("memory-seed-3", 999);
  assert.equal(cards.length, MEMORY_SYMBOLS.length * 2);
});

test("la misma semilla siempre da el mismo orden de cartas", () => {
  const a = generateMemoryPuzzle("memory-fixed-seed", 8);
  const b = generateMemoryPuzzle("memory-fixed-seed", 8);
  assert.deepEqual(a, b);
});

test("semillas distintas barajan distinto", () => {
  const a = generateMemoryPuzzle("memory-seed-a", 8);
  const b = generateMemoryPuzzle("memory-seed-b", 8);
  assert.notDeepEqual(a.cards, b.cards);
});

test("isMatch reconoce pareja valida y rechaza la misma carta consigo misma", () => {
  const { cards } = generateMemoryPuzzle("memory-match-test", 8);
  const first = cards[0];
  const partner = cards.find((c) => c.id !== first?.id && c.symbolId === first?.symbolId);
  assert.ok(first && partner, "deberia existir una pareja para la primera carta");
  assert.equal(isMatch(first, partner), true);
  assert.equal(isMatch(first, first), false);
});

test("isMatch rechaza dos cartas con simbolos distintos", () => {
  const { cards } = generateMemoryPuzzle("memory-mismatch-test", 8);
  const first = cards[0];
  const other = cards.find((c) => c.symbolId !== first?.symbolId);
  assert.ok(first && other);
  assert.equal(isMatch(first, other), false);
});

test("isPuzzleSolved solo es verdad cuando todas las cartas estan emparejadas", () => {
  const { cards } = generateMemoryPuzzle("memory-solved-test", 4);
  const allIds = cards.map((c) => c.id);

  assert.equal(isPuzzleSolved(cards, new Set()), false);
  assert.equal(isPuzzleSolved(cards, new Set(allIds.slice(0, allIds.length - 1))), false);
  assert.equal(isPuzzleSolved(cards, new Set(allIds)), true);
});
