import assert from "node:assert/strict";
import { test } from "node:test";
import {
  applyMove,
  createInitialGame2048,
  getMaxTile,
  hasMovesAvailable,
  replayGame2048,
} from "./index.ts";
import type { Grid2048 } from "./types.ts";

function grid(rows: number[][]): Grid2048 {
  return rows;
}

test("desliza y junta hacia la izquierda, sin fusionar tres en una", () => {
  const result = applyMove(grid([[2, 2, 2, 2], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), "left");
  assert.deepEqual(result.grid[0], [4, 4, 0, 0]);
  assert.equal(result.scoreGained, 8);
  assert.equal(result.moved, true);
});

test("comprime huecos hacia la derecha sin fusionar si no coinciden", () => {
  const result = applyMove(grid([[2, 0, 0, 4], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), "right");
  assert.deepEqual(result.grid[0], [0, 0, 2, 4]);
  assert.equal(result.scoreGained, 0);
});

test("un movimiento que no cambia nada se marca como moved:false", () => {
  const result = applyMove(grid([[2, 4, 8, 16], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0]]), "left");
  assert.equal(result.moved, false);
});

test("mover hacia arriba junta por columnas", () => {
  const result = applyMove(
    grid([
      [2, 0, 0, 0],
      [2, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ]),
    "up",
  );
  assert.equal(result.grid[0]?.[0], 4);
  assert.equal(result.grid[1]?.[0], 0);
  assert.equal(result.scoreGained, 4);
});

test("hasMovesAvailable es true si hay hueco, aunque no haya parejas", () => {
  const full = grid([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 0, 4],
    [4, 2, 4, 2],
  ]);
  assert.equal(hasMovesAvailable(full), true);
});

test("hasMovesAvailable es false sin huecos y sin parejas adyacentes", () => {
  const stuck = grid([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 2, 4],
    [4, 2, 4, 2],
  ]);
  assert.equal(hasMovesAvailable(stuck), false);
});

test("hasMovesAvailable es true sin huecos si hay parejas adyacentes", () => {
  const almostStuck = grid([
    [2, 4, 2, 4],
    [4, 2, 4, 2],
    [2, 4, 4, 2],
    [4, 2, 2, 4],
  ]);
  assert.equal(hasMovesAvailable(almostStuck), true);
});

test("getMaxTile encuentra la ficha mas alta", () => {
  assert.equal(getMaxTile(grid([[2, 4, 0, 0], [0, 0, 16, 0], [0, 0, 0, 0], [0, 0, 0, 0]])), 16);
});

test("createInitialGame2048 arranca con exactamente dos fichas", () => {
  const { state } = createInitialGame2048("2048-seed-1");
  const filled = state.grid.flat().filter((v) => v !== 0);
  assert.equal(filled.length, 2);
  assert.equal(state.score, 0);
});

test("replayGame2048 es determinista: misma semilla y movimientos, mismo resultado", () => {
  const moves = ["left", "up", "right", "down", "left", "up"] as const;
  const a = replayGame2048("2048-replay-seed", moves);
  const b = replayGame2048("2048-replay-seed", moves);
  assert.deepEqual(a, b);
});

test("replayGame2048 con movimientos distintos da resultados distintos", () => {
  const a = replayGame2048("2048-diverge-seed", ["left", "up"]);
  const b = replayGame2048("2048-diverge-seed", ["right", "down"]);
  assert.notDeepEqual(a, b);
});
