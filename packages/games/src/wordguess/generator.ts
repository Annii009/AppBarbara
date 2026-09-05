import { createRng } from "@minibarbara/shared";
import { WORD_LIST } from "./word-list.ts";

/** Palabra secreta a partir de una semilla: misma semilla, misma palabra
 *  siempre (asi el reto diario no guarda nada, se regenera para verificar). */
export function pickSecretWord(seed: string): string {
  return createRng(seed).pick(WORD_LIST);
}
