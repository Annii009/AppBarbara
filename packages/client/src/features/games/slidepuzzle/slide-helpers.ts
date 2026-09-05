import { findBlank, type SlideDirection, type SlideGrid } from "@minibarbara/games";

/** ¿Que direccion (del hueco) corresponde a pulsar esta ficha? Solo las
 *  fichas pegadas al hueco (arriba, abajo, izquierda o derecha) mueven algo;
 *  el resto no hacen nada al pulsarlas. */
export function directionForTileClick(grid: SlideGrid, row: number, col: number): SlideDirection | null {
  const blank = findBlank(grid);
  if (row === blank.row - 1 && col === blank.col) return "up";
  if (row === blank.row + 1 && col === blank.col) return "down";
  if (col === blank.col - 1 && row === blank.row) return "left";
  if (col === blank.col + 1 && row === blank.row) return "right";
  return null;
}
