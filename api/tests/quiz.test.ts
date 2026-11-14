import test from "node:test";
import assert from "node:assert/strict";
import { markAnswer, startQuiz, submitQuiz } from "../src/quiz.js";
import { quizForChapter } from "../src/content.js";
import type { QuizItem } from "../src/content.js";

function item(id: string, chapterId = "physics-kinematics"): QuizItem {
  const found = quizForChapter(chapterId).find((i) => i.id === id);
  assert.ok(found, `quiz item ${id} exists`);
  return found as QuizItem;
}

test("quiz marking: mcq by exact text and by letter", () => {
  const q = item("P-QUIZ-2"); // options [area, acceleration, average speed, amplitude], answer acceleration
  assert.equal(markAnswer(q, "acceleration"), true);
  assert.equal(markAnswer(q, "Acceleration"), true);
  assert.equal(markAnswer(q, "area"), false);
  assert.equal(markAnswer(q, "b"), true); // 2nd option
  assert.equal(markAnswer(q, "B"), true);
  assert.equal(markAnswer(q, "a"), false);
  assert.equal(markAnswer(q, "d"), false);
});

test("quiz marking: numerical with tolerance and Unicode minus", () => {
  const q = item("P-QUIZ-3"); // answer "20"
  assert.equal(markAnswer(q, "20"), true);
  assert.equal(markAnswer(q, "20 m/s"), true);
  assert.equal(markAnswer(q, "20.005"), true);
  assert.equal(markAnswer(q, "20.02"), false);
  assert.equal(markAnswer(q, "21"), false);
  assert.equal(markAnswer(q, "twenty"), false);

  const neg = item("M-QUIZ-7", "maths-quadratic"); // answer "−2"
  assert.equal(markAnswer(neg, "-2"), true);
  assert.equal(markAnswer(neg, "−2"), true);
  assert.equal(markAnswer(neg, "2"), false);
});

test("quiz marking: true/false with Sahi/Ghalat and English words", () => {
  const q = item("M-QUIZ-6", "maths-quadratic"); // answer "Ghalat"
  assert.equal(markAnswer(q, "Ghalat"), true);
  assert.equal(markAnswer(q, "ghalat"), true);
  assert.equal(markAnswer(q, "false"), true);
  assert.equal(markAnswer(q, "no"), true);
  assert.equal(markAnswer(q, "Sahi"), false);
  assert.equal(markAnswer(q, "true"), false);
  assert.equal(markAnswer(q, "yes"), false);

  const sahiItem: QuizItem = {
    id: "T-SAHI",
    type: "truefalse",
    question: "Test.",
    options: ["Sahi", "Ghalat"],
    answer: "Sahi",
    explanation: "",
    explanationUr: "",
    topic: "Test",
  };
  assert.equal(markAnswer(sahiItem, "Sahi"), true);
  assert.equal(markAnswer(sahiItem, "yes"), true);
  assert.equal(markAnswer(sahiItem, "Ghalat"), false);
  assert.equal(markAnswer(sahiItem, "no"), false);
});

test("quiz marking: short answers by key content word", () => {
  const shortItem: QuizItem = {
    id: "T-SHORT",
    type: "short",
    question: "Prince ne ruby kis ko diya?",
    answer: "Ghreeb seamstress ko ruby diya gaya tha",
    explanation: "",
    explanationUr: "",
    topic: "The Story",
  };
  assert.equal(markAnswer(shortItem, "ruby mila seamstress ko"), true);
  assert.equal(markAnswer(shortItem, "seamstress ke paas gaya"), true);
  assert.equal(markAnswer(shortItem, "kuch aur hi hua"), false);
  assert.equal(markAnswer(shortItem, ""), false);
});

test("startQuiz returns 5 questions with no answer field and varied topics", () => {
  const qs = startQuiz("maths-quadratic", 5);
  assert.equal(qs.length, 5);
  const ids = new Set(qs.map((q) => q.id));
  assert.equal(ids.size, 5);
  for (const q of qs) {
    assert.equal("answer" in q, false, q.id);
    assert.equal("explanation" in q, false, q.id);
    assert.equal("correctAnswer" in q, false, q.id);
    assert.ok(q.question.length > 0);
    assert.ok(q.topic.length > 0);
    if (q.type === "mcq" || q.type === "truefalse") {
      assert.ok(Array.isArray(q.options) && (q.options as string[]).length >= 2);
    }
  }
  const topics = new Set(qs.map((q) => q.topic));
  assert.ok(topics.size >= 2, "round-robin should vary topics");
});

test("startQuiz on an unknown chapter returns no questions", () => {
  assert.deepEqual(startQuiz("no-such-chapter", 5), []);
});

test("submitQuiz marks a known-correct and known-wrong set correctly", () => {
  const res = submitQuiz("maths-quadratic", [
    { itemId: "M-QUIZ-2", answer: "1" },
    { itemId: "M-QUIZ-3", answer: "imaginary" },
    { itemId: "M-QUIZ-4", answer: "8" },
  ]);
  assert.equal(res.total, 3);
  assert.equal(res.correct, 2);
  assert.equal(res.marks[0].correct, true);
  assert.equal(res.marks[0].correctAnswer, "1");
  assert.equal(res.marks[1].correct, false);
  assert.equal(res.marks[1].correctAnswer, "rational aur equal");
  assert.equal(res.marks[2].correct, true);
  assert.ok(res.marks[0].explanation.length > 0);
  assert.ok(res.marks[0].explanationUr.length > 0);
});

test("submitQuiz: unknown itemId is marked wrong with the not-in-chapter message", () => {
  const res = submitQuiz("maths-quadratic", [{ itemId: "NOPE-1", answer: "x" }]);
  assert.equal(res.total, 1);
  assert.equal(res.correct, 0);
  assert.equal(res.marks[0].correct, false);
  assert.equal(res.marks[0].correctAnswer, "");
  assert.match(res.marks[0].explanation, /is chapter ke quiz mein nahi hai/);
});

test("submitQuiz: letter answers match the shuffled display order from startQuiz", () => {
  const qs = startQuiz("physics-kinematics", 5);
  const q = qs.find((x) => x.type === "mcq" && x.options);
  assert.ok(q, "an mcq question is present");
  const original = item(q.id);
  const idx = (q.options as string[]).indexOf(original.answer);
  assert.ok(idx >= 0, "displayed options contain the answer");
  const letter = "abcd"[idx];
  const res = submitQuiz("physics-kinematics", [{ itemId: q.id, answer: letter }]);
  assert.equal(res.marks[0].correct, true);
  const wrongLetter = "abcd"[(idx + 1) % (q.options as string[]).length];
  const res2 = submitQuiz("physics-kinematics", [{ itemId: q.id, answer: wrongLetter }]);
  assert.equal(res2.marks[0].correct, false);
});
