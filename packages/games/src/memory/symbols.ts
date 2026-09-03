import type { SymbolId } from "./types.ts";

/**
 * Catalogo de simbolos disponibles para el memorama. Son solo ids: el
 * dibujo (que icono usar) vive en el cliente, igual que el resto de
 * catalogos de contenido en este monorepo.
 */
export const MEMORY_SYMBOLS: readonly SymbolId[] = [
  "crown",
  "gem",
  "heart",
  "sparkle",
  "bag",
  "star",
  "flower",
  "watch",
  "gift",
  "music",
  "camera",
  "umbrella",
] as const;
