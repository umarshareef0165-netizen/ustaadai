# UstaadAI v2 — Submission Content (Vultr Community)

Ready to paste into the Vultr Community submission form:
**community.vultr.com/e/hackglobal-2026** — tag **"Hackathons"**, event **"HackGlobal 2026"**.

Prize pool: **$15,000 total**. Judging: **Merit + Reach** (real users, likes/shares/votes)
+ bonus (cross-university teams, pre-event challenges, community participation).

---

## Project name

UstaadAI — Urdu-First AI Tutor for Pakistan Matric Students

## Short description (1–2 sentences)

UstaadAI is an Urdu-first AI tutor for Pakistan Matric students, grounded in their
own PCTB/PECTAA textbooks: every answer cites its chapter and section, physics and
maths numerics are solved exactly by code, and adaptive quizzes build a revision plan from
each student's weak topics.

## Industry / domain

Education / Social Impact

## Track

Grounded knowledge & RAG

## Tech stack

- Frontend: Next.js 14 (plain JS) on Vercel
- Backend: Node.js 24 + Express 5 (TypeScript) on Vultr Compute
- LLM: Gemini (optional, grounded mode only) — deterministic mode by default
- Retrieval: deterministic keyword scoring over JSON seeds
- Data: JSON seeds (4 chapters, 27 chunks, 33 Q&A, 32 quiz items) + SQLite (`node:sqlite`)
- Infra: nginx reverse proxy, systemd service, Ubuntu 24.04

## Overview

**The problem.** A typical Matric classroom has 40+ students per teacher, private
tuition is unaffordable for most families, and existing tutor apps are in English
while Matric students think and ask in Urdu / Roman Urdu.

**What UstaadAI does.**

- **Tutor chat in Urdu / Roman Urdu / English** — every answer cites the chapter
  + section chunk it came from and ends with a Socratic follow-up question.
- **Exact numerics solver** — physics numerics are solved by code, never guessed
  by an LLM: `vf = vi + at`, `S = vi·t + ½at²`, free fall with `g = 10 m/s²`, force
  `F = ma`, momentum `p = mv`; quadratic equations are solved exactly (discriminant,
  roots, nature of roots).
- **Adaptive quiz** — 5 questions per chapter, with explanations and a revision
  plan after every attempt.
- **Progress dashboard** — mastery per topic from the last 10 attempts
  (minimum 3), with weak topics highlighted.
- **Off-syllabus guard** — questions outside the seeded syllabus are politely
  refused and redirected, never hallucinated.

**Grounding.** The off-syllabus gate runs before any LLM call; every answer cites
chapter + section chunk ids; numerics are solved exactly; Urdu-script questions are
matched against the Urdu textbook text as well as Roman Urdu; with no API key the app
runs in deterministic mode and says so honestly; in Gemini mode the model sees
only the retrieved chunks, and any failure falls back to deterministic mode.

**Why it matters.** For a student who cannot afford tuition, a tutor that speaks
their language, teaches from their exact textbook, and never invents an answer
is the difference between falling behind and keeping up.

**Real users.** [Add Reach evidence here at submission time: test users, shares,
votes — see BUILD-STATUS.md.]

## How Vultr was used

The backend runs on a **Vultr Compute** instance (`vc2-1c-1gb`, 1 vCPU / 1 GB RAM,
Ubuntu 24.04, Los Angeles): Node.js 24 + Express 5 API behind an **nginx**
reverse proxy, managed as a **systemd** service, with **SQLite** on the instance.
The frontend runs on Vercel and calls the Vultr backend. Built with the **$200
participant Vultr credits**.

## Architecture diagram / screenshots

See `docs/architecture.svg` for the architecture diagram (image, ready to upload).
Screenshots in `docs/screenshots/` (captured from local staging Nov 14, 04:00 PT — retake from the live Vultr URL during the demo-video step if time permits): `shot-home.png`, `shot-tutor-physics.png`, `shot-quiz.png`, `shot-dashboard.png`.

## Public GitHub repo

[TO FILL AFTER PUSH]

## Live demo URL

[TO FILL AFTER DEPLOY]

## Teammates

Solo — Umar Shareef (team umar3529)

## Vultr username

[TO FILL]
