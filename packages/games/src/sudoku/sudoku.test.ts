import assert from "node:assert/strict";
import { test } from "node:test";
import { DIFFICULTIES, type Difficulty } from "@minibarbara/shared";
import {
  BOX_SIZE,
  findConflicts,
  generateSudokuPuzzle,
  GRID_SIZE,
  isGridComplete,
  isSolutionCorrect,
} from "./index.ts";
import type { SudokuGrid } from "./types.ts";

function isValidCompleteGrid(grid: SudokuGrid): boolean {
  const unit = (cells: number[]) => {
    const seen = new Set(cells);
    return seen.size === GRID_SIZE && ![...seen].some((value) => value < 1 || value > 9);
  };

  for (let i = 0; i < GRID_SIZE; i++) {
    const row = grid[i] ?? [];
    if (!unit(row)) return false;

    const col = grid.map((r) => r[i] as number);
    if (!unit(col)) return false;
  }

  for (let boxRow = 0; boxRow < GRID_SIZE; boxRow += BOX_SIZE) {
    for (let boxCol = 0; boxCol < GRID_SIZE; boxCol += BOX_SIZE) {
      const box: number[] = [];
      for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
        for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
          box.push(grid[r]?.[c] as number);
        }
      }
      if (!unit(box)) return false;
    }
  }

  return true;
}

/** Backtracking simple e independiente del generador, solo para los tests:
 *  cuenta soluciones sin usar ningun codigo de generator.ts, para no validar
 *  el motor contra si mismo. */
function bruteForceCountSolutions(grid: SudokuGrid, limit: number): number {
  const working = grid.map((row) => [...row]);
  let count = 0;

  function candidates(row: number, col: number): number[] {
    const used = new Set<number>();
    for (let i = 0; i < GRID_SIZE; i++) {
      used.add(working[row]?.[i] ?? 0);
      used.add(working[i]?.[col] ?? 0);
    }
    const boxRow = row - (row % BOX_SIZE);
    const boxCol = col - (col % BOX_SIZE);
    for (let r = boxRow; r < boxRow + BOX_SIZE; r++) {
      for (let c = boxCol; c < boxCol + BOX_SIZE; c++) {
        used.add(working[r]?.[c] ?? 0);
      }
    }
    const result: number[] = [];
    for (let value = 1; value <= 9; value++) {
      if (!used.has(value)) result.push(value);
    }
    return result;
  }

  function firstEmpty(): { row: number; col: number } | null {
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        if (working[row]?.[col] === 0) return { row, col };
      }
    }
    return null;
  }

  function search(): boolean {
    const cell = firstEmpty();
    if (!cell) {
      count++;
      return count >= limit;
    }
    for (const value of candidates(cell.row, cell.col)) {
      const row = working[cell.row];
      if (!row) continue;
      row[cell.col] = value;
      if (search()) return true;
      row[cell.col] = 0;
    }
    return false;
  }

  search();
  return count;
}

for (const difficulty of DIFFICULTIES) {
  test(`genera un puzzle "${difficulty}" con solucion completa y valida`, () => {
    const { solution } = generateSudokuPuzzle(`test-seed-${difficulty}`, difficulty as Difficulty);
    assert.equal(isGridComplete(solution), true);
    assert.equal(isValidCompleteGrid(solution), true);
    assert.deepEqual(findConflicts(solution), []);
  });

  test(`el puzzle "${difficulty}" tiene solucion unica`, () => {
    const { puzzle } = generateSudokuPuzzle(`test-seed-${difficulty}`, difficulty as Difficulty);
    assert.equal(bruteForceCountSolutions(puzzle, 2), 1);
  });

  test(`el puzzle "${difficulty}" coincide con la solucion en las pistas dadas`, () => {
    const { puzzle, solution } = generateSudokuPuzzle(`test-seed-${difficulty}`, difficulty as Difficulty);
    for (let row = 0; row < GRID_SIZE; row++) {
      for (let col = 0; col < GRID_SIZE; col++) {
        const given = puzzle[row]?.[col];
        if (given !== 0) {
          assert.equal(given, solution[row]?.[col]);
        }
      }
    }
  });
}

test("la misma semilla y dificultad siempre generan el mismo puzzle", () => {
  const a = generateSudokuPuzzle("daily:sudoku:2026-09-03", "medium");
  const b = generateSudokuPuzzle("daily:sudoku:2026-09-03", "medium");
  assert.deepEqual(a, b);
});

test("semillas distintas generan puzzles distintos", () => {
  const a = generateSudokuPuzzle("seed-a", "medium");
  const b = generateSudokuPuzzle("seed-b", "medium");
  assert.notDeepEqual(a.puzzle, b.puzzle);
});

test("isSolutionCorrect distingue una solucion correcta de una incorrecta", () => {
  const { solution } = generateSudokuPuzzle("seed-correctness", "easy");
  assert.equal(isSolutionCorrect(solution, solution), true);

  const wrong = solution.map((row) => [...row]);
  const firstRow = wrong[0];
  if (firstRow) {
    firstRow[0] = firstRow[0] === 9 ? 1 : (firstRow[0] as number) + 1;
  }
  assert.equal(isSolutionCorrect(wrong, solution), false);
});

test("findConflicts detecta un valor repetido en la misma fila", () => {
  const grid = generateSudokuPuzzle("seed-conflicts", "easy").solution.map((row) => [...row]);
  const row = grid[0];
  if (row) {
    row[1] = row[0] as number; // duplica el primer valor de la fila
  }
  const conflicts = findConflicts(grid);
  assert.ok(conflicts.some((c) => c.row === 0 && c.col === 0));
  assert.ok(conflicts.some((c) => c.row === 0 && c.col === 1));
});
