import { allChunks, chunkById, type SeedChunk } from "./content.js";
import { retrieve } from "./search.js";
import {
  asksMotionNumbers,
  motionFollowUp,
  parseMotionProblem,
  renderMotionAnswerRoman,
  renderMotionAnswerUr,
  solveMotion,
} from "./solver.js";
import {
  asksQuadratic,
  parseQuadratic,
  quadraticFollowUp,
  renderQuadraticAnswerRoman,
  renderQuadraticAnswerUr,
  solveQuadratic,
} from "./quad.js";
import {
  asksDynamicsNumbers,
  parseForceProblem,
  parseMomentumProblem,
  renderForceAnswerRoman,
  renderForceAnswerUr,
  renderMomentumAnswerRoman,
  renderMomentumAnswerUr,
  solveForce,
} from "./dynamics.js";

export interface TutorCitation {
  chunkId: string;
  chapter: string;
  section: string;
}

export interface TutorAnswer {
  answer: string;
  answerUr: string;
  answerRoman: string;
  followUp: string;
  followUpRoman: string;
  citations: TutorCitation[];
  mode: "gemini" | "deterministic";
  refusal: boolean;
}

export const REFUSAL_UR =
  "یہ سوال میرے 4 چیپٹرز (Physics 9 — Kinematics، Physics 9 — Dynamics، Maths 10 — Quadratic Equations، English 10 — The Happy Prince) سے باہر ہے۔ میں صرف انہی چیپٹرز میں مدد کر سکتا ہوں — آپ ان میں سے کوئی سوال پوچھیں۔";

export const REFUSAL_ROMAN =
  "Ye sawal mere 4 chapters (Physics 9 — Kinematics, Physics 9 — Dynamics, Maths 10 — Quadratic Equations, English 10 — The Happy Prince) se bahar hai. Main sirf inhi chapters mein madad kar sakta hoon — aap in mein se koi sawal poochhein.";

export const GENERIC_FOLLOWUP_UR = "اب آپ بتائیے: اس موضوع کا کون سا حصہ سب سے مشکل لگتا ہے؟";
export const GENERIC_FOLLOWUP_ROMAN =
  "Ab aap batayein: is topic ka kaun sa hissa sab se mushkil lagta hai?";

/** Off-syllabus gate — checked BEFORE any retrieval or LLM call. */
const OFF_SYLLABUS_TERMS = [
  "chemistry", "chemical", "photosynthesis", "acid", "atom", "molecule",
  "compound", "periodic table", "oxidation", "reduction", "respiration",
  "digestion", "ecosystem", "food chain", "dna", "evolution", "cell ",
  "nucleus", "tissue", "hormone", "enzyme", "vitamin", "fertiliser",
  "fertilizer", "pesticide", "herbicide",
  "biology", "bio ", "thermodynamics", "electricity",
  "magnetism", "optics", "waves", "history", "geography", "islamiat", "islamiyat",
  "pakistan studies", "computer", "programming", "cricket", "match", "football",
  "weather", "news", "politics", "movie", "song", "game", "syllabus",
  "past paper", "guess paper",
  "chapter 3", "chapter 4", "chapter 5", "chapter 6", "chapter 7", "chapter 8", "chapter 9",
  "unit 1", "unit 2", "unit 3", "unit 4", "unit 6", "unit 7", "unit 8", "unit 9", "unit 10",
  "class 8", "class 11", "class 12", "fsc", "inter ",
  "trigonometry", "calculus", "integration", "differentiation", "circle", "triangle",
  "geometry", "statistics", "probability",
];

function refusal(): TutorAnswer {
  return {
    answer: REFUSAL_UR,
    answerUr: REFUSAL_UR,
    answerRoman: REFUSAL_ROMAN,
    followUp: GENERIC_FOLLOWUP_UR,
    followUpRoman: GENERIC_FOLLOWUP_ROMAN,
    citations: [],
    mode: "deterministic",
    refusal: true,
  };
}

function toCitation(chunk: SeedChunk): TutorCitation {
  return { chunkId: chunk.id, chapter: chunk.chapter, section: chunk.section };
}

function geminiAvailable(): boolean {
  return Boolean(process.env.GEMINI_API_KEY) && process.env.MODE !== "deterministic";
}

async function answerWithGemini(
  message: string,
  chunks: SeedChunk[],
): Promise<{ text: string; followUpRoman: string } | null> {
  const key = process.env.GEMINI_API_KEY as string;
  const chunkBlock = chunks
    .map(
      (c) =>
        `[${c.id}] ${c.chapter} — ${c.section}\nEN: ${c.textEn}\nUR: ${c.textUr}\nFormulas: ${(c.formulas ?? []).join("; ") || "—"}`,
    )
    .join("\n\n");
  const prompt = [
    "You are UstaadAI, an Urdu-first tutor for Pakistan Matric students.",
    "Your only syllabus is: Physics 9 — Kinematics, Maths 10 — Quadratic Equations, English 10 — The Happy Prince.",
    "Answer ONLY from the textbook chunks below. Do not use outside knowledge.",
    "Answer in Urdu script first, then the same answer in Roman Urdu.",
    "Keep the answer short and clear, with the formulas where relevant.",
    "End with a line starting exactly with \"Follow-up:\" followed by one follow-up question in Roman Urdu.",
    "",
    "Textbook chunks:",
    chunkBlock,
    "",
    `Student question: ${message}`,
  ].join("\n");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.2, maxOutputTokens: 800 },
    }),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p.text ?? "")
    .join("")
    .trim();
  if (!text) return null;

  let followUpRoman = GENERIC_FOLLOWUP_ROMAN;
  let body = text;
  const lines = text.split("\n");
  const fuIdx = lines.findIndex((l) => l.trim().toLowerCase().startsWith("follow-up:"));
  if (fuIdx >= 0) {
    const fu = lines[fuIdx].replace(/^follow-up:\s*/i, "").trim();
    if (fu) followUpRoman = fu;
    body = [...lines.slice(0, fuIdx), ...lines.slice(fuIdx + 1)].join("\n").trim();
  }
  return { text: body, followUpRoman };
}

export async function answerTutor(message: string, chapterId?: string): Promise<TutorAnswer> {
  // (1) Empty message → refusal.
  if (!message || !message.trim()) return refusal();

  // (2) Off-syllabus gate BEFORE any retrieval / LLM.
  const padded = ` ${message.toLowerCase()} `;
  if (OFF_SYLLABUS_TERMS.some((term) => padded.includes(term))) return refusal();

  // (3) Exact equations-of-motion solver.
  if (asksMotionNumbers(message)) {
    const problem = parseMotionProblem(message);
    if (problem) {
      const result = solveMotion(problem);
      const fu = motionFollowUp(result);
      const eom = chunkById("phy-kin-2.6-eom");
      return {
        answer: renderMotionAnswerUr(result),
        answerUr: renderMotionAnswerUr(result),
        answerRoman: renderMotionAnswerRoman(result),
        followUp: fu.followUp,
        followUpRoman: fu.followUpRoman,
        citations: eom ? [toCitation(eom)] : [],
        mode: "deterministic",
        refusal: false,
      };
    }
  }

  // (3b) Exact quadratic-equation solver (roots + discriminant, by code).
  if (asksQuadratic(message)) {
    const qp = parseQuadratic(message);
    if (qp) {
      const qr = solveQuadratic(qp);
      const fu = quadraticFollowUp(qr);
      const cites = ["mat-quad-2.5-discriminant", "mat-quad-2.4-quadratic-formula"]
        .map((id) => chunkById(id))
        .filter((c): c is SeedChunk => c !== undefined)
        .map(toCitation);
      return {
        answer: renderQuadraticAnswerUr(qr),
        answerUr: renderQuadraticAnswerUr(qr),
        answerRoman: renderQuadraticAnswerRoman(qr),
        followUp: fu.followUp,
        followUpRoman: fu.followUpRoman,
        citations: cites,
        mode: "deterministic",
        refusal: false,
      };
    }
  }

  // (3c) Exact dynamics solver (F = ma, momentum p = mv).
  if (asksDynamicsNumbers(message)) {
    const fp = parseForceProblem(message);
    if (fp) {
      const fr = solveForce(fp);
      // The asked quantity is the one value the student did NOT give.
      const asked = fp.F === null ? "F" : fp.m === null ? "m" : "a";
      const law = chunkById("phy-dyn-3.2-second-law");
      return {
        answer: renderForceAnswerUr(fr, asked),
        answerUr: renderForceAnswerUr(fr, asked),
        answerRoman: renderForceAnswerRoman(fr, asked),
        followUp: "Agar mass double ho jaye to wohi acceleration ke liye force kitni hogi?",
        followUpRoman: "Agar mass double ho jaye to wohi acceleration ke liye force kitni hogi?",
        citations: law ? [toCitation(law)] : [],
        mode: "deterministic",
        refusal: false,
      };
    }
    const mp = parseMomentumProblem(message);
    if (mp) {
      const mom = chunkById("phy-dyn-3.4-momentum");
      return {
        answer: renderMomentumAnswerUr(mp),
        answerUr: renderMomentumAnswerUr(mp),
        answerRoman: renderMomentumAnswerRoman(mp),
        followUp: "Agar velocity double ho jaye to momentum kitna ho jayega?",
        followUpRoman: "Agar velocity double ho jaye to momentum kitna ho jayega?",
        citations: mom ? [toCitation(mom)] : [],
        mode: "deterministic",
        refusal: false,
      };
    }
  }

  // (4) Retrieval; too weak → refusal.
  const results = retrieve(message, chapterId, 3);
  if (results.length === 0 || results[0].score < 3) return refusal();
  const citations = results.map((r) => toCitation(r.chunk));

  // (5) Seeded-QA match → canned answer.
  const best = results[0];
  if (best.matchedQaId) {
    const qa = (best.chunk.qa ?? []).find((q) => q.id === best.matchedQaId);
    if (qa) {
      return {
        answer: qa.a,
        answerUr: qa.a,
        answerRoman: qa.aRoman,
        followUp: qa.followUp,
        followUpRoman: qa.followUpRoman,
        citations,
        mode: "deterministic",
        refusal: false,
      };
    }
  }

  // (6) Gemini, grounded in the retrieved chunks — any failure falls through.
  if (geminiAvailable()) {
    try {
      const g = await answerWithGemini(message, results.map((r) => r.chunk));
      if (g) {
        return {
          answer: g.text,
          answerUr: g.text,
          answerRoman: g.text,
          followUp: GENERIC_FOLLOWUP_UR,
          followUpRoman: g.followUpRoman,
          citations,
          mode: "gemini",
          refusal: false,
        };
      }
    } catch {
      // Fall through to the deterministic chunk answer.
    }
  }

  // (7) Deterministic chunk answer.
  const chunk = best.chunk;
  const formulas = chunk.formulas ?? [];
  const answerUr =
    chunk.textUr + (formulas.length > 0 ? `\nفارمولے: ${formulas.join("، ")}` : "");
  return {
    answer: answerUr,
    answerUr,
    answerRoman: chunk.textRoman,
    followUp: GENERIC_FOLLOWUP_UR,
    followUpRoman: GENERIC_FOLLOWUP_ROMAN,
    citations,
    mode: "deterministic",
    refusal: false,
  };
}

export function allSeededQaIds(): string[] {
  return allChunks().flatMap((c) => (c.qa ?? []).map((q) => q.id));
}

export function allSeededQa(): Array<{
  id: string;
  q: string;
  a: string;
  aRoman: string;
  followUp: string;
  followUpRoman: string;
  chunkId: string;
}> {
  return allChunks().flatMap((c) =>
    (c.qa ?? []).map((q) => ({ ...q, chunkId: c.id })),
  );
}
