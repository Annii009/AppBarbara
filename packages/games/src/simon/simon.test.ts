import assert from "node:assert/strict";
import { test } from "node:test";
import { countCorrectPrefix, generateSimonSequence, isValidAttempt } from "./index.ts";

test("genera una secuencia de la longitud pedida, con valores 0-3", () => {
  const sequence = generateSimonSequence("simon-seed-1", 10);
  assert.equal(sequence.length, 10);
  for (const value of sequence) {
    assert.ok(value >= 0 && value <= 3);
  }
});

test("la misma semilla siempre da la misma secuencia", () => {
  const a = generateSimonSequence("simon-fixed-seed", 10);
  const b = generateSimonSequence("simon-fixed-seed", 10);
  assert.deepEqual(a, b);
});

test("semillas distintas dan secuencias distintas", () => {
  const a = generateSimonSequence("simon-seed-a", 10);
  const b = generateSimonSequence("simon-seed-b", 10);
  assert.notDeepEqual(a, b);
});

test("countCorrectPrefix cuenta hasta el primer fallo", () => {
  const target = [0, 1, 2, 3, 0] as const;
  assert.equal(countCorrectPrefix(target, [0, 1, 2]), 3);
  assert.equal(countCorrectPrefix(target, [0, 1, 3]), 2);
  assert.equal(countCorrectPrefix(target, [1]), 0);
  assert.equal(countCorrectPrefix(target, [0, 1, 2, 3, 0]), 5);
});

test("isValidAttempt acepta un prefijo exacto de la secuencia objetivo", () => {
  const target = generateSimonSequence("simon-valid-test", 10);
  assert.equal(isValidAttempt(target, target.slice(0, 3)), true);
  assert.equal(isValidAttempt(target, target), true);
});

test("isValidAttempt rechaza un intento que se desvia", () => {
  const target = generateSimonSequence("simon-invalid-test", 10);
  const wrongButton = ((target[0] as number) + 1) % 4;
  assert.equal(isValidAttempt(target, [wrongButton as 0 | 1 | 2 | 3]), false);
});

test("isValidAttempt rechaza un intento vacio o mas largo que el objetivo", () => {
  const target = generateSimonSequence("simon-edge-test", 3);
  assert.equal(isValidAttempt(target, []), false);
  assert.equal(isValidAttempt(target, [...target, 0]), false);
});
