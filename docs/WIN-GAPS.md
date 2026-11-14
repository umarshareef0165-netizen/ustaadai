# UstaadAI v2 — Win-Gap Analysis (Phase 1, Sat Nov 14, ~04:00 AM PT)

Scored live against HackGlobal judging: **Merit + Reach + bonus**. Build verified
locally first (API 24/24, tsc clean, E2E 17/17), then probed with real student
questions via curl against the live staging API.

## Scores (honest)

| Area | Score | Note |
|---|---|---|
| Feature completeness | 7/10 | Tutor + quiz + dashboard + exact physics solver all work; maths numerics NOT solved exactly; only 3 chapters |
| Smoothness | 8/10 | No dead ends, honest error states; chat does not auto-scroll; quiz allows silent blank submit |
| UI/UX polish | 8/10 | Clean, readable, good colour system; chapter subjects lowercase on home cards |
| Urdu-first quality | 6/10 | Roman Urdu strong; **Urdu-script questions can be refused** (textUr not indexed; "ایکسلریشن کیا ہے؟" → refusal) |
| Grounding accuracy | 6/10 | Citations + gate strong; **wrong-equation QA match returns another equation's answer** (`2x²+5x−3=0` → x=2,3); **moral question returns story summary** |
| Mastery / revision | 8/10 | Works, verified live (100 / 50 + weak-topic plan) |
| README + diagram | 7/10 | README strong; architecture diagram is mermaid text only — no image file for the Vultr Community upload |
| Demo script | 8/10 | Tight 2:30 plan; maths shot does not use an exact solver (none existed) |
| Reach | 0/10 | 0 real test users — his-only, cannot be faked |

## CRITICAL gaps (judge would dock or fail the demo)

1. **Wrong answer for a different equation (C1).** ✅ FIXED — exact quadratic
   solver (`api/src/quad.ts`); `2x²+5x−3=0` → D=49, x=0.5/−3, verified live.
2. **Urdu-script question refused (C2).** ✅ FIXED — textUr indexed in search.ts
   + ایکسلریشن keyword; "ایکسلریشن کیا ہے؟" answers live.
3. **"Dynamics" gate false-positive (C3).** ✅ FIXED — "dynamics" out of the gate
   + seeded QA P-Q9; question answers live.
4. **Moral question returns story summary (C4).** ✅ FIXED — E-Q4 reworded;
   moral query now matches the themes chunk, verified live.
5. **Only 3 chapters (C5).** ✅ FIXED — Physics 9 Ch 3 Dynamics added
   (7 chunks, 8 QA, 8 quiz, F=ma + momentum solver). Totals now 4 chapters,
   27 chunks, 33 Q&A, 32 quiz.

## IMPORTANT gaps

6. **Chat does not auto-scroll (I1).** ✅ FIXED — scrolls to bottom on new
   message, verified in browser E2E.
7. **No architecture image (I2).** ✅ FIXED — `docs/architecture.svg` (valid XML).
8. **Silent blank quiz submit (I3).** ✅ FIXED — button shows unanswered count.
9. **Lowercase subjects on home cards (I4).** ✅ FIXED — capitalised.
10. **Discriminant not computed (I5).** ✅ FIXED — covered by the quadratic solver.

## NICE-TO-HAVE (deliberately not done)

- Voice input: cannot verify without a mic in the VM; demo is text-based.
- Chat history persistence: refresh loses chat; low judge impact, skip.
- More chapters beyond Dynamics: diminishing returns vs. accuracy risk in-window.

## NOT fixable by code (his-only)

- 3 real test users (Reach) — his step, never fake.
- Vultr $200 credit code → deploy; gh push; demo video vs live URL; submit by
  Sat 9:30 PM PT.
