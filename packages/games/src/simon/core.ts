import type { SimonButton } from "./types.ts";

/** Cuantas pulsaciones seguidas del intento coinciden con la secuencia
 *  objetivo, empezando desde el principio. En cuanto falla una, para ahi. */
export function countCorrectPrefix(
  target: readonly SimonButton[],
  attempt: readonly SimonButton[],
): number {
  let count = 0;
  while (count < attempt.length && count < target.length && attempt[count] === target[count]) {
    count++;
  }
  return count;
}

/** ¿El intento reproduce exactamente la secuencia objetivo, de principio a
 *  fin, hasta la longitud del propio intento? Es lo que se pide para dar
 *  una ronda por buena. */
export function isValidAttempt(
  target: readonly SimonButton[],
  attempt: readonly SimonButton[],
): boolean {
  if (attempt.length === 0 || attempt.length > target.length) return false;
  return countCorrectPrefix(target, attempt) === attempt.length;
}
