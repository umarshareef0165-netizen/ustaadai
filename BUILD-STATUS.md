# UstaadAI v2 — Build Status

Fresh rebuild for HackGlobal 2026, written Nov 14, 2026 inside the hacking window
(Fri Nov 13, 10:30 AM PT → Sat Nov 14, 10:30 PM PT). Submissions close Sat Nov 14,
10:30 PM PT on Vultr Community (target 9:30 PM PT).

## Structure

```
ustaadai-v2/
├── README.md
├── BUILD-STATUS.md
├── vercel.json                 # frontend: Next.js, root directory web
├── api/                        # Node.js 24 + Express 5 (TS) backend — built in parallel
├── web/                        # Next.js 14 frontend — built in parallel
├── infra/
│   ├── vultr-setup.sh          # first-time Ubuntu 24.04 setup (run once as root)
│   ├── deploy.sh               # per-deploy script (run as user `ustaad`)
│   ├── ustaad-api.service      # systemd unit
│   ├── nginx-ustaadai.conf     # nginx reverse proxy (:80 → 127.0.0.1:3001)
│   └── DEPLOY-CHECKLIST.md     # step-by-step deploy runbook
└── docs/
    ├── SYSTEM-DIAGRAM.md
    ├── DEMO-SCRIPT.md
    └── SUBMISSION-CONTENT.md
```

## Verified facts

- **Seeded content:** 20 chunks / 24 Q&A pairs / 24 quiz items.
- **Chapters:**

| Chapter | Subject |
| --- | --- |
| Physics 9 — Ch 2: Kinematics | Physics |
| Maths 10 — Ch 2: Quadratic Equations | Maths |
| English 10 — Unit 5: The Happy Prince | English |

- **Backend:** Node.js + Express 5 (TypeScript), entry `src/server.ts` →
  `dist/server.js`, listens on `PORT` (default 3001), SQLite file `api/data.db`.
- **Endpoints:** `/health`, `/api/chapters`, `/api/tutor/chat`,
  `/api/quiz/start`, `/api/quiz/submit`, `/api/progress/:sessionId`.
- **Modes:** deterministic by default; Gemini if `GEMINI_API_KEY` is set.
- **Deploy package files (this task):** `infra/vultr-setup.sh`,
  `infra/deploy.sh`, `infra/ustaad-api.service`, `infra/nginx-ustaadai.conf`,
  `infra/DEPLOY-CHECKLIST.md`, `vercel.json`, `README.md`, `docs/SYSTEM-DIAGRAM.md`,
  `docs/DEMO-SCRIPT.md`, `docs/SUBMISSION-CONTENT.md`, `BUILD-STATUS.md`.
- **Deploy target:** backend on Vultr Compute `vc2-1c-1gb` ($5/mo, Los Angeles,
  Ubuntu 24.04); frontend on Vercel (root directory `web`).
- **Submission route:** Vultr Community, community.vultr.com/e/hackglobal-2026,
  tag "Hackathons", event "HackGlobal 2026". Prize pool $15,000 total.
- **Team:** solo — Umar Shareef (team umar3529).

## Hardening pass (win-gap analysis, Sat Nov 14, ~04:00–04:35 AM PT)

Win-gap analysis in `docs/WIN-GAPS.md` (probed live, not guessed). All critical
and important gaps fixed in-window; nothing pushed/deployed.

**Fixed + verified live:**
- **Exact quadratic solver** (`api/src/quad.ts`, 14 new tests) — `2x² + 5x − 3 = 0`
  now solves exactly (D = 49, x = 0.5 ya −3) instead of returning another
  equation's canned answer. Discriminant-only requests compute D.
- **Exact dynamics solver** (`api/src/dynamics.ts`, 7 new tests) — F = ma and
  p = mv solved by code (5 kg × 2 m/s² → 10 N; 2 kg × 3 m/s → 6 kg·m/s).
- **Urdu-script retrieval** — `search.ts` now indexes `textUr`; "ایکسلریشن کیا ہے؟"
  answers (was refused). Added ایکسلریشن keyword.
- **Dynamics gate false-positive fixed** — "dynamics" removed from the
  off-syllabus list; new seeded QA P-Q9 (kinematics vs dynamics) answers it.
- **Moral question fixed** — E-Q4 reworded to "The Happy Prince ka moral / theme
  kya hai?" so it matches the themes chunk, not the story summary.
- **4th chapter: Physics 9 Ch 3 — Dynamics** (`api/data/seed/physics-dynamics.json`) —
  7 chunks, 8 Q&A, 8 quiz. New totals: **4 chapters, 27 chunks, 33 Q&A, 32 quiz**.
- **Chat auto-scroll** (tutor page), **unanswered count on quiz submit button**
  ("Submit karo (5 sawal baghair jawab)"), **capitalised subjects** on home
  cards/tabs, Dynamics wired into fallback chapters, dashboard names, tutor
  suggestions, scope note.
- **Architecture diagram as a real image** — `docs/architecture.svg` (valid XML),
  referenced from SYSTEM-DIAGRAM.md + SUBMISSION-CONTENT.md for the form upload.
- **Fresh screenshots** — home (4 cards), tutor physics numerical, quiz 5/5 +
  mastery 100%, dashboard — all from the hardened build, 0 console errors,
  0 failed requests (headless Chrome 156 CDP E2E, 17/17 checks incl. 4 corrected
  re-tests; the 4 initial "failures" were bad assertions in the test script,
  not app bugs — verified by the corrected re-run).
- **API tests: 46/46 pass** (was 24/24) — `npm test` in `api/`, tsc strict clean,
  `next build` clean (5 routes, all 200 live).
- **DB reset to fresh state** after probing (sessions 0); `api/data.db` is
  gitignored.

## Verification (integration run by the coordinator, Sat Nov 14, ~11:40 AM PT)

All items below were observed live on this VM (localhost staging). Nothing here
is invented.

- [x] **API unit tests: 24/24 passing** (`npm test` in `api/`, ~1.1s, 0 fail) —
  retrieval, tutor (incl. every seeded QA resolving to its canned answer),
  quiz marking (all 4 types), content/sections. Two bugs found and fixed
  during integration: (1) mastery was returned as a 0–1 fraction while the
  frontend renders 0–100 — fixed in `src/store.ts` to return a 0–100
  percentage (5/5 → 100, mixed 10 attempts → 50); (2) `/api/chapters`
  omitted `sections` — fixed in `src/content.ts`, with a new regression test
  (`tests/content.test.ts`).
- [x] **`tsc` build: clean** (strict, exit 0) — `dist/` has all 7 modules.
- [x] **Live curl checks (PORT 3001, deterministic):** `/health` →
  `{"ok":true,"mode":"deterministic","chapters":3,"chunks":20,"quizItems":24}`;
  `/api/chapters` → 3 chapters, sections 8/7/5, quiz 8/8/8; tutor physics
  numerical → vf=10 m/s, S=25 m, citation `phy-kin-2.6-eom`, follow-up
  "4 m/s²"; free fall t=5 → 50 m/s, 125 m; off-syllabus (chemistry) →
  refusal, 0 citations; maths discriminant → D = b² − 4ac with
  `mat-quad-2.5-discriminant` citation; English author → Oscar Wilde;
  quiz start → 5 questions, no answer leak; quiz submit 5/5 → mastery 100,
  empty revision plan; mixed run → mastery 50 with 5 weak-topic revision
  lines; `/api/progress/:id` matches.
- [x] **Frontend `next build`: clean** — 5 routes prerendered: `/`, `/tutor`,
  `/quiz`, `/dashboard`, `/icon.svg`. Plain JavaScript only (0 source `.ts`
  files; the 5 `.ts` files under `.next/types/` are Next.js-generated).
  All 4 pages serve HTTP 200 with the API live and with the API down.
- [x] **Browser E2E (headless Chrome 156, puppeteer-core): 17/17 passed,
  zero page errors, zero failed requests** — home (3 chapters, mode pill),
  tutor numerical + citation + follow-up, off-syllabus refusal, maths
  discriminant, English author, quiz 5/5 via UI with mastery 100%,
  dashboard mastery 100% (5 attempts, 5 correct), Urdu-script toggle.
  Screenshots: `docs/screenshots/` (home, tutor-physics, quiz, dashboard),
  visually confirmed.
- [ ] **Demo video recorded against live Vultr URL:** (pending — his device,
  after deploy)
- [ ] **Public GitHub repo URL:** (pending — `gh auth` his-only)
- [ ] **Live demo URL:** (pending — Vultr $200 credit code; his form fill at
  https://binary.so/JEFuZzv)
- [ ] **Vultr username for submission:** (pending)

## Still blocked (his-only)

1. **Vultr $200 gift code** — form https://binary.so/JEFuZzv was FILLED Nov 14
   ~03:50 PT but the browser task EXPIRED 05:51 PT before the (mandatory)
   dashboard screenshot arrived, so the form must be re-filled from scratch
   when his screenshot arrives; without the code the backend cannot go live
   on Vultr.
2. **GitHub push** — repo is local-only; needs `gh auth login` on his machine.
3. **Vercel frontend deploy** — needs his browser flow (`NEXT_PUBLIC_API_URL`
   = Vultr IP once deployed).
4. **Demo video** — record against the LIVE Vultr URL only (see
   `docs/DEMO-SCRIPT.md`).
5. **Submission** — Vultr Community form, by Sat 9:30 PM PT (close 10:30 PM
   PT); content ready in `docs/SUBMISSION-CONTENT.md`.
6. **Gemini API key** — optional; deterministic mode works fully without it.
   The Gemini path is implemented but untested live (no key in this
   environment).

## Local staging (live on this VM)

- API http://127.0.0.1:3001 · Web http://127.0.0.1:3000 (both running;
  verified 17/17 E2E against them). Restart API: `cd api && PORT=3001
  MODE=deterministic node dist/server.js`. Restart web: `cd web &&
  NEXT_PUBLIC_API_URL=http://127.0.0.1:3001 npm run start -- -p 3000`.

## Fresh verification — Sat Nov 14, ~05:30–06:30 PT (pre-submission pass)

Two real gaps found by live curl probes (not by the unit suite) and fixed
in-window; commit `09cfda9` (local only, NOT pushed):

1. **Chemistry false-match (grounding bug):** "Explain the chemical reaction
   of photosynthesis" was answered with Newton's third law (the word
   "reaction" matched the action–reaction chunk) instead of refusing.
   Cause: the off-syllabus gate listed "chemistry" but not "chemical" /
   "photosynthesis". Fix: 24 chemistry/biology gate terms added to
   `src/tutor.ts` (chemical, photosynthesis, acid, atom, molecule, compound,
   periodic table, oxidation, reduction, respiration, digestion, ecosystem,
   food chain, dna, evolution, cell, nucleus, tissue, hormone, enzyme,
   vitamin, fertiliser/fertilizer, pesticide, herbicide). Verified live:
   photosynthesis question now returns `refusal: true` with the 4-chapter
   refusal text.
2. **Dynamics solver answered the wrong quantity:** "A 2 kg object is pushed
   with a force of 10 N. What is its acceleration?" returned
   "Jawab: force 10 newton" (the given value) although it had computed a = 5.
   Cause: `renderForceAnswer*` always rendered the force line. Fix: the
   solver now reports which value was unknown and the render answers that
   quantity (`a = F/m = 10 / 2 = 5 m/s²`, "Jawab: acceleration 5 m/s²";
   same for mass). Verified live; regression test added.

Fresh numbers (this pass): API unit tests **47/47 pass** (46 + 1 new
regression test); `tsc --noEmit` exit 0; API build exit 0; web production
build exit 0 (5 routes); live probes green — quadratic `2x²+5x−3=0` →
D=49, x=0.5/−3; Urdu-script acceleration answered; F=ma → 10 N;
momentum → 6 kg·m/s; chemistry refused. Headless-browser E2E
(Chrome 156): **17/17 passed**, 0 console errors, 0 failed requests
(quiz flow re-run with corrected selectors — options are `.option-btn`
buttons, not radio inputs; 5 cards, 18 option buttons, all answered,
Score + Mastery + 5 verdicts shown).

Docs: `docs/SUBMISSION-CONTENT.md` corrected (was stale: "3 chapters, 20
chunks, 24 Q&A, 24 quiz" → now "4 chapters, 27 chunks, 33 Q&A, 32 quiz");
placeholders remain ONLY for GitHub repo URL, live demo URL, Vultr
username — nothing invented. `infra/vultr-setup.sh` + `infra/deploy.sh`
both `bash -n` clean and runnable as written. Credits form
https://binary.so/JEFuZzv: the dashboard-screenshot field IS mandatory
(marked `*` in the live form, seen by the browser task Nov 14 ~03:50 PT;
a plain text fetch of the link only shows the Binary landing page).

⚠️ **Credits-form browser task EXPIRED 05:51 PT** (Cloudflare blocked the
Vultr sign-in 4×). The filled form is gone — it must be re-filled from
scratch when his screenshot arrives (values in `RUNBOOK-TONIGHT.md`).
Staging servers were restarted ~06:30 PT after a VM/service restart killed
them; API + web verified live again after restart.
