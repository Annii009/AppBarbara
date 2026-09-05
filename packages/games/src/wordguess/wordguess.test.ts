import assert from "node:assert/strict";
import { test } from "node:test";
import { evaluateGuess, isKnownWord, isWinningGuess, pickSecretWord, WORD_LENGTH, WORD_LIST } from "./index.ts";

test("todas las palabras del catalogo tienen la longitud esperada", () => {
  for (const word of WORD_LIST) {
    assert.equal(word.length, WORD_LENGTH, `${word} deberia tener ${WORD_LENGTH} letras`);
  }
});

test("la misma semilla siempre da la misma palabra secreta", () => {
  const a = pickSecretWord("wordguess-fixed-seed");
  const b = pickSecretWord("wordguess-fixed-seed");
  assert.equal(a, b);
  assert.ok(isKnownWord(a));
});

test("isKnownWord acepta mayusculas y minusculas, rechaza lo que no esta en la lista", () => {
  const word = WORD_LIST[0] as string;
  assert.equal(isKnownWord(word), true);
  assert.equal(isKnownWord(word.toLowerCase()), true);
  assert.equal(isKnownWord("ZZZZZ"), false);
});

test("evaluateGuess marca todo correcto cuando el intento es la secreta", () => {
  const secret = "PLATO";
  assert.deepEqual(evaluateGuess(secret, "PLATO"), [
    "correct", "correct", "correct", "correct", "correct",
  ]);
});

test("evaluateGuess marca ausentes las letras que no estan en la secreta", () => {
  const result = evaluateGuess("PLATO", "NUBES");
  assert.deepEqual(result, ["absent", "absent", "absent", "absent", "absent"]);
});

test("evaluateGuess no repite una letra 'present' mas veces de las que hay en la secreta", () => {
  // ARENA tiene dos "A" (posiciones 0 y 4); un intento de puras "A" solo
  // puede marcar correctas esas dos posiciones, el resto quedan ausentes.
  const result = evaluateGuess("ARENA", "AAAAA");
  assert.deepEqual(result, ["correct", "absent", "absent", "absent", "correct"]);
});

test("evaluateGuess distingue correct/present/absent en un intento mixto", () => {
  const result = evaluateGuess("ARENA", "RATON");
  assert.deepEqual(result, ["present", "present", "absent", "absent", "present"]);
});

test("isWinningGuess ignora mayusculas/minusculas", () => {
  assert.equal(isWinningGuess("PLATO", "plato"), true);
  assert.equal(isWinningGuess("PLATO", "PLAZA"), false);
});
