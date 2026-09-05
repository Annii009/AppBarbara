import { createRng } from "@minibarbara/shared";
import { TRIVIA_QUESTIONS } from "./question-bank.ts";
import type { TriviaQuestion } from "./types.ts";

/** Cuantas preguntas trae el reto diario, y cuantas hay que acertar (de
 *  esas) para darlo por completado. No hace falta pleno: un fallo esta
 *  permitido, como en un quiz de verdad. */
export const DAILY_QUESTION_COUNT = 5;
export const DAILY_PASS_THRESHOLD = 4;

/** Las N preguntas de hoy, en un orden fijo determinado por la semilla:
 *  misma semilla, mismas preguntas y mismo orden siempre, sin repetirse
 *  entre si dentro del mismo dia (barajar-y-cortar nunca repite elemento). */
export function pickDailyQuestions(seed: string, count: number = DAILY_QUESTION_COUNT): TriviaQuestion[] {
  return createRng(seed).shuffle(TRIVIA_QUESTIONS).slice(0, count);
}
