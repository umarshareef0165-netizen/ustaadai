import test from "node:test";
import assert from "node:assert/strict";
import {
  asksQuadratic,
  parseQuadratic,
  solveQuadratic,
} from "../src/quad.js";

test("parseQuadratic: x² − 5x + 6 = 0", () => {
  assert.deepEqual(parseQuadratic("x² − 5x + 6 = 0 hal karo"), {
    a: 1, b: -5, c: 6, discriminantOnly: false,
  });
});

test("parseQuadratic: 2x² + 5x − 3 = 0 (the old wrong-answer case)", () => {
  assert.deepEqual(parseQuadratic("2x² + 5x − 3 = 0 hal karo"), {
    a: 2, b: 5, c: -3, discriminantOnly: false,
  });
});

test("parseQuadratic: x^2 and spelled-out words", () => {
  assert.deepEqual(parseQuadratic("x^2 - 3x + 3 = 0"), {
    a: 1, b: -3, c: 3, discriminantOnly: false,
  });
  assert.deepEqual(parseQuadratic("x square minus 5x plus 6 = 0"), {
    a: 1, b: -5, c: 6, discriminantOnly: false,
  });
});

test("parseQuadratic: x² = 4 (non-zero right-hand side)", () => {
  assert.deepEqual(parseQuadratic("x² = 4"), {
    a: 1, b: 0, c: -4, discriminantOnly: false,
  });
});

test("parseQuadratic: −x² + 4x − 4 = 0", () => {
  assert.deepEqual(parseQuadratic("−x² + 4x − 4 = 0"), {
    a: -1, b: 4, c: -4, discriminantOnly: false,
  });
});

test("parseQuadratic: discriminant-only request", () => {
  assert.deepEqual(parseQuadratic("discriminant of x² + 3x + 2"), {
    a: 1, b: 3, c: 2, discriminantOnly: true,
  });
});

test("parseQuadratic: null for a parameter equation (k) and for definitions", () => {
  assert.equal(parseQuadratic("x² + kx + 9 = 0 ke roots equal hon to k?"), null);
  assert.equal(parseQuadratic("quadratic formula likho"), null);
  assert.equal(parseQuadratic("discriminant kya hai?"), null);
  assert.equal(parseQuadratic("speed aur velocity mein farq?"), null);
});

test("solveQuadratic: x² − 5x + 6 = 0 → roots 3, 2 (rational unequal)", () => {
  const r = solveQuadratic({ a: 1, b: -5, c: 6, discriminantOnly: false });
  assert.equal(r.D, 1);
  assert.deepEqual(r.roots, [3, 2]);
  assert.match(r.nature, /rational/);
});

test("solveQuadratic: 2x² + 5x − 3 = 0 → roots 0.5, −3", () => {
  const r = solveQuadratic({ a: 2, b: 5, c: -3, discriminantOnly: false });
  assert.equal(r.D, 49);
  assert.deepEqual(r.roots, [0.5, -3]);
});

test("solveQuadratic: x² + 3x + 2 → D = 1, roots −1, −2", () => {
  const r = solveQuadratic({ a: 1, b: 3, c: 2, discriminantOnly: true });
  assert.equal(r.D, 1);
  assert.deepEqual(r.roots, [-1, -2]);
});

test("solveQuadratic: D = 0 → equal roots; D < 0 → no real roots; non-square D → irrational", () => {
  const eq = solveQuadratic({ a: 1, b: -4, c: 4, discriminantOnly: false });
  assert.equal(eq.D, 0);
  assert.deepEqual(eq.roots, [2]);
  assert.match(eq.nature, /equal/);
  const neg = solveQuadratic({ a: 1, b: -3, c: 3, discriminantOnly: false });
  assert.equal(neg.D, -3);
  assert.equal(neg.roots, null);
  const irr = solveQuadratic({ a: 1, b: 0, c: -2, discriminantOnly: false });
  assert.equal(irr.D, 8);
  assert.ok(irr.roots !== null);
  assert.match(irr.nature, /irrational/);
});

test("asksQuadratic fires on equations/discriminant, not on unrelated questions", () => {
  assert.equal(asksQuadratic("x² − 5x + 6 = 0 hal karo"), true);
  assert.equal(asksQuadratic("discriminant kya hai?"), true);
  assert.equal(asksQuadratic("quadratic formula likho"), true);
  assert.equal(asksQuadratic("speed aur velocity mein farq?"), false);
});
