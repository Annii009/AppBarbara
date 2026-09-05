export interface MinesweeperCell {
  isMine: boolean;
  /** Minas en las 8 celdas vecinas (0 si no hay ninguna cerca). */
  adjacentMines: number;
}

export type MinesweeperGrid = MinesweeperCell[][];
