import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cellIndex,
  cellRowCol,
  generateMinesweeperGrid,
  hasRevealedMine,
  isBoardCleared,
  MINESWEEPER_COLS,
  MINESWEEPER_MINE_COUNT,
  MINESWEEPER_ROWS,
  revealFrom,
  type MinesweeperGrid,
} from "./index.ts";

test("genera un tablero del tamano correcto con el numero de minas pactado", () => {
  const grid = generateMinesweeperGrid("mine-seed-1");
  assert.equal(grid.length, MINESWEEPER_ROWS);
  for (const row of grid) assert.equal(row.length, MINESWEEPER_COLS);

  const mineCount = grid.flat().filter((cell) => cell.isMine).length;
  assert.equal(mineCount, MINESWEEPER_MINE_COUNT);
});

test("la misma semilla siempre da el mismo tablero", () => {
  const a = generateMinesweeperGrid("mine-fixed-seed");
  const b = generateMinesweeperGrid("mine-fixed-seed");
  assert.deepEqual(a, b);
});

test("semillas distintas dan tableros distintos", () => {
  const a = generateMinesweeperGrid("mine-seed-a");
  const b = generateMinesweeperGrid("mine-seed-b");
  assert.notDeepEqual(a, b);
});

test("cellIndex y cellRowCol son inversas entre si", () => {
  for (let row = 0; row < MINESWEEPER_ROWS; row++) {
    for (let col = 0; col < MINESWEEPER_COLS; col++) {
      assert.deepEqual(cellRowCol(cellIndex(row, col)), { row, col });
    }
  }
});

test("adjacentMines nunca cuenta una mina que este fuera del tablero", () => {
  const grid = generateMinesweeperGrid("mine-seed-edges");
  for (const row of grid) {
    for (const cell of row) {
      assert.ok(cell.adjacentMines >= 0 && cell.adjacentMines <= 8);
    }
  }
});

/** Tablero 3x3 hecho a mano, sin motor de generacion: solo la celda (1,1)
 *  central es mina, el resto no. Sirve para probar la cascada sin depender
 *  de que casillas toquen minas en un tablero real de 8x8. */
function handmadeGrid(): MinesweeperGrid {
  return [
    [
      { isMine: false, adjacentMines: 1 },
      { isMine: false, adjacentMines: 1 },
      { isMine: false, adjacentMines: 1 },
    ],
    [
      { isMine: false, adjacentMines: 1 },
      { isMine: true, adjacentMines: 0 },
      { isMine: false, adjacentMines: 1 },
    ],
    [
      { isMine: false, adjacentMines: 1 },
      { isMine: false, adjacentMines: 1 },
      { isMine: false, adjacentMines: 1 },
    ],
  ];
}

test("revealFrom en una esquina lejos de la mina no hace cascada (todas tocan a 1)", () => {
  const grid = handmadeGrid();
  const revealed = revealFrom(grid, new Set(), 0, 0);
  assert.deepEqual([...revealed], [cellIndex(0, 0)]);
});

test("hasRevealedMine detecta cuando la mina esta entre las descubiertas", () => {
  const grid = handmadeGrid();
  const revealed = revealFrom(grid, new Set(), 1, 1);
  assert.equal(hasRevealedMine(grid, revealed), true);
});

/** Tablero 3x3 con la mina en una esquina (0,2): deja una region conectada
 *  de casillas sin ninguna mina alrededor, para probar que la cascada de
 *  verdad se extiende (y que nunca llega a descubrir la propia mina). */
function cornerMineGrid(): MinesweeperGrid {
  return [
    [
      { isMine: false, adjacentMines: 0 },
      { isMine: false, adjacentMines: 1 },
      { isMine: true, adjacentMines: 0 },
    ],
    [
      { isMine: false, adjacentMines: 0 },
      { isMine: false, adjacentMines: 1 },
      { isMine: false, adjacentMines: 1 },
    ],
    [
      { isMine: false, adjacentMines: 0 },
      { isMine: false, adjacentMines: 0 },
      { isMine: false, adjacentMines: 0 },
    ],
  ];
}

test("revealFrom en cascada descubre toda la region conectada sin tocar la mina", () => {
  const grid = cornerMineGrid();
  const revealed = revealFrom(grid, new Set(), 0, 0);
  const expected = new Set(
    [
      [0, 0], [0, 1], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2],
    ].map(([row, col]) => cellIndex(row as number, col as number)),
  );
  assert.deepEqual(revealed, expected);
  assert.equal(revealed.has(cellIndex(0, 2)), false);
  assert.equal(isBoardCleared(grid, revealed), true);
});

test("isBoardCleared es verdad en cuanto todas las no-mina estan descubiertas", () => {
  const grid = handmadeGrid();
  let revealed = new Set<number>();
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (!grid[row]?.[col]?.isMine) revealed = revealFrom(grid, revealed, row, col);
    }
  }
  assert.equal(isBoardCleared(grid, revealed), true);
  assert.equal(hasRevealedMine(grid, revealed), false);
});
