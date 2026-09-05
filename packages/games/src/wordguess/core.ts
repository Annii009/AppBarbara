import type { LetterStatus } from "./types.ts";

/**
 * Compara un intento contra la palabra secreta, letra a letra, con el mismo
 * criterio que el juego clasico: primero se marcan las letras en su sitio
 * exacto ("correct"), y solo lo que sobra de cada letra de la secreta se
 * reparte entre las que estan pero descolocadas ("present") — asi una letra
 * repetida en el intento no se marca "present" mas veces de las que aparece
 * de verdad en la secreta.
 */
export function evaluateGuess(secret: string, guess: string): LetterStatus[] {
  const secretLetters = secret.toUpperCase().split("");
  const guessLetters = guess.toUpperCase().split("");
  const result: LetterStatus[] = guessLetters.map(() => "absent");
  const remaining = new Map<string, number>();

  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === secretLetters[i]) {
      result[i] = "correct";
    } else {
      const letter = secretLetters[i] as string;
      remaining.set(letter, (remaining.get(letter) ?? 0) + 1);
    }
  }

  for (let i = 0; i < guessLetters.length; i++) {
    if (result[i] === "correct") continue;
    const letter = guessLetters[i] as string;
    const left = remaining.get(letter) ?? 0;
    if (left > 0) {
      result[i] = "present";
      remaining.set(letter, left - 1);
    }
  }

  return result;
}

/** ¿El intento es exactamente la palabra secreta? */
export function isWinningGuess(secret: string, guess: string): boolean {
  return secret.toUpperCase() === guess.toUpperCase();
}
