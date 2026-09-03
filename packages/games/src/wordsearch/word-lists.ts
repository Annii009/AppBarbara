import { createRng } from "@minibarbara/shared";
import type { WordSearchTheme } from "./types.ts";

/**
 * Vocabulario tematico. Sin acentos ni enes: las sopas de letras clasicas
 * simplifican los caracteres especiales para no complicar la comparacion de
 * letra a letra, y aqui hacemos lo mismo.
 */
export const WORD_SEARCH_THEMES: readonly WordSearchTheme[] = [
  {
    id: "moda",
    label: "Moda y accesorios",
    words: [
      "BOLSO",
      "TACONES",
      "VESTIDO",
      "COLLAR",
      "PULSERA",
      "PENDIENTES",
      "FALDA",
      "ZAPATOS",
      "BUFANDA",
      "SOMBRERO",
    ],
  },
  {
    id: "ciudades",
    label: "Ciudades",
    words: ["PARIS", "MADRID", "LONDRES", "TOKIO", "MILAN", "ROMA", "BERLIN", "LISBOA", "ATENAS", "DUBAI"],
  },
] as const;

/**
 * Que tema toca en la sopa de letras del reto diario, elegido
 * deterministamente por fecha: mismo dia, mismo tema para todo el mundo.
 * Vive aqui (no en packages/shared) porque necesita conocer el catalogo de
 * temas, que es contenido propio de este motor.
 */
export function pickDailyWordSearchTheme(gameDay: string): WordSearchTheme {
  const theme = createRng(`daily-theme-picker:${gameDay}`).pick(WORD_SEARCH_THEMES);
  return theme;
}
