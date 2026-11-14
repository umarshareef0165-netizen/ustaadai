import express from "express";
import { randomUUID } from "node:crypto";
import { allChunks, allQuizItems, chapters } from "./content.js";
import { answerTutor } from "./tutor.js";
import { startQuiz, submitQuiz } from "./quiz.js";
import { ensureSession, progressForSession, recordAttempts, recordChatTurn, sessionCount, } from "./store.js";
const app = express();
const PORT = Number(process.env.PORT ?? 3001);
export const MODE = process.env.GEMINI_API_KEY && process.env.MODE !== "deterministic" ? "gemini" : "deterministic";
app.use(express.json({ limit: "256kb" }));
// Open CORS: any origin, Content-Type header, GET/POST/OPTIONS, 204 on OPTIONS.
app.use((req, res, next) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    if (req.method === "OPTIONS") {
        res.sendStatus(204);
        return;
    }
    next();
});
app.get("/health", (_req, res) => {
    res.json({
        ok: true,
        mode: MODE,
        chapters: chapters().length,
        chunks: allChunks().length,
        quizItems: allQuizItems().length,
        sessions: sessionCount(),
    });
});
app.get("/api/chapters", (_req, res) => {
    res.json({ chapters: chapters() });
});
app.post("/api/tutor/chat", async (req, res) => {
    const { sessionId: givenSessionId, chapter, message, displayName } = req.body ?? {};
    if (typeof message !== "string" || !message.trim()) {
        res.status(400).json({ error: "Message is required." });
        return;
    }
    const sessionId = typeof givenSessionId === "string" && givenSessionId ? givenSessionId : randomUUID();
    ensureSession(sessionId, typeof displayName === "string" ? displayName : undefined);
    const answer = await answerTutor(message, typeof chapter === "string" ? chapter : undefined);
    recordChatTurn(sessionId, typeof chapter === "string" ? chapter : "", message, answer.citations.map((c) => c.chunkId));
    res.json({ sessionId, ...answer });
});
app.post("/api/quiz/start", (req, res) => {
    const { sessionId: givenSessionId, chapter, count, displayName } = req.body ?? {};
    if (typeof chapter !== "string" || !chapter) {
        res.status(400).json({ error: "Chapter is required." });
        return;
    }
    const questions = startQuiz(chapter, typeof count === "number" ? count : 5);
    if (questions.length === 0) {
        res.status(404).json({ error: "No quiz found for this chapter." });
        return;
    }
    const sessionId = typeof givenSessionId === "string" && givenSessionId ? givenSessionId : randomUUID();
    ensureSession(sessionId, typeof displayName === "string" ? displayName : undefined);
    res.json({ sessionId, chapter, questions });
});
app.post("/api/quiz/submit", (req, res) => {
    const { sessionId: givenSessionId, chapter, answers, displayName } = req.body ?? {};
    if (typeof chapter !== "string" || !chapter || !Array.isArray(answers)) {
        res.status(400).json({ error: "Chapter and answers[] are required." });
        return;
    }
    const sessionId = typeof givenSessionId === "string" && givenSessionId ? givenSessionId : randomUUID();
    ensureSession(sessionId, typeof displayName === "string" ? displayName : undefined);
    const result = submitQuiz(chapter, answers);
    const recordable = result.marks.filter((m) => m.topic !== "");
    if (recordable.length > 0) {
        recordAttempts(sessionId, chapter, recordable.map((m) => ({ itemId: m.itemId, correct: m.correct, topic: m.topic })));
    }
    const progress = progressForSession(sessionId);
    const entry = progress.find((p) => p.chapter === chapter);
    const mastery = entry?.mastery ?? null;
    const revisionPlan = (entry?.weakTopics ?? []).map((w) => `Revise: ${w.topic} — ${w.correct}/${w.attempted} correct`);
    res.json({ sessionId, chapter, marks: result.marks, correct: result.correct, total: result.total, mastery, revisionPlan });
});
app.get("/api/progress/:sessionId", (req, res) => {
    const sessionId = req.params.sessionId;
    res.json({ sessionId, chapters: progressForSession(sessionId) });
});
app.use((_req, res) => {
    res.status(404).json({ error: "Not found" });
});
app.listen(PORT, () => {
    console.log(`UstaadAI API listening on :${PORT} (mode=${MODE})`);
});
export default app;
