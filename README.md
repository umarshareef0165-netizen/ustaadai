# UstaadAI — Urdu-First AI Tutor for Pakistan Matric Students

**An Urdu-first AI tutor that teaches Pakistan Matric students from their own syllabus — with citations for every answer, exact physics numerics, and adaptive quizzes.**

Built for **HackGlobal 2026** (Polaris / HackCulture) — **Social Impact**, filed under the **Grounded knowledge & RAG** track (also touches Agentic / GenAI apps).

> **Built fresh on Nov 14, 2026 inside the HackGlobal hacking window.** The Nov 12 prototype was ruled ineligible by the organizers; this codebase was written from scratch in-window — the idea, curriculum design and planning carried over with the organizers' explicit permission.

Built by **Umar Shareef** (solo, team `umar3529`).

## The problem

- A typical Matric classroom has **40+ students** per teacher — no one gets individual attention.
- Private tuition is **unaffordable** for most families.
- Existing tutor apps are in **English**, while Matric students think and ask in **Urdu / Roman Urdu**.

UstaadAI meets students in their own language, grounded in their own textbooks.

## Features

- **Tutor chat in Urdu / Roman Urdu / English** — every answer cites the chapter + section it came from, and ends with a Socratic follow-up question.
- **Exact numerics solver** — physics numerics are solved by code, never guessed by an LLM: `vf = vi + at`, `S = vi·t + ½at²`, free fall with `g = 10 m/s²`; force `F = ma` and momentum `p = mv`; quadratic equations solved exactly (discriminant + roots + nature).
- **Adaptive quiz** — 5 questions per chapter, with explanations and a revision plan after every attempt.
- **Progress dashboard** — mastery per topic from the last 10 attempts (minimum 3), plus weak-topic highlighting.
- **Off-syllabus guard** — questions outside the seeded syllabus are politely refused and redirected, never hallucinated.

## Seeded chapters (PCTB / PECTAA 2026–27)

| Chapter | Subject | Chunks | Q&A pairs | Quiz items |
| --- | --- | --- | --- | --- |
| Physics 9 — Ch 2: Kinematics | Physics | 8 | 9 | 8 |
| Physics 9 — Ch 3: Dynamics | Physics | 7 | 8 | 8 |
| Maths 10 — Ch 2: Quadratic Equations | Maths | 7 | 8 | 8 |
| English 10 — Unit 5: The Happy Prince | English | 5 | 8 | 8 |
| **Total** | | **27** | **33** | **32** |

## Tech

| Layer | Stack |
| --- | --- |
| Frontend | Next.js 14 (plain JS) on Vercel |
| Backend | Node.js 24 + Express 5 (TypeScript) on Vultr Compute |
| LLM | Gemini (optional, grounded) — deterministic mode when no key is set |
| Retrieval | Deterministic keyword scoring over JSON seeds |
| Data | JSON seeds + SQLite (`node:sqlite`), file `api/data.db` |
| Auth | None — anonymous sessions |

## Modes

- **Deterministic (default):** no API key needed. Answers come from the seeded Q&A + chunks, numerics are solved exactly. Labelled honestly as deterministic.
- **Gemini (`MODE=gemini`, `GEMINI_API_KEY` set):** the LLM sees only the retrieved chunks, and only after the off-syllabus gate passes. Any Gemini failure falls back to deterministic mode.

## Run locally

```bash
git clone https://github.com/umarshareef0165-netizen/ustaadai.git
cd ustaadai
```

Backend (port 3001) — run this first:

```bash
cd api
npm install
npm test
npm run build
npm start
```

Frontend (port 3000):

```bash
cd web
npm install
NEXT_PUBLIC_API_URL=http://localhost:3001 npm run build
NEXT_PUBLIC_API_URL=http://localhost:3001 npm start
```

## Deploy

Backend **must** run on a Vultr Compute instance (a hard HackGlobal requirement —
Vercel / Render alone does not satisfy the brief). Frontend runs on Vercel.

Full runbook: [`infra/DEPLOY-CHECKLIST.md`](infra/DEPLOY-CHECKLIST.md)

## API contract

| Endpoint | Method | Purpose |
| --- | --- | --- |
| `/health` | GET | Liveness + mode + chapter count |
| `/api/chapters` | GET | List seeded chapters |
| `/api/tutor/chat` | POST | Tutor answer with citations + follow-up |
| `/api/quiz/start` | POST | Start a 5-question quiz for a chapter |
| `/api/quiz/submit` | POST | Submit answers → score, explanations, revision plan |
| `/api/progress/:sessionId` | GET | Mastery + weak topics for a session |

## Honest limits

- Only **4 chapters** are seeded so far.
- **Solo** build, no login — sessions are anonymous.
- Physics graph quiz item is **background-only** per the BISE 2027 Smart Syllabus.
- Cube roots of unity are **not seeded**.
- Deterministic mode answers only from the seeded content — anything outside it is refused, by design.

## Credits

- Express, Next.js, React.
- HackGlobal starter kit.
- Gemini (optional, grounded mode only).
