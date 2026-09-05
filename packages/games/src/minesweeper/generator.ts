import { createRng } from "@minibarbara/shared";
import type { MinesweeperGrid } from "./types.ts";

/** Tamano fijo del tablero: bastante grande para que dar con una casilla
 *  vacia de un tiron (con su cascada) se sienta bien, pero pequeno para que
 *  el reto diario se resuelva en un par de minutos. */
export const MINESWEEPER_ROWS = 8;
export const MINESWEEPER_COLS = 8;
export const MINESWEEPER_MINE_COUNT = 10;

/** Convierte (fila, columna) en un indice plano, y viceversa — asi el reto
 *  diario puede mandar la lista de casillas descubiertas como numeros
 *  simples en vez de pares. */
export function cellIndex(row: number, col: number): number {
  return row * MINESWEEPER_COLS + col;
}

export function cellRowCol(index: number): { row: number; col: number } {
  return { row: Math.floor(index / MINESWEEPER_COLS), col: index % MINESWEEPER_COLS };
}

function countAdjacentMines(mines: ReadonlySet<number>, row: number, col: number): number {
  let count = 0;
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = row + dr;
      const c = col + dc;
      if (r < 0 || r >= MINESWEEPER_ROWS || c < 0 || c >= MINESWEEPER_COLS) continue;
      if (mines.has(cellIndex(r, c))) count++;
    }
  }
  return count;
}

/** Genera el tablero completo (minas + contadores) a partir de una semilla:
 *  misma semilla, mismo tablero siempre, sin guardar nada. */
export function generateMinesweeperGrid(seed: string): MinesweeperGrid {
  const rng = createRng(seed);
  const totalCells = MINESWEEPER_ROWS * MINESWEEPER_COLS;
  const allIndices = Array.from({ length: totalCells }, (_, i) => i);
  const mines = new Set(rng.shuffle(allIndices).slice(0, MINESWEEPER_MINE_COUNT));

  return Array.from({ length: MINESWEEPER_ROWS }, (_, row) =>
    Array.from({ length: MINESWEEPER_COLS }, (_, col) => ({
      isMine: mines.has(cellIndex(row, col)),
      adjacentMines: countAdjacentMines(mines, row, col),
    })),
  );
}
