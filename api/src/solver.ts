export interface MotionProblem {
  vi: number;
  a: number;
  t: number;
  freeFall: boolean;
}

export interface MotionResult extends MotionProblem {
  vf: number;
  S: number;
}

const NUM = String.raw`(\d+(?:\.\d+)?)`;

function extractTime(lower: string): number | null {
  // "5 second(s)" / "5 sec"
  let m = lower.match(new RegExp(`${NUM}\\s*(?:seconds?|sec)\\b`));
  if (m) return parseFloat(m[1]);
  // "t = 5"
  m = lower.match(new RegExp(`t\\s*=\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  // Bare "5 s" — strip "m/s²" / "m/s" first so the s in m/s is not mistaken for seconds.
  const stripped = lower.replace(new RegExp(`${NUM}\\s*m\\/s[²2]?`, "g"), " ");
  m = stripped.match(new RegExp(`${NUM}\\s*s\\b`));
  if (m) return parseFloat(m[1]);
  return null;
}

function extractAcceleration(lower: string): number | null {
  // "2 m/s²" / "4 m/s2"
  let m = lower.match(new RegExp(`${NUM}\\s*m\\/s[²2]`));
  if (m) return parseFloat(m[1]);
  // "a = 2"
  m = lower.match(new RegExp(`a\\s*=\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  // "acceleration 2" / "acceleration = 2"
  m = lower.match(new RegExp(`acceleration\\s*(?:=|:|is)?\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  return null;
}

function extractInitialVelocity(lower: string): number | null {
  // Rest / aaram se / from rest → vi = 0
  if (/\brest\b/.test(lower) || /aaram|araam/.test(lower) || /from rest/.test(lower)) return 0;
  // "vi = 5"
  let m = lower.match(new RegExp(`vi\\s*=\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  // "initial velocity 5" / "initial velocity = 5"
  m = lower.match(new RegExp(`initial velocity\\s*(?:=|:|is)?\\s*${NUM}`));
  if (m) return parseFloat(m[1]);
  return null;
}

/**
 * Exact equations-of-motion parser.
 * Free fall (giraya / gira / free fall / drop) → g = 10, vi = 0, needs t.
 * Otherwise needs a, t and vi. Returns null if any required value is missing.
 */
export function parseMotionProblem(message: string): MotionProblem | null {
  const lower = message.toLowerCase();
  const t = extractTime(lower);
  if (/giraya|gira|free\s*fall|drop/.test(lower)) {
    if (t === null) return null;
    return { vi: 0, a: 10, t, freeFall: true };
  }
  const a = extractAcceleration(lower);
  const vi = extractInitialVelocity(lower);
  if (a === null || t === null || vi === null) return null;
  return { vi, a, t, freeFall: false };
}

/** vf = vi + at ; S = vi·t + ½at² */
export function solveMotion(p: MotionProblem): MotionResult {
  const vf = p.vi + p.a * p.t;
  const S = p.vi * p.t + 0.5 * p.a * p.t * p.t;
  return { ...p, vf, S };
}

const MOTION_NUMBER_HINTS = [
  "final velocity",
  "vf",
  "distance",
  "fasla",
  "numerical",
  "hisab",
  "calculate",
  "nikalo",
  "velocity kitni",
  "speed kitni",
  "velocity",
  "speed",
  "kitni hogi",
  "tay ki",
  "kitna fasla",
  "free fall",
  "gira",
  "drop",
  "pathar",
  "stone",
];

/** True when the message looks like it asks for motion numbers (vf / distance). */
export function asksMotionNumbers(message: string): boolean {
  const lower = ` ${message.toLowerCase()} `;
  return MOTION_NUMBER_HINTS.some((h) => lower.includes(h));
}

function fmt(n: number): string {
  if (Number.isInteger(n)) return String(n);
  return String(parseFloat(n.toFixed(2)));
}

export function renderMotionAnswerUr(r: MotionResult): string {
  const accLabel = r.freeFall ? `g = ${fmt(r.a)} m/s²` : `a = ${fmt(r.a)} m/s²`;
  const sym = r.freeFall ? "g" : "a";
  const lines = [
    `مرحلہ 1 — دیا گیا (Given): vi = ${fmt(r.vi)} m/s، ${accLabel}، t = ${fmt(r.t)} s۔`,
    `مرحلہ 2 — آخری سمتار (Final Velocity): vf = vi + ${sym}t = ${fmt(r.vi)} + (${fmt(r.a)} × ${fmt(r.t)}) = ${fmt(r.vf)} m/s۔`,
    `مرحلہ 3 — فاصلہ (Distance): S = vi·t + ½${sym}t² = (${fmt(r.vi)} × ${fmt(r.t)}) + ½ × ${fmt(r.a)} × ${fmt(r.t)}² = ${fmt(r.S)} m۔`,
    `Jawab: final velocity ${fmt(r.vf)} m/s, distance ${fmt(r.S)} metre۔`,
  ];
  return lines.join("\n");
}

export function renderMotionAnswerRoman(r: MotionResult): string {
  const accLabel = r.freeFall ? `g = ${fmt(r.a)} m/s²` : `a = ${fmt(r.a)} m/s²`;
  const sym = r.freeFall ? "g" : "a";
  const lines = [
    `Step 1 — Given: vi = ${fmt(r.vi)} m/s, ${accLabel}, t = ${fmt(r.t)} s.`,
    `Step 2 — Final Velocity: vf = vi + ${sym}t = ${fmt(r.vi)} + (${fmt(r.a)} × ${fmt(r.t)}) = ${fmt(r.vf)} m/s.`,
    `Step 3 — Distance: S = vi·t + ½${sym}t² = (${fmt(r.vi)} × ${fmt(r.t)}) + ½ × ${fmt(r.a)} × ${fmt(r.t)}² = ${fmt(r.S)} m.`,
    `Jawab: final velocity ${fmt(r.vf)} m/s, distance ${fmt(r.S)} metre.`,
  ];
  return lines.join("\n");
}

/** Doubles the acceleration and asks for vf after the same time (answer as a hint). */
export function motionFollowUp(r: MotionResult): { followUp: string; followUpRoman: string } {
  const newA = r.a * 2;
  const newVf = r.vi + newA * r.t;
  return {
    followUp: `اگر اسراع ${fmt(newA)} m/s² ہوتا تو ${fmt(r.t)} سیکنڈ بعد آخری سمتار کتنی ہوتی؟ (اشارہ: vf = ${fmt(r.vi)} + ${fmt(newA)} × ${fmt(r.t)} = ${fmt(newVf)} m/s)`,
    followUpRoman: `Agar acceleration ${fmt(newA)} m/s² hoti to ${fmt(r.t)} second baad final velocity kitni hoti? (Hint: vf = ${fmt(r.vi)} + ${fmt(newA)} × ${fmt(r.t)} = ${fmt(newVf)} m/s)`,
  };
}
