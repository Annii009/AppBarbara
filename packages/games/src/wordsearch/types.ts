/** Cuadricula de letras, indexada [fila][columna]. */
export type LetterGrid = string[][];

export type { GridPosition } from "../grid-position.ts";

/** Donde y en que direccion se coloco una palabra concreta en la cuadricula. */
export interface WordPlacement {
  word: string;
  row: number;
  col: number;
  /** Paso por celda: cada uno vale -1, 0 o 1. */
  dRow: number;
  dCol: number;
}

export interface WordSearchPuzzle {
  grid: LetterGrid;
  /** Palabras que de verdad quedaron colocadas (mismo orden que placements). */
  words: string[];
  placements: WordPlacement[];
}

export interface WordSearchTheme {
  id: string;
  label: string;
  words: readonly string[];
}
