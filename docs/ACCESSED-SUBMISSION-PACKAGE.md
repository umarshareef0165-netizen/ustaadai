# UstaadAI — AccessED Hacks Submission Package

> **Status: VERIFIED FOR FILING — Nov 20, 2026.**
> - GitHub repo verified live and public: https://github.com/umarshareef0165-netizen/ustaadai
> - Numbers re-verified Nov 20, 2026: API 47/47, headless E2E 17/17, 0 page errors, 4 chapters / 27 chunks / 33 Q&A / 32 quiz.
> - Prepared for the AccessED Hacks Devpost page: https://accessed-hacks.devpost.com/
> - Prize: **$225 cash, 1st place only.** Build window: **Oct 17 – Nov 20, 2026**.

---

## Project name

**UstaadAI — Urdu-First AI Tutor for Pakistan Matric Students**

## Short pitch

UstaadAI is an Urdu-first AI tutor for Pakistan Matric students, grounded in their own PCTB/PECTAA textbooks: every answer cites its chapter and section, physics and maths numerics are solved exactly by code, and adaptive quizzes build a revision plan from each student's weak topics.

## Team

Solo — **Umar Shareef**

---

## Learning story

### The problem

A typical Matric classroom in Pakistan has **40+ students per teacher**. Private tuition is unaffordable for most families. And the tutor apps that do exist are in English — while Matric students think and ask in Urdu / Roman Urdu. A student who cannot afford tuition and cannot follow an English-only app is left behind by both.

### Intended users

Pakistan Matric students who ask their questions in **Urdu or Roman Urdu** — students preparing for their board exams from the PCTB/PECTAA textbooks, with no tutor and no budget for one.

### The solution

UstaadAI is a tutor that speaks the student's language and teaches from their exact textbook:

- **Tutor chat in Urdu / Roman Urdu / English** — every answer cites the chapter + section chunk it came from and ends with a Socratic follow-up question, so the student keeps thinking instead of just copying an answer.
- **Exact numerics solver** — physics numerics are solved by code, never guessed by an LLM: `vf = vi + at`, `S = vi·t + ½at²`, free fall with `g = 10 m/s²`, force `F = ma`, momentum `p = mv`; quadratic equations are solved exactly (discriminant, roots, nature of roots).
- **Adaptive quiz** — 5 questions per chapter, with explanations and a revision plan after every attempt.
- **Progress dashboard** — mastery per topic from the last 10 attempts (minimum 3), with weak topics highlighted.
- **Off-syllabus guard** — questions outside the seeded syllabus are politely refused and redirected, never hallucinated.

**Grounding.** The off-syllabus gate runs before any LLM call; every answer cites chapter + section chunk ids; numerics are solved exactly; Urdu-script questions are matched against the Urdu textbook text as well as Roman Urdu; with no API key the app runs in deterministic mode and says so honestly; in Gemini mode the model sees only the retrieved chunks, and any failure falls back to deterministic mode.

### Tools used

- **Next.js 14** (frontend, plain JavaScript)
- **Node.js 24 + Express 5** (TypeScript API backend)
- **SQLite** (`node:sqlite`) for progress/quiz state
- **Deterministic retrieval** — keyword scoring over JSON seed content (no vector DB, no embeddings)
- **Gemini** — optional, grounded mode only; deterministic mode is the default and works with no API key
- **Headless Chrome + puppeteer-core** for end-to-end verification

### Challenges

- **Grounding exactness.** A tutor that invents an answer is worse than no tutor. The hardest part was making sure every answer traces to a real chunk of the seeded textbook — the off-syllabus gate, chunk citations, and the deterministic fallback all had to work together, and any failure had to fall back to an honest "I don't know from your syllabus" instead of a confident guess.
- **Urdu-script retrieval.** Students ask in Urdu script, Roman Urdu, or English, sometimes mixing all three. Matching a Roman Urdu question ("gaari ki final velocity kya hogi?") to Urdu textbook text required matching against both the Urdu text and Roman Urdu forms, without letting the matcher drift onto the wrong chunk.
- **Dynamics solver.** The physics numerics had to be solved exactly by code — equations of motion, free fall, force and momentum — with the steps shown, so a student sees *how* the answer was reached, not just the number.

### What was learned

- Retrieval quality matters more than model size for a school tutor: a small deterministic retriever over the student's own textbook beats a large model guessing from general knowledge.
- Honest refusal is a feature, not a gap — saying "this is outside your syllabus, here is what I can help with" builds more trust than a plausible-sounding invented answer.
- Solving numerics by code instead of by LLM removes an entire class of errors: the answer is either exactly right or the solver says it cannot do it.
- Testing against the real UI (headless browser, full quiz flow, dashboard mastery) catches failures that unit tests miss — the E2E pass found and fixed real bugs before submission.

### Before and after — one concrete example

**Before:** A Matric student asks a generic chatbot in Roman Urdu: *"A car starts from rest, accelerates at 2 m/s² for 5 s. Find final velocity and distance."* The chatbot guesses an answer from memory — no source, no steps, and if the numbers are wrong the student has no way to tell. It might give a plausible-looking velocity with no textbook behind it.

**After:** The same question in UstaadAI is solved **exactly by code** and grounded in the textbook:

- Input: `vi = 0 m/s`, `a = 2 m/s²`, `t = 5 s`
- `vf = vi + at = 0 + (2 × 5) = 10 m/s`
- `S = vi·t + ½at² = 0 + ½ × 2 × 25 = 25 m`
- **Answer: vf = 10 m/s, S = 25 m** — grounded in chunk `phy-kin-2.6-eom` (Equations of Motion section, Kinematics chapter; the on-screen citation badge shows the section name) and a Socratic follow-up question so the student works the next step themselves.

Same student, same question — before, a guessed answer with no source; after, an exact answer, shown working, cited to the chapter it came from.

---

## Something to evaluate

### Public GitHub repo

**https://github.com/umarshareef0165-netizen/ustaadai** (public, verified live Nov 20, 2026)

### Setup instructions (local run)

```bash
git clone https://github.com/umarshareef0165-netizen/ustaadai.git
cd ustaadai

# 1. Backend API (port 3001)
cd api
npm install
npm start        # API on http://localhost:3001

# 2. Frontend (port 3000) — in a second terminal
cd ../web
npm install
npm run dev      # Web on http://localhost:3000
```

No API key is required: without one the app runs in **deterministic mode** (grounded retrieval + code-solved numerics) and says so honestly. To enable the optional Gemini grounded mode, set a Gemini API key in the API environment — the model then sees only the retrieved chunks.

### Honest limitations

- **No live demo URL yet** — deployment is pending, so there is no public hosted demo to click through at filing time.
- **Walkthrough recorded on local staging**, not a production URL (see "Video walkthrough" below).
- **Deterministic mode without an API key** — full tutor, solver, quiz and dashboard work offline, but the optional Gemini grounded mode needs a key.
- **Seeded syllabus only** — 4 chapters (see "Verified numbers"). Questions outside the seeded chapters are politely refused by design; that is the off-syllabus guard working, not a missing feature.

### Video walkthrough

Recorded and included in this repo: `docs/walkthrough/ustaadai-accessed-walkthrough.mp4` — **2:30, 1280×720, English narration**, recorded Nov 20, 2026 on local staging. It covers: the problem hook, the live physics numerical (`vf = 10 m/s`, `S = 25 m`), the off-syllabus refusal, the exact quadratic solver (D = 49, x = 0.5 / −3), the English literature answer (Oscar Wilde, 1888), a full 5-question quiz (5/5, Mastery 100%), and the progress dashboard. No live URL is claimed anywhere in the video; the address bar honestly shows local staging.

### Screenshots

Captured fresh from local staging (Nov 20, 2026) in `docs/screenshots/`:

- `shot-home.png` — landing page
- `shot-tutor-physics.png` — tutor solving the physics numerical
- `shot-quiz.png` — quiz in progress / results
- `shot-dashboard.png` — progress dashboard with mastery per topic

---

## Credits

### Libraries and tools

- Next.js 14 (frontend framework)
- Express 5 + Node.js 24 (API backend)
- SQLite via `node:sqlite` (progress/quiz storage)
- Deterministic keyword retrieval over JSON seed content (no vector DB)
- Gemini API — optional, grounded mode only
- Headless Chrome + puppeteer-core — end-to-end test tooling only

### Datasets

- **PCTB/PECTAA textbook seed content** — 4 chapters of Pakistan Matric textbook material, hand-seeded as JSON: 27 content chunks, 33 Q&A pairs, 32 quiz items. The seed data is original paraphrase/summaries grounded in the PCTB/PECTAA textbooks; the textbooks themselves are not redistributed.

### AI assistance

- The code was built with **AI assistance via Muse subagents** (Nov 12–14, 2026), working from the author's design: deterministic retrieval, code-solved numerics, off-syllabus guard, and the chapter/section citation model. All content, test results, and submission claims were verified by the author against the running app.

### Pre-existing foundation

- **Built Nov 12–14, 2026, inside AccessED's Oct 17 – Nov 20, 2026 build window.**
- Originally built for **HackGlobal 2026**; **not submitted there**. This AccessED submission is its first submission anywhere.

---

## Verified numbers

| Item | Verified result |
| --- | --- |
| Seeded chapters | **4** |
| Content chunks | **27** |
| Q&A pairs | **33** |
| Quiz items | **32** |
| API tests | **47/47 passing** |
| Headless E2E checks | **17/17 passing** |
| Page errors (E2E) | **0** |

*Numbers re-verified Nov 20, 2026 (API 47/47, headless E2E 17/17, 0 page errors) against local staging.*
