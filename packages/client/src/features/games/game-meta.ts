import { Bomb, Brain, Grid2x2, Grid3x3, LayoutGrid, Puzzle, Repeat, SpellCheck2, TextSearch, type LucideIcon } from "lucide-react";
import type { GameId } from "@minibarbara/shared";

/** Metadatos de presentacion de cada minijuego, compartidos por el hub del
 *  reto diario, el hub de practica libre y el historial. */

export const GAME_LABELS: Record<GameId, string> = {
  sudoku: "Sudoku",
  wordsearch: "Sopa de letras",
  memory: "Memorama",
  "2048": "2048",
  simon: "Secuencia",
  wordguess: "Adivina la palabra",
  minesweeper: "Buscaminas",
  slidepuzzle: "Puzzle deslizante",
  trivia: "Trivia rosa",
};

export const GAME_ICONS: Record<GameId, LucideIcon> = {
  sudoku: Grid3x3,
  wordsearch: TextSearch,
  memory: Grid2x2,
  "2048": LayoutGrid,
  simon: Repeat,
  wordguess: SpellCheck2,
  minesweeper: Bomb,
  slidepuzzle: Puzzle,
  trivia: Brain,
};

export const GAME_FREE_PLAY_ROUTES: Record<GameId, string> = {
  sudoku: "/games/sudoku",
  wordsearch: "/games/wordsearch",
  memory: "/games/memory",
  "2048": "/games/2048",
  simon: "/games/simon",
  wordguess: "/games/wordguess",
  minesweeper: "/games/minesweeper",
  slidepuzzle: "/games/slidepuzzle",
  trivia: "/games/trivia",
};
