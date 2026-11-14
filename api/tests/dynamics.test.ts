import test from "node:test";
import assert from "node:assert/strict";
import {
  asksDynamicsNumbers,
  parseForceProblem,
  parseMomentumProblem,
  solveForce,
} from "../src/dynamics.js";

test("force solver: F = ma from mass + acceleration", () => {
  const p = parseForceProblem("mass 5 kg, acceleration 2 m/s², force kitni?");
  assert.deepEqual(p, { F: null, m: 5, a: 2 });
  assert.deepEqual(solveForce(p as never), { F: 10, m: 5, a: 2 });
});

test("force solver: m = F / a from force + acceleration", () => {
  const p = parseForceProblem("force 20 N, acceleration 4 m/s², mass kitna?");
  assert.deepEqual(p, { F: 20, m: null, a: 4 });
  assert.deepEqual(solveForce(p as never), { F: 20, m: 5, a: 4 });
});

test("force solver: a = F / m from force + mass", () => {
  const p = parseForceProblem("F = 30 N, m = 6 kg, acceleration?");
  assert.deepEqual(p, { F: 30, m: 6, a: null });
  assert.deepEqual(solveForce(p as never), { F: 30, m: 6, a: 5 });
});

test("force solver: null when fewer than two values are given", () => {
  assert.equal(parseForceProblem("force kya hoti hai?"), null);
  assert.equal(parseForceProblem("mass 5 kg hai"), null);
});

test("momentum solver: p = mv", () => {
  assert.deepEqual(parseMomentumProblem("mass 2 kg, velocity 3 m/s, momentum kitna?"), {
    m: 2, v: 3, p: 6,
  });
});

test("momentum solver: null without the word momentum or missing values", () => {
  assert.equal(parseMomentumProblem("mass 2 kg, velocity 3 m/s"), null);
  assert.equal(parseMomentumProblem("momentum kya hai?"), null);
});

test("asksDynamicsNumbers fires on force/momentum wording only", () => {
  assert.equal(asksDynamicsNumbers("force kitni hogi?"), true);
  assert.equal(asksDynamicsNumbers("momentum kya hai?"), true);
  assert.equal(asksDynamicsNumbers("mass 5 kg, acceleration 2 m/s²"), true);
  assert.equal(asksDynamicsNumbers("Newton's first law kya hai?"), false);
});
