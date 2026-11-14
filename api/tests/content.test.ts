import test from "node:test";
import assert from "node:assert/strict";
import { chapters, allChunks, allQuizItems } from "../src/content.js";

test("chapters() returns sections with chunk ids, matching seed counts", () => {
  const ch = chapters();
  assert.equal(ch.length, 4);
  const byId = new Map(ch.map((c) => [c.chapterId, c]));
  const phys = byId.get("physics-kinematics");
  assert.ok(phys);
  assert.equal(phys.sections.length, 8);
  assert.equal(phys.chunkCount, 8);
  assert.equal(phys.quizCount, 8);
  assert.deepEqual(phys.sections[0], { section: "Rest and Motion", chunkId: "phy-kin-2.1-rest-motion" });
  const maths = byId.get("maths-quadratic");
  assert.ok(maths);
  assert.equal(maths.sections.length, 7);
  assert.equal(maths.quizCount, 8);
  const eng = byId.get("english-happy-prince");
  assert.ok(eng);
  assert.equal(eng.sections.length, 5);
  assert.equal(eng.quizCount, 8);
  const dyn = byId.get("physics-dynamics");
  assert.ok(dyn);
  assert.equal(dyn.sections.length, 7);
  assert.equal(dyn.chunkCount, 7);
  assert.equal(dyn.quizCount, 8);
});

test("seed totals: 27 chunks, 33 Q&A, 32 quiz items", () => {
  assert.equal(allChunks().length, 27);
  assert.equal(allChunks().reduce((n, c) => n + (c.qa?.length ?? 0), 0), 33);
  assert.equal(allQuizItems().length, 32);
});
