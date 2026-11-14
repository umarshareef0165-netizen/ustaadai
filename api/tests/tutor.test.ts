import test from "node:test";
import assert from "node:assert/strict";
import { answerTutor } from "../src/tutor.js";
import { allChunks } from "../src/content.js";

process.env.MODE = "deterministic";
delete process.env.GEMINI_API_KEY;

const DEMO_NUMERICAL =
  "Ek car rest se 2 m/s² ki acceleration se 5 second tak chalti hai. Uski final velocity aur tay ki gayi distance kitni hogi?";

test("demo numerical exact: vf=10 m/s, S=25 m, formulas, citation, follow-up, deterministic", async () => {
  const res = await answerTutor(DEMO_NUMERICAL);
  assert.equal(res.refusal, false);
  assert.equal(res.mode, "deterministic");
  assert.match(res.answer, /10 m\/s/);
  assert.match(res.answer, /25 m/);
  assert.match(res.answer, /vf = vi \+ at/);
  assert.match(res.answer, /S = vi·t \+ ½at²/);
  assert.match(res.answer, /مرحلہ 1/);
  assert.deepEqual(
    res.citations.map((c) => c.chunkId),
    ["phy-kin-2.6-eom"],
  );
  assert.match(res.followUp, /4 m\/s²/);
  assert.match(res.followUpRoman, /4 m\/s²/);
  assert.match(res.answerRoman, /10 m\/s/);
  assert.match(res.answerRoman, /25 m/);
});

test("free fall t=5: vf=50 m/s, S=125 m", async () => {
  const res = await answerTutor(
    "Ek pathar rest se giraya gaya. 5 second baad uski final velocity aur distance kitni hogi?",
  );
  assert.equal(res.refusal, false);
  assert.equal(res.mode, "deterministic");
  assert.match(res.answer, /50 m\/s/);
  assert.match(res.answer, /125 m/);
  assert.match(res.answer, /مرحلہ 1/);
});

test("off-syllabus refusal: chemistry, thermodynamics, cricket match, biology", async () => {
  for (const q of [
    "Chemistry kya hai?",
    "Thermodynamics kya hoti hai?",
    "Kal ka match kaun jeetega?",
    "Biology mein cell kya hai?",
    // Regression (2026-11-14): "chemical reaction" matched Newton's third-law
    // chunk instead of refusing — gate must catch chemistry wording.
    "Explain the chemical reaction of photosynthesis",
    "What is an atom?",
    "How does digestion work?",
  ]) {
    const res = await answerTutor(q);
    assert.equal(res.refusal, true, q);
    assert.deepEqual(res.citations, [], q);
    assert.match(res.answer, /Kinematics/, q);
    assert.match(res.answer, /Quadratic/, q);
    assert.match(res.answer, /Happy Prince/, q);
    assert.match(res.answer, /4/, q);
  }
});

test("dynamics solver answers the quantity actually asked", async () => {
  // Regression (2026-11-14): asking for acceleration returned "Jawab: force
  // 10 newton" (the given value) instead of the acceleration.
  const resA = await answerTutor(
    "A 2 kg object is pushed with a force of 10 N. What is its acceleration?",
  );
  assert.equal(resA.refusal, false);
  assert.match(resA.answer, /acceleration 5 m\/s²/);
  assert.match(resA.answer, /a = F\/m/);
  assert.doesNotMatch(resA.answer, /Jawab: force/);

  const resM = await answerTutor("force 20 N, acceleration 4 m/s², mass kitna?");
  assert.equal(resM.refusal, false);
  assert.match(resM.answer, /mass 5 kg/);
  assert.match(resM.answer, /m = F\/a/);
});

test("empty message is refused", async () => {
  for (const q of ["", "   "]) {
    const res = await answerTutor(q);
    assert.equal(res.refusal, true);
    assert.deepEqual(res.citations, []);
  }
});

test("every seeded QA returns its canned answer + citation to its chunk + non-empty follow-up", async () => {
  for (const chunk of allChunks()) {
    for (const qa of chunk.qa ?? []) {
      const res = await answerTutor(qa.q);
      if (qa.id === "P-Q6") {
        // Numerical QA → solver answer, not the canned text.
        assert.equal(res.refusal, false, qa.id);
        assert.match(res.answer, /10 m\/s/, qa.id);
        assert.match(res.answer, /25 m/, qa.id);
        assert.match(res.answer, /مرحلہ 1/, qa.id);
        assert.ok(res.citations.some((c) => c.chunkId === chunk.id), qa.id);
        assert.ok(res.followUp.length > 0, qa.id);
        continue;
      }
      if (qa.id === "M-Q3") {
        // Equation QA → exact quadratic solver answer (same roots, with steps).
        assert.equal(res.refusal, false, qa.id);
        assert.match(res.answer, /x = 3 ya 2/, qa.id);
        assert.match(res.answer, /D = b² − 4ac/, qa.id);
        assert.ok(res.citations.some((c) => c.chunkId === "mat-quad-2.5-discriminant"), qa.id);
        assert.ok(res.followUp.length > 0, qa.id);
        continue;
      }
      if (qa.id === "M-Q5") {
        // Equation QA → exact quadratic solver answer (D < 0, no real roots).
        assert.equal(res.refusal, false, qa.id);
        assert.match(res.answer, /koi real roots nahi/, qa.id);
        assert.ok(res.citations.some((c) => c.chunkId === "mat-quad-2.5-discriminant"), qa.id);
        assert.ok(res.followUp.length > 0, qa.id);
        continue;
      }
      assert.equal(res.refusal, false, qa.id);
      assert.equal(res.answer, qa.a, qa.id);
      assert.equal(res.answerRoman, qa.aRoman, qa.id);
      assert.equal(res.followUp, qa.followUp, qa.id);
      assert.ok(res.followUp.length > 0, qa.id);
      assert.ok(
        res.citations.some((c) => c.chunkId === chunk.id),
        `${qa.id}: expected citation to ${chunk.id}, got ${JSON.stringify(res.citations)}`,
      );
    }
  }
});

test("general chunk question: discriminant nature of roots → maths chunk, not refused", async () => {
  const res = await answerTutor(
    "discriminant se roots ki nature kaise pata chalti hai?",
    "maths-quadratic",
  );
  assert.equal(res.refusal, false);
  assert.ok(res.citations.length > 0);
  assert.ok(res.citations[0].chunkId.startsWith("mat-quad-"));
});

test("general chunk question without a chapter filter still answers from the right chapter", async () => {
  const res = await answerTutor("Swallow akhir mein kyun mar gaya?");
  assert.equal(res.refusal, false);
  assert.ok(res.citations.some((c) => c.chunkId.startsWith("eng-hp-")));
});
