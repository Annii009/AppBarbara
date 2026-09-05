import { createRng } from "@minibarbara/shared";
import { applySlideMove, createSolvedGrid, OPPOSITE_DIRECTION } from "./core.ts";
import type { SlideDirection, SlideGrid } from "./types.ts";

const ALL_DIRECTIONS: readonly SlideDirection[] = ["up", "down", "left", "right"];

/** Cuantos movimientos validos al azar se aplican para barajar, partiendo
 *  siempre del tablero resuelto. Barajar asi (en vez de una permutacion al
 *  azar de las 16 casillas) garantiza que el tablero SIEMPRE tiene
 *  solucion: el 15-puzzle clasico tiene la mitad de permutaciones posibles
 *  sin solucion (problema de paridad), pero cualquier cosa alcanzable desde
 *  el tablero resuelto moviendo piezas, por definicion, se puede deshacer. */
const SCRAMBLE_MOVES = 80;

/** Genera el tablero barajado del reto de hoy a partir de una semilla:
 *  misma semilla, mismo barajado siempre. Nunca deshace el ultimo
 *  movimiento aplicado (evita desperdiciar barajado en un vaiven inutil). */
export function generateSlidePuzzle(seed: string): SlideGrid {
  const rng = createRng(seed);
  let grid = createSolvedGrid();
  let lastDirection: SlideDirection | null = null;

  for (let i = 0; i < SCRAMBLE_MOVES; i++) {
    const options = ALL_DIRECTIONS.filter(
      (direction) => !lastDirection || direction !== OPPOSITE_DIRECTION[lastDirection],
    );
    const direction = rng.pick(options);
    const result = applySlideMove(grid, direction);
    if (result.moved) {
      grid = result.grid;
      lastDirection = direction;
    }
  }

  return grid;
}

/**
 * Reproduce la partida entera a partir de la semilla y la lista de
 * direcciones jugadas: mismo mecanismo que 2048 (`replayGame2048`) para que
 * el servidor pueda verificar que el tablero resuelto enviado es real, sin
 * haber guardado ningun puzzle.
 */
export function replaySlidePuzzle(seed: string, moves: readonly SlideDirection[]): SlideGrid {
  let grid = generateSlidePuzzle(seed);
  for (const direction of moves) {
    grid = applySlideMove(grid, direction).grid;
  }
  return grid;
}
