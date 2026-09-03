import type { GridPosition, SudokuGrid, SudokuValue } from "./types.ts";

export const GRID_SIZE = 9;
export const BOX_SIZE = 3;

export function createEmptyGrid(): SudokuGrid {
  return Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(0) as SudokuValue[]);
}

export function cloneGrid(grid: SudokuGrid): SudokuGrid {
  return grid.map((row) => [...row]);
}

/**
 * ¿Puede `value` estar en (row, col) sin romper las reglas, dado el resto
 * del tablero tal cual esta ahora? La propia celda se ignora al comparar,
 * asi que tambien sirve para comprobar si un valor YA colocado esta en
 * conflicto con otra casilla (ver findConflicts).
 */
export function isPlacementValid(
  grid: SudokuGrid,
  row: number,
  col: number,
  value: SudokuValue,
): boolean {
  if (value === 0) return true;

  for (let i = 0; i < GRID_SIZE; i++) {
    if (i !== col && grid[row]?.[i] === value) return false;
    if (i !== row && grid[i]?.[col] === value) return false;
  }

  const boxRow = row - (row % BOX_SIZE);
  const boxCol = col - (col % BOX_SIZE);
  for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
    for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
      if ((r !== row || c !== col) && grid[r]?.[c] === value) return false;
    }
  }

  return true;
}

/** Valores que podrian ir en (row, col) sin romper las reglas ahora mismo. */
export function candidatesFor(grid: SudokuGrid, row: number, col: number): SudokuValue[] {
  const candidates: SudokuValue[] = [];
  for (let value = 1; value <= 9; value++) {
    if (isPlacementValid(grid, row, col, value)) candidates.push(value);
  }
  return candidates;
}

export function isGridComplete(grid: SudokuGrid): boolean {
  return grid.every((row) => row.every((cell) => cell !== 0));
}

/** Compara la cuadricula del jugador con la solucion, celda a celda. */
export function isSolutionCorrect(userGrid: SudokuGrid, solution: SudokuGrid): boolean {
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (userGrid[row]?.[col] !== solution[row]?.[col]) return false;
    }
  }
  return true;
}

/**
 * Cuantas veces (de las 9 posibles) esta `value` colocado correctamente en
 * el tablero -coincide con la solucion-. Sirve para "apagar" ese numero en
 * el teclado numerico en cuanto ya no queda ninguno mas por colocar, para no
 * liar a quien juega con un numero que ya no tiene sentido pulsar.
 */
export function countCorrectPlacements(
  grid: SudokuGrid,
  solution: SudokuGrid,
  value: SudokuValue,
): number {
  let count = 0;
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      if (grid[row]?.[col] === value && solution[row]?.[col] === value) count++;
    }
  }
  return count;
}

/** Casillas rellenas que ahora mismo violan alguna regla (para pintarlas en rojo mientras se juega). */
export function findConflicts(grid: SudokuGrid): GridPosition[] {
  const conflicts: GridPosition[] = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const value = grid[row]?.[col] ?? 0;
      if (value !== 0 && !isPlacementValid(grid, row, col, value)) {
        conflicts.push({ row, col });
      }
    }
  }
  return conflicts;
}
