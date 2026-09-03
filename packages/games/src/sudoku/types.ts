/**
 * 0 = casilla vacia, 1-9 = valor colocado. Es un `number` normal y no una
 * union de literales 1|2|...|9: en cuanto se hacen operaciones aritmeticas
 * (bucles, incrementos) para generar el tablero, una union literal solo
 * obligaria a castear todo el tiempo sin aportar seguridad real.
 */
export type SudokuValue = number;

/** Cuadricula 9x9, indexada [fila][columna]. */
export type SudokuGrid = SudokuValue[][];

export interface SudokuPuzzle {
  /** Casillas iniciales; 0 en las que el jugador debe rellenar. */
  puzzle: SudokuGrid;
  /** Solucion completa, ya calculada: sirve para validar sin tener que
   *  resolver el tablero del jugador en tiempo real. */
  solution: SudokuGrid;
}

export type { GridPosition } from "../grid-position.ts";
