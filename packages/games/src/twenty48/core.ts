import type { Rng } from "@minibarbara/shared";
import type { Direction, Grid2048 } from "./types.ts";

// No exportado: "GRID_SIZE" ya lo exporta el motor de sudoku (9x9), y
// reexportar los dos desde el barrel raiz de packages/games chocaria. Este
// motor no necesita que nadie de fuera lo use.
const GRID_SIZE = 4;

export function createEmptyGrid2048(): Grid2048 {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0) as number[]);
}

export function cloneGrid2048(grid: Grid2048): Grid2048 {
  return grid.map((row) => [...row]);
}

function emptyCells(grid: Grid2048): Array<{ row: number; col: number }> {
  const cells: Array<{ row: number; col: number }> = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row]?.[col] === 0) cells.push({ row, col });
    }
  }
  return cells;
}

/** Coloca una ficha nueva (2 el 90% de las veces, 4 el resto) en una celda
 *  vacia al azar. Si no queda ninguna vacia, devuelve la cuadricula igual. */
export function spawnTile(grid: Grid2048, rng: Rng): Grid2048 {
  const cells = emptyCells(grid);
  if (cells.length === 0) return grid;

  const { row, col } = rng.pick(cells);
  const next = cloneGrid2048(grid);
  const targetRow = next[row];
  if (targetRow) targetRow[col] = rng.next() < 0.9 ? 2 : 4;
  return next;
}

function arraysEqual(a: readonly number[], b: readonly number[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i]);
}

/**
 * Comprime una fila hacia la izquierda y fusiona parejas iguales una sola
 * vez cada una (asi [2,2,2,2] da [4,4,0,0], no [8,0,0,0]). Es el nucleo del
 * que salen los cuatro movimientos, rotando la cuadricula segun la
 * direccion antes de llamar a esto.
 */
function compressAndMergeLeft(line: readonly number[]): { line: number[]; scoreGained: number } {
  const nonZero = line.filter((value) => value !== 0);
  const merged: number[] = [];
  let scoreGained = 0;
  let i = 0;

  while (i < nonZero.length) {
    const current = nonZero[i] as number;
    const next = nonZero[i + 1];
    if (next !== undefined && next === current) {
      const mergedValue = current * 2;
      merged.push(mergedValue);
      scoreGained += mergedValue;
      i += 2;
    } else {
      merged.push(current);
      i += 1;
    }
  }

  while (merged.length < line.length) merged.push(0);
  return { line: merged, scoreGained };
}

function getColumn(grid: Grid2048, col: number): number[] {
  return grid.map((row) => row[col] ?? 0);
}

function setColumn(grid: Grid2048, col: number, values: readonly number[]): Grid2048 {
  return grid.map((row, i) => {
    const next = [...row];
    next[col] = values[i] ?? 0;
    return next;
  });
}

export interface MoveResult {
  grid: Grid2048;
  scoreGained: number;
  /** Si nada se movio (todas las fichas ya estaban donde tocaba), no se
   *  debe generar ficha nueva: es la regla clasica de 2048. */
  moved: boolean;
}

export function applyMove(grid: Grid2048, direction: Direction): MoveResult {
  let scoreGained = 0;
  let moved = false;
  let next = cloneGrid2048(grid);

  if (direction === "left" || direction === "right") {
    next = next.map((row) => {
      const source = direction === "right" ? [...row].reverse() : row;
      const { line, scoreGained: gained } = compressAndMergeLeft(source);
      scoreGained += gained;
      const result = direction === "right" ? [...line].reverse() : line;
      if (!moved && !arraysEqual(result, row)) moved = true;
      return result;
    });
  } else {
    for (let col = 0; col < GRID_SIZE; col++) {
      const source = getColumn(next, col);
      const oriented = direction === "down" ? [...source].reverse() : source;
      const { line, scoreGained: gained } = compressAndMergeLeft(oriented);
      scoreGained += gained;
      const result = direction === "down" ? [...line].reverse() : line;
      if (!moved && !arraysEqual(result, source)) moved = true;
      next = setColumn(next, col, result);
    }
  }

  return { grid: next, scoreGained, moved };
}

/** ¿Queda algun movimiento posible? Si hay una celda vacia, o dos fichas
 *  iguales adyacentes en cualquier direccion, todavia se puede jugar. */
export function hasMovesAvailable(grid: Grid2048): boolean {
  if (emptyCells(grid).length > 0) return true;

  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row]?.[col];
      if (col < GRID_SIZE - 1 && grid[row]?.[col + 1] === value) return true;
      if (row < GRID_SIZE - 1 && grid[row + 1]?.[col] === value) return true;
    }
  }
  return false;
}

export function getMaxTile(grid: Grid2048): number {
  return Math.max(0, ...grid.flat());
}
