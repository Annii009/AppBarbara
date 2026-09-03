/** Cuadricula 4x4, 0 = vacia, resto son potencias de 2. */
export type Grid2048 = number[][];

export type Direction = "up" | "down" | "left" | "right";

export interface Game2048State {
  grid: Grid2048;
  score: number;
}
