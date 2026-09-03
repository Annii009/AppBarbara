import { createRng, type Rng } from "@minibarbara/shared";
import { applyMove, createEmptyGrid2048, spawnTile } from "./core.ts";
import type { Direction, Game2048State } from "./types.ts";

/** Objetivo del reto diario: llegar a esta ficha. 2048 "de verdad" puede
 *  llevar mucho rato; 512 es un objetivo real pero alcanzable en una sesion,
 *  del orden de dificultad de un sudoku medio. */
export const DAILY_TARGET_TILE = 512;

export function createInitialGame2048(seed: string): { state: Game2048State; rng: Rng } {
  const rng = createRng(seed);
  let grid = createEmptyGrid2048();
  grid = spawnTile(grid, rng);
  grid = spawnTile(grid, rng);
  return { state: { grid, score: 0 }, rng };
}

/**
 * Reproduce una partida entera a partir de una semilla y la lista de
 * movimientos. Es lo que permite verificar en el servidor que una
 * puntuacion enviada es real: los mismos movimientos, sobre la misma
 * semilla, siempre dan exactamente el mismo resultado (misma fichas nuevas
 * en el mismo orden), asi que no hay forma de fabricar un resultado sin
 * haber jugado esa secuencia de verdad.
 */
export function replayGame2048(seed: string, moves: readonly Direction[]): Game2048State {
  const { state: initialState, rng } = createInitialGame2048(seed);
  let state = initialState;

  for (const direction of moves) {
    const result = applyMove(state.grid, direction);
    if (!result.moved) continue; // un movimiento que no cambia nada no gasta turno
    state = {
      grid: spawnTile(result.grid, rng),
      score: state.score + result.scoreGained,
    };
  }

  return state;
}
