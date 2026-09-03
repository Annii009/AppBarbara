import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cellsForPlacement,
  findMatchingPlacement,
  generateWordSearchPuzzle,
  straightLineBetween,
  WORD_SEARCH_THEMES,
} from "./index.ts";

for (const theme of WORD_SEARCH_THEMES) {
  test(`el tema "${theme.id}" coloca todas sus palabras`, () => {
    // Varias semillas: un fallo de colocacion puede depender del azar, asi
    // que una sola tirada no basta para confiar en el generador.
    for (const seed of ["a", "b", "c", "d", "e"]) {
      const puzzle = generateWordSearchPuzzle(`${theme.id}-${seed}`, theme.words);
      assert.equal(
        puzzle.words.length,
        theme.words.length,
        `semilla "${seed}": se esperaban ${theme.words.length} palabras, se colocaron ${puzzle.words.length}`,
      );
    }
  });

  test(`el tema "${theme.id}" produce una cuadricula completa y coherente`, () => {
    const puzzle = generateWordSearchPuzzle(`${theme.id}-coherence`, theme.words);

    for (const row of puzzle.grid) {
      for (const letter of row) {
        assert.match(letter, /^[A-Z]$/, "cada celda debe tener exactamente una letra A-Z");
      }
    }

    for (const placement of puzzle.placements) {
      const cells = cellsForPlacement(placement);
      const spelled = cells.map((c) => puzzle.grid[c.row]?.[c.col]).join("");
      assert.equal(spelled, placement.word, "las celdas de cada colocacion deben deletrear la palabra");
    }
  });

  test(`el tema "${theme.id}" es determinista por semilla`, () => {
    const a = generateWordSearchPuzzle(`${theme.id}-fixed`, theme.words);
    const b = generateWordSearchPuzzle(`${theme.id}-fixed`, theme.words);
    assert.deepEqual(a, b);
  });
}

test("straightLineBetween acepta horizontal, vertical y diagonal", () => {
  assert.deepEqual(straightLineBetween({ row: 2, col: 2 }, { row: 2, col: 5 }), [
    { row: 2, col: 2 },
    { row: 2, col: 3 },
    { row: 2, col: 4 },
    { row: 2, col: 5 },
  ]);
  assert.deepEqual(straightLineBetween({ row: 2, col: 2 }, { row: 5, col: 2 }), [
    { row: 2, col: 2 },
    { row: 3, col: 2 },
    { row: 4, col: 2 },
    { row: 5, col: 2 },
  ]);
  assert.deepEqual(straightLineBetween({ row: 2, col: 2 }, { row: 4, col: 4 }), [
    { row: 2, col: 2 },
    { row: 3, col: 3 },
    { row: 4, col: 4 },
  ]);
});

test("straightLineBetween rechaza un movimiento que no es linea recta", () => {
  assert.equal(straightLineBetween({ row: 2, col: 2 }, { row: 4, col: 5 }), null);
});

test("findMatchingPlacement encuentra la palabra en ambos sentidos de arrastre", () => {
  const puzzle = generateWordSearchPuzzle("match-test", ["HOLA"], 6);
  const placement = puzzle.placements[0];
  assert.ok(placement, "HOLA deberia haberse colocado en un tablero de sobra vacio");

  const cells = cellsForPlacement(placement);
  assert.equal(findMatchingPlacement(puzzle.placements, cells)?.word, "HOLA");
  assert.equal(findMatchingPlacement(puzzle.placements, [...cells].reverse())?.word, "HOLA");
});

test("findMatchingPlacement no encuentra nada para una seleccion que no es ninguna palabra", () => {
  const puzzle = generateWordSearchPuzzle("no-match-test", ["HOLA"], 6);
  const bogus = [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
  ];
  assert.equal(findMatchingPlacement(puzzle.placements, bogus), null);
});
