import type { GridPosition, WordPlacement } from "./types.ts";

/** Las 8 celdas de la cuadricula que ocupa una palabra ya colocada. */
export function cellsForPlacement(placement: WordPlacement): GridPosition[] {
  const cells: GridPosition[] = [];
  for (let i = 0; i < placement.word.length; i++) {
    cells.push({ row: placement.row + placement.dRow * i, col: placement.col + placement.dCol * i });
  }
  return cells;
}

function sameCells(a: readonly GridPosition[], b: readonly GridPosition[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((pos, i) => pos.row === b[i]?.row && pos.col === b[i]?.col);
}

/**
 * Dada una seleccion en linea recta del jugador (arrastrar de una celda a
 * otra), ¿coincide con alguna palabra colocada? Se acepta en cualquier
 * sentido: el jugador puede arrastrar de principio a fin de la palabra o al
 * reves, ambos deben contar como acierto.
 */
export function findMatchingPlacement(
  placements: readonly WordPlacement[],
  selection: readonly GridPosition[],
): WordPlacement | null {
  for (const placement of placements) {
    const cells = cellsForPlacement(placement);
    if (sameCells(cells, selection) || sameCells(cells, [...selection].reverse())) {
      return placement;
    }
  }
  return null;
}

/**
 * Convierte un arrastre de una celda a otra en la lista de celdas
 * intermedias, SOLO si forma una linea recta valida (horizontal, vertical o
 * diagonal a 45 grados, como en cualquier sopa de letras). Devuelve null si
 * el arrastre no sigue una de esas 8 direcciones.
 */
export function straightLineBetween(
  start: GridPosition,
  end: GridPosition,
): GridPosition[] | null {
  const dRowRaw = end.row - start.row;
  const dColRaw = end.col - start.col;
  if (dRowRaw === 0 && dColRaw === 0) return [start];

  const isStraight = dRowRaw === 0 || dColRaw === 0 || Math.abs(dRowRaw) === Math.abs(dColRaw);
  if (!isStraight) return null;

  const steps = Math.max(Math.abs(dRowRaw), Math.abs(dColRaw));
  const dRow = Math.sign(dRowRaw);
  const dCol = Math.sign(dColRaw);

  const cells: GridPosition[] = [];
  for (let i = 0; i <= steps; i++) {
    cells.push({ row: start.row + dRow * i, col: start.col + dCol * i });
  }
  return cells;
}
