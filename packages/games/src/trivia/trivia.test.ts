import assert from "node:assert/strict";
import { test } from "node:test";
import {
  DAILY_PASS_THRESHOLD,
  DAILY_QUESTION_COUNT,
  isPassingScore,
  pickDailyQuestions,
  scoreAnswers,
  TRIVIA_QUESTIONS,
} from "./index.ts";

test("cada pregunta del catalogo tiene 4 opciones y un indice correcto valido", () => {
  for (const question of TRIVIA_QUESTIONS) {
    assert.equal(question.options.length, 4, `${question.id} deberia tener 4 opciones`);
    assert.ok(
      question.correctIndex >= 0 && question.correctIndex < question.options.length,
      `${question.id} tiene un correctIndex fuera de rango`,
    );
  }
});

test("los ids del catalogo son unicos", () => {
  const ids = new Set(TRIVIA_QUESTIONS.map((q) => q.id));
  assert.equal(ids.size, TRIVIA_QUESTIONS.length);
});

test("pickDailyQuestions devuelve la cantidad pedida, sin repetir preguntas", () => {
  const questions = pickDailyQuestions("trivia-seed-1");
  assert.equal(questions.length, DAILY_QUESTION_COUNT);
  const ids = new Set(questions.map((q) => q.id));
  assert.equal(ids.size, questions.length);
});

test("la misma semilla siempre da las mismas preguntas en el mismo orden", () => {
  const a = pickDailyQuestions("trivia-fixed-seed");
  const b = pickDailyQuestions("trivia-fixed-seed");
  assert.deepEqual(a, b);
});

test("semillas distintas dan selecciones distintas", () => {
  const a = pickDailyQuestions("trivia-seed-a");
  const b = pickDailyQuestions("trivia-seed-b");
  assert.notDeepEqual(a, b);
});

test("scoreAnswers cuenta solo las respuestas que coinciden en su posicion", () => {
  const questions = pickDailyQuestions("trivia-score-seed");
  const perfectAnswers = questions.map((q) => q.correctIndex);
  assert.equal(scoreAnswers(questions, perfectAnswers), questions.length);

  const wrongAnswers = questions.map((q) => (q.correctIndex + 1) % q.options.length);
  assert.equal(scoreAnswers(questions, wrongAnswers), 0);

  const oneWrong = [...perfectAnswers];
  oneWrong[0] = (oneWrong[0]! + 1) % questions[0]!.options.length;
  assert.equal(scoreAnswers(questions, oneWrong), questions.length - 1);
});

test("isPassingScore usa el umbral pactado", () => {
  assert.equal(isPassingScore(DAILY_PASS_THRESHOLD), true);
  assert.equal(isPassingScore(DAILY_PASS_THRESHOLD - 1), false);
  assert.equal(isPassingScore(DAILY_QUESTION_COUNT), true);
});
