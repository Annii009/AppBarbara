import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applySlideMove,
  createSolvedGrid,
  findBlank,
  generateSlidePuzzle,
  isSolved,
  OPPOSITE_DIRECTION,
  replaySlidePuzzle,
  type SlideDirection,
} from "./index.ts";

test("el tablero resuelto tiene 1-15 en orden y el hueco al final", () => {
  const grid = createSolvedGrid();
  assert.deepEqual(grid, [
    [1, 2, 3, 4],
    [5, 6, 7, 8],
    [9, 10, 11, 12],
    [13, 14, 15, 0],
  ]);
  assert.equal(isSolved(grid), true);
});

test("findBlank localiza el 0 en cualquier posicion", () => {
  const grid = createSolvedGrid();
  assert.deepEqual(findBlank(grid), { row: 3, col: 3 });
});

test("applySlideMove mueve el hueco y desliza la ficha vecina a su sitio", () => {
  const grid = createSolvedGrid();
  const { grid: next, moved } = applySlideMove(grid, "up");
  assert.equal(moved, true);
  assert.deepEqual(findBlank(next), { row: 2, col: 3 });
  // La ficha que estaba justo encima del hueco (12) ahora esta donde estaba el hueco.
  assert.equal(next[3]?.[3], 12);
  assert.equal(next[2]?.[3], 0);
});

test("applySlideMove no hace nada si el hueco ya esta en el borde de ese lado", () => {
  const grid = createSolvedGrid(); // hueco en la esquina inferior derecha
  const { grid: next, moved } = applySlideMove(grid, "down");
  assert.equal(moved, false);
  assert.deepEqual(next, grid);
});

test("deshacer una secuencia de movimientos (en orden inverso, con la direccion opuesta) resuelve el tablero", () => {
  const sequence: SlideDirection[] = ["left", "up", "left", "down", "right", "up"];
  let grid = createSolvedGrid();
  for (const direction of sequence) {
    grid = applySlideMove(grid, direction).grid;
  }
  assert.equal(isSolved(grid), false);

  for (const direction of [...sequence].reverse()) {
    grid = applySlideMove(grid, OPPOSITE_DIRECTION[direction]).grid;
  }
  assert.equal(isSolved(grid), true);
});

test("generateSlidePuzzle es determinista y siempre da una permutacion valida de 0-15", () => {
  const a = generateSlidePuzzle("slide-fixed-seed");
  const b = generateSlidePuzzle("slide-fixed-seed");
  assert.deepEqual(a, b);

  const values = a.flat().slice().sort((x, y) => x - y);
  assert.deepEqual(values, Array.from({ length: 16 }, (_, i) => i));
  assert.equal(isSolved(a), false);
});

test("semillas distintas barajan de forma distinta", () => {
  const a = generateSlidePuzzle("slide-seed-a");
  const b = generateSlidePuzzle("slide-seed-b");
  assert.notDeepEqual(a, b);
});

test("replaySlidePuzzle sin movimientos da el mismo tablero barajado que generateSlidePuzzle", () => {
  const seed = "slide-replay-seed";
  assert.deepEqual(replaySlidePuzzle(seed, []), generateSlidePuzzle(seed));
});

test("replaySlidePuzzle aplica de verdad los movimientos, no los ignora", () => {
  const seed = "slide-solve-seed";
  const scrambled = generateSlidePuzzle(seed);

  // Elige una direccion que se sepa valida desde donde este el hueco ahora
  // mismo (no siempre "arriba" lo es, depende de en que borde haya acabado
  // el barajado), para que la prueba no dependa de la posicion exacta.
  const blank = findBlank(scrambled);
  const direction: SlideDirection = blank.row > 0 ? "up" : "down";

  const afterOneMove = replaySlidePuzzle(seed, [direction]);
  assert.notDeepEqual(afterOneMove, scrambled);

  // Ir y volver dentro de la misma reproduccion deja el tablero igual que
  // no haber jugado nada: es la propiedad que hace que el servidor pueda
  // confiar en repetir la partida desde la semilla.
  const thereAndBack = replaySlidePuzzle(seed, [direction, OPPOSITE_DIRECTION[direction]]);
  assert.deepEqual(thereAndBack, scrambled);
});
