import { createRng } from "@minibarbara/shared";
import type { LetterGrid, WordPlacement, WordSearchPuzzle } from "./types.ts";

const DIRECTIONS: ReadonlyArray<{ dRow: number; dCol: number }> = [
  { dRow: 0, dCol: 1 }, // derecha
  { dRow: 0, dCol: -1 }, // izquierda
  { dRow: 1, dCol: 0 }, // abajo
  { dRow: -1, dCol: 0 }, // arriba
  { dRow: 1, dCol: 1 }, // diagonal abajo-derecha
  { dRow: 1, dCol: -1 }, // diagonal abajo-izquierda
  { dRow: -1, dCol: 1 }, // diagonal arriba-derecha
  { dRow: -1, dCol: -1 }, // diagonal arriba-izquierda
];

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const MAX_PLACEMENT_ATTEMPTS = 200;

function canPlace(
  grid: LetterGrid,
  word: string,
  row: number,
  col: number,
  dRow: number,
  dCol: number,
  size: number,
): boolean {
  for (let i = 0; i < word.length; i++) {
    const r = row + dRow * i;
    const c = col + dCol * i;
    if (r < 0 || r >= size || c < 0 || c >= size) return false;

    const existing = grid[r]?.[c];
    // Una celda vacia siempre vale; una ya ocupada solo vale si coincide con
    // la letra que toca aqui (asi las palabras pueden cruzarse, como en una
    // sopa de letras de verdad).
    if (existing !== "" && existing !== word[i]) return false;
  }
  return true;
}

function place(grid: LetterGrid, word: string, row: number, col: number, dRow: number, dCol: number): void {
  for (let i = 0; i < word.length; i++) {
    const r = row + dRow * i;
    const c = col + dCol * i;
    const gridRow = grid[r];
    if (gridRow) gridRow[c] = word[i] as string;
  }
}

/**
 * Genera una sopa de letras a partir de una semilla: mismo seed + misma
 * lista de palabras siempre dan exactamente el mismo tablero.
 *
 * Coloca las palabras mas largas primero (son las que menos huecos validos
 * tienen) y, si una palabra no encuentra sitio tras MAX_PLACEMENT_ATTEMPTS
 * intentos al azar, se omite en vez de colgarse buscando un hueco que quiza
 * no exista: mejor un puzzle con una palabra menos que uno que nunca termina
 * de generarse.
 */
export function generateWordSearchPuzzle(
  seed: string,
  words: readonly string[],
  size = 12,
): WordSearchPuzzle {
  const rng = createRng(seed);
  const grid: LetterGrid = Array.from({ length: size }, () => Array(size).fill(""));
  const placements: WordPlacement[] = [];

  const ordered = [...words].sort((a, b) => b.length - a.length);

  for (const word of ordered) {
    for (let attempt = 0; attempt < MAX_PLACEMENT_ATTEMPTS; attempt++) {
      const direction = rng.pick(DIRECTIONS);
      const row = rng.int(0, size - 1);
      const col = rng.int(0, size - 1);

      if (canPlace(grid, word, row, col, direction.dRow, direction.dCol, size)) {
        place(grid, word, row, col, direction.dRow, direction.dCol);
        placements.push({ word, row, col, dRow: direction.dRow, dCol: direction.dCol });
        break;
      }
    }
  }

  for (let row = 0; row < size; row++) {
    const gridRow = grid[row];
    if (!gridRow) continue;
    for (let col = 0; col < size; col++) {
      if (gridRow[col] === "") gridRow[col] = rng.pick(ALPHABET);
    }
  }

  return { grid, words: placements.map((p) => p.word), placements };
}
