/**
 * Exact dynamics solver — F = ma and p = mv.
 * Parses plain student wording like "mass 5 kg, acceleration 2 m/s², force
 * kitni?" or "mass 2 kg, velocity 3 m/s, momentum kitna?".
 * Returns null unless exactly two of the three values are present, so the
 * caller falls through to retrieval instead of guessing.
 */

export interface ForceProblem {
  F: number | null;
  m: number | null;
  a: number | null;
}

export interface MomentumProblem {
  m: number;
  v: number;
  p: number;
}

const NUM = String.raw`(\d+(?:\.\d+)?)`;

function extractMass(lower: string): number | null {
  let m = lower.match(new RegExp(`${NUM}\\s*kg`));
  if (m) return parseFloat(m[1]);
  m = lower.match(new RegExp(`(?:mass|m)\\s*=\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  m = lower.match(new RegExp(`mass\\s*(?:is|:)?\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  return null;
}

function extractForce(lower: string): number | null {
  let m = lower.match(new RegExp(`${NUM}\\s*(?:n|newton)`));
  if (m) return parseFloat(m[1]);
  m = lower.match(new RegExp(`(?:force|f)\\s*=\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  m = lower.match(new RegExp(`force\\s*(?:is|:)?\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  return null;
}

function extractAccel(lower: string): number | null {
  let m = lower.match(new RegExp(`${NUM}\\s*m\\/s[²2]`));
  if (m) return parseFloat(m[1]);
  m = lower.match(new RegExp(`(?:acceleration|a)\\s*=\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  m = lower.match(new RegExp(`acceleration\\s*(?:is|:)?\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  return null;
}

function extractVelocity(lower: string): number | null {
  let m = lower.match(new RegExp(`${NUM}\\s*m\\/s(?!\\s*[²2])`));
  if (m) return parseFloat(m[1]);
  m = lower.match(new RegExp(`(?:velocity|v)\\s*=\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  return null;
}

export function parseForceProblem(message: string): ForceProblem | null {
  const lower = message.toLowerCase();
  const m = extractMass(lower);
  const F = extractForce(lower);
  const a = extractAccel(lower);
  const known = [m, F, a].filter((v) => v !== null).length;
  if (known < 2) return null;
  return { F, m, a };
}

export function solveForce(p: ForceProblem): { F: number; m: number; a: number } {
  if (p.F === null && p.m !== null && p.a !== null) return { F: p.m * p.a, m: p.m, a: p.a };
  if (p.m === null && p.F !== null && p.a !== null) return { F: p.F, m: p.F / p.a, a: p.a };
  if (p.a === null && p.F !== null && p.m !== null) return { F: p.F, m: p.m, a: p.F / p.m };
  throw new Error("solveForce needs exactly two known values");
}

export function parseMomentumProblem(message: string): MomentumProblem | null {
  const lower = message.toLowerCase();
  if (!/momentum/.test(lower)) return null;
  const m = extractMass(lower);
  const v = extractVelocity(lower);
  if (m === null || v === null) return null;
  return { m, v, p: m * v };
}

export function asksDynamicsNumbers(message: string): boolean {
  const lower = ` ${message.toLowerCase()} `;
  return (
    lower.includes("force") ||
    lower.includes("momentum") ||
    lower.includes("f = ma") ||
    lower.includes("f=ma") ||
    (lower.includes("mass") && (lower.includes("acceleration") || lower.includes("velocity")))
  );
}

function fmt(n: number): string {
  const s = Number.isInteger(n) ? String(n) : String(parseFloat(n.toFixed(2)));
  return s.replace(/-/g, "−");
}

export type AskedQuantity = "F" | "m" | "a";

/**
 * Renders the answer for the quantity that was actually asked (the unknown
 * value in the parsed problem). Previously the Jawab line always said
 * "force …" even when the student asked for acceleration or mass.
 */
export function renderForceAnswerUr(
  r: { F: number; m: number; a: number },
  asked: AskedQuantity = "F",
): string {
  if (asked === "a") {
    return [
      `مرحلہ 1 — دیا گیا (Given): m = ${fmt(r.m)} kg، F = ${fmt(r.F)} N۔`,
      `مرحلہ 2 — دوسرا قانون (Newton's Second Law): a = F/m = ${fmt(r.F)} / ${fmt(r.m)} = ${fmt(r.a)} m/s²۔`,
      `Jawab: acceleration ${fmt(r.a)} m/s²۔`,
    ].join("\n");
  }
  if (asked === "m") {
    return [
      `مرحلہ 1 — دیا گیا (Given): F = ${fmt(r.F)} N، a = ${fmt(r.a)} m/s²۔`,
      `مرحلہ 2 — دوسرا قانون (Newton's Second Law): m = F/a = ${fmt(r.F)} / ${fmt(r.a)} = ${fmt(r.m)} kg۔`,
      `Jawab: mass ${fmt(r.m)} kg۔`,
    ].join("\n");
  }
  return [
    `مرحلہ 1 — دیا گیا (Given): m = ${fmt(r.m)} kg، a = ${fmt(r.a)} m/s²۔`,
    `مرحلہ 2 — دوسرا قانون (Newton's Second Law): F = ma = ${fmt(r.m)} × ${fmt(r.a)} = ${fmt(r.F)} N۔`,
    `Jawab: force ${fmt(r.F)} newton۔`,
  ].join("\n");
}

export function renderForceAnswerRoman(
  r: { F: number; m: number; a: number },
  asked: AskedQuantity = "F",
): string {
  if (asked === "a") {
    return [
      `Step 1 — Given: m = ${fmt(r.m)} kg, F = ${fmt(r.F)} N.`,
      `Step 2 — Newton's Second Law: a = F/m = ${fmt(r.F)} / ${fmt(r.m)} = ${fmt(r.a)} m/s².`,
      `Jawab: acceleration ${fmt(r.a)} m/s².`,
    ].join("\n");
  }
  if (asked === "m") {
    return [
      `Step 1 — Given: F = ${fmt(r.F)} N, a = ${fmt(r.a)} m/s².`,
      `Step 2 — Newton's Second Law: m = F/a = ${fmt(r.F)} / ${fmt(r.a)} = ${fmt(r.m)} kg.`,
      `Jawab: mass ${fmt(r.m)} kg.`,
    ].join("\n");
  }
  return [
    `Step 1 — Given: m = ${fmt(r.m)} kg, a = ${fmt(r.a)} m/s².`,
    `Step 2 — Newton's Second Law: F = ma = ${fmt(r.m)} × ${fmt(r.a)} = ${fmt(r.F)} N.`,
    `Jawab: force ${fmt(r.F)} newton.`,
  ].join("\n");
}

export function renderMomentumAnswerUr(p: MomentumProblem): string {
  return [
    `مرحلہ 1 — دیا گیا (Given): m = ${fmt(p.m)} kg، v = ${fmt(p.v)} m/s۔`,
    `مرحلہ 2 — مومنٹم: p = mv = ${fmt(p.m)} × ${fmt(p.v)} = ${fmt(p.p)} kg·m/s۔`,
    `Jawab: momentum ${fmt(p.p)} kg·m/s۔`,
  ].join("\n");
}

export function renderMomentumAnswerRoman(p: MomentumProblem): string {
  return [
    `Step 1 — Given: m = ${fmt(p.m)} kg, v = ${fmt(p.v)} m/s.`,
    `Step 2 — Momentum: p = mv = ${fmt(p.m)} × ${fmt(p.v)} = ${fmt(p.p)} kg·m/s.`,
    `Jawab: momentum ${fmt(p.p)} kg·m/s.`,
  ].join("\n");
}
