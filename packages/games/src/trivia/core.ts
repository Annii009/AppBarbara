import { DAILY_PASS_THRESHOLD } from "./generator.ts";
import type { TriviaQuestion } from "./types.ts";

/** Cuantas respuestas coinciden con la correcta de su pregunta, emparejando
 *  por posicion (la respuesta i es para la pregunta i). */
export function scoreAnswers(questions: readonly TriviaQuestion[], answers: readonly number[]): number {
  let score = 0;
  for (let i = 0; i < questions.length; i++) {
    if (answers[i] === questions[i]?.correctIndex) score++;
  }
  return score;
}

/** ¿Alcanza la puntuacion para dar el reto de hoy por superado? */
export function isPassingScore(score: number): boolean {
  return score >= DAILY_PASS_THRESHOLD;
}
