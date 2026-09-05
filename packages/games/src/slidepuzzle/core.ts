import type { SlideDirection, SlideGrid } from "./types.ts";

// No exportado: ya hay un "GRID_SIZE" de 9 (sudoku) y uno de 4 (2048, tampoco
// exportado por el mismo motivo) — cada motor cuadriculado se queda el suyo
// en privado para que el barrel de packages/games no choque.
const GRID_SIZE = 4;

export function createSolvedGrid(): SlideGrid {
  const grid: SlideGrid = [];
  let value = 1;
  for (let row = 0; row < GRID_SIZE; row++) {
    const line: number[] = [];
    for (let col = 0; col < GRID_SIZE; col++) {
      line.push(row === GRID_SIZE - 1 && col === GRID_SIZE - 1 ? 0 : value++);
    }
    grid.push(line);
  }
  return grid;
}

export function findBlank(grid: SlideGrid): { row: number; col: number } {
  for (let row = 0; row < grid.length; row++) {
    const col = grid[row]?.indexOf(0) ?? -1;
    if (col !== -1) return { row, col };
  }
  throw new Error("slidepuzzle: no hay ningun hueco (0) en la cuadricula");
}

const DELTA: Record<SlideDirection, { dr: number; dc: number }> = {
  up: { dr: -1, dc: 0 },
  down: { dr: 1, dc: 0 },
  left: { dr: 0, dc: -1 },
  right: { dr: 0, dc: 1 },
};

export const OPPOSITE_DIRECTION: Record<SlideDirection, SlideDirection> = {
  up: "down",
  down: "up",
  left: "right",
  right: "left",
};

export interface SlideMoveResult {
  grid: SlideGrid;
  moved: boolean;
}

/**
 * Mueve el HUECO en la direccion dada (equivale a deslizar la ficha vecina
 * en la direccion contraria). Si el hueco ya esta en el borde de ese lado,
 * no hay nada que mover: `moved` sale en falso y la cuadricula vuelve igual.
 */
export function applySlideMove(grid: SlideGrid, direction: SlideDirection): SlideMoveResult {
  const { row, col } = findBlank(grid);
  const { dr, dc } = DELTA[direction];
  const targetRow = row + dr;
  const targetCol = col + dc;

  if (targetRow < 0 || targetRow >= GRID_SIZE || targetCol < 0 || targetCol >= GRID_SIZE) {
    return { grid, moved: false };
  }

  const next = grid.map((line) => [...line]);
  const blankRow = next[row] as number[];
  const targetRowArr = next[targetRow] as number[];
  const movedValue = targetRowArr[targetCol] as number;
  targetRowArr[targetCol] = 0;
  blankRow[col] = movedValue;

  return { grid: next, moved: true };
}

export function isSolved(grid: SlideGrid): boolean {
  const solved = createSolvedGrid();
  return grid.every((line, row) => line.every((value, col) => value === solved[row]?.[col]));
}
