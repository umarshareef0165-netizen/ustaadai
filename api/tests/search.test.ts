import test from "node:test";
import assert from "node:assert/strict";
import { retrieve, tokenize, contentTokens } from "../src/search.js";
import { allChunks, allQuizItems, chapters } from "../src/content.js";

test("seed data loads: 4 chapters, 27 chunks, 32 quiz items", () => {
  assert.equal(chapters().length, 4);
  assert.equal(allChunks().length, 27);
  assert.equal(allQuizItems().length, 32);
});

test("tokenize keeps superscripts and splits on punctuation", () => {
  assert.deepEqual(tokenize("x² − 5x + 6 = 0"), ["x²", "5x", "6", "0"]);
  assert.deepEqual(tokenize("2 m/s² ki acceleration"), ["2", "m", "s²", "ki", "acceleration"]);
  assert.deepEqual(contentTokens("Speed aur velocity mein kya farq hai?"), ["speed", "velocity", "farq"]);
});

test("retrieval: 'speed aur velocity' finds the physics speed/velocity chunk on top", () => {
  const results = retrieve("speed aur velocity");
  assert.ok(results.length > 0);
  assert.equal(results[0].chunk.id, "phy-kin-2.4-speed-velocity");
  assert.ok(results[0].chunk.id.startsWith("phy-"));
  assert.ok(results[0].score > 0);
});

test("retrieval respects the chapter filter", () => {
  const results = retrieve("discriminant roots nature", "maths-quadratic");
  assert.ok(results.length > 0);
  assert.ok(results.every((r) => r.chunk.chapterId === "maths-quadratic"));
  assert.equal(results[0].chunk.id, "mat-quad-2.5-discriminant");
});

test("retrieval returns nothing useful for an unrelated query", () => {
  const results = retrieve("zebra quantum banana");
  assert.equal(results.length, 0);
});

test("seeded-QA bonus: an exact QA question matches its own chunk with matchedQaId", () => {
  const results = retrieve("Teeno equations of motion likho.");
  assert.ok(results.length > 0);
  assert.equal(results[0].chunk.id, "phy-kin-2.6-eom");
  assert.equal(results[0].matchedQaId, "P-Q3");
});

test("retrieval indexes Urdu-script text: 'ایکسلریشن' finds the acceleration chunk", () => {
  const results = retrieve("ایکسلریشن کیا ہے؟");
  assert.ok(results.length > 0);
  assert.equal(results[0].chunk.id, "phy-kin-2.5-acceleration");
});

test("seeded-QA bonus: moral question matches the themes chunk, not the story chunk", () => {
  const results = retrieve("The Happy Prince ka moral kya hai?");
  assert.ok(results.length > 0);
  assert.equal(results[0].chunk.id, "eng-hp-5.2-themes");
  assert.equal(results[0].matchedQaId, "E-Q4");
});

test("seeded-QA bonus: kinematics vs dynamics matches the rest-and-motion chunk", () => {
  const results = retrieve("Kinematics aur dynamics mein kya farq hai?");
  assert.ok(results.length > 0);
  assert.equal(results[0].chunk.id, "phy-kin-2.1-rest-motion");
  assert.equal(results[0].matchedQaId, "P-Q9");
});
