import { cellIndex, MINESWEEPER_COLS, MINESWEEPER_ROWS } from "./generator.ts";
import type { MinesweeperGrid } from "./types.ts";

/**
 * Descubre una casilla y, si no tiene ninguna mina alrededor, sigue
 * descubriendo en cascada a sus vecinas (y las vecinas de esas, etc.) — el
 * comportamiento clasico del buscaminas. Devuelve un set NUEVO (no muta el
 * que se le pasa) con la casilla de partida mas todo lo que se revela en la
 * cascada.
 */
export function revealFrom(
  grid: MinesweeperGrid,
  revealed: ReadonlySet<number>,
  row: number,
  col: number,
): Set<number> {
  const next = new Set(revealed);
  const stack: Array<{ row: number; col: number }> = [{ row, col }];

  while (stack.length > 0) {
    const cell = stack.pop() as { row: number; col: number };
    const index = cellIndex(cell.row, cell.col);
    if (next.has(index)) continue;

    const data = grid[cell.row]?.[cell.col];
    if (!data) continue;

    next.add(index);
    if (data.isMine || data.adjacentMines > 0) continue;

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        if (dr === 0 && dc === 0) continue;
        const r = cell.row + dr;
        const c = cell.col + dc;
        if (r < 0 || r >= MINESWEEPER_ROWS || c < 0 || c >= MINESWEEPER_COLS) continue;
        if (!next.has(cellIndex(r, c))) stack.push({ row: r, col: c });
      }
    }
  }

  return next;
}

/** ¿Se ha descubierto alguna mina? Es la condicion de derrota. */
export function hasRevealedMine(grid: MinesweeperGrid, revealed: ReadonlySet<number>): boolean {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      if (grid[row]?.[col]?.isMine && revealed.has(cellIndex(row, col))) return true;
    }
  }
  return false;
}

/** ¿Estan descubiertas todas las casillas que NO son mina? Es la condicion
 *  de victoria clasica: no hace falta marcar las minas, basta con vaciar
 *  todo lo demas. */
export function isBoardCleared(grid: MinesweeperGrid, revealed: ReadonlySet<number>): boolean {
  for (let row = 0; row < grid.length; row++) {
    for (let col = 0; col < (grid[row]?.length ?? 0); col++) {
      const cell = grid[row]?.[col];
      if (cell && !cell.isMine && !revealed.has(cellIndex(row, col))) return false;
    }
  }
  return true;
}
