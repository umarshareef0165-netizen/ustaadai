import { allChunks, type SeedChunk } from "./content.js";

/** Roman Urdu + English filler words that carry no retrieval signal. */
export const STOPWORDS = new Set([
  "kya", "hai", "hain", "mein", "se", "ka", "ki", "ko", "aur", "ya", "to",
  "the", "a", "an", "is", "are", "of", "in", "on",
  "karo", "batao", "samjhao", "mujhe", "yeh", "ye", "woh",
  "kaisa", "kitni", "kahan", "bhi", "nahi", "par", "ke", "liye",
  "tha", "thi", "ho", "hota", "hoti", "do",
]);

/**
 * Lowercase, unicode-aware split on non-letter/non-digit.
 * Superscript characters ² ³ ½ are kept so tokens like "x²" and "m/s²" survive.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .split(/[^\p{L}\p{N}²³½]+/u)
    .filter((t) => t.length > 0);
}

/** Unique content tokens: tokenized, stopwords removed. */
export function contentTokens(text: string): string[] {
  return [...new Set(tokenize(text).filter((t) => !STOPWORDS.has(t)))];
}

export interface SearchResult {
  chunk: SeedChunk;
  score: number;
  matchedQaId?: string;
  /** Content-token overlap of the matched QA question (0–1); used as a tie-break. */
  qaOverlap?: number;
  qaHit?: number;
}

function tokenSet(text: string): Set<string> {
  return new Set(tokenize(text));
}

/**
 * Score chunks for a query:
 *  - keyword token hit  ×3
 *  - title + section token hit ×2
 *  - textEn + textRoman token hit ×1
 * Seeded-QA bonus: if content-token overlap with a QA question is >= 0.5
 * AND (hit >= 2 OR the QA has <= 2 content tokens), add 25 + hit*2 and
 * record matchedQaId. Returns the topN results with score > 0, best first.
 */
export function retrieve(query: string, chapterId?: string, topN = 3): SearchResult[] {
  const queryTokens = contentTokens(query);
  const querySet = new Set(queryTokens);
  if (queryTokens.length === 0) return [];

  const pool = chapterId ? allChunks().filter((c) => c.chapterId === chapterId) : allChunks();

  const scored: SearchResult[] = [];
  for (const chunk of pool) {
    const keywordTokens = tokenSet((chunk.keywords ?? []).join(" "));
    const titleTokens = tokenSet(`${chunk.title} ${chunk.section}`);
    const textTokens = tokenSet(`${chunk.textEn} ${chunk.textRoman} ${chunk.textUr}`);

    let score = 0;
    for (const qt of queryTokens) {
      if (keywordTokens.has(qt)) score += 3;
      if (titleTokens.has(qt)) score += 2;
      if (textTokens.has(qt)) score += 1;
    }

    let matchedQaId: string | undefined;
    let bestQaHit = 0;
    let bestQaOverlap = 0;
    for (const qa of chunk.qa ?? []) {
      const qaTokens = contentTokens(qa.q);
      if (qaTokens.length === 0) continue;
      const hit = qaTokens.filter((t) => querySet.has(t)).length;
      const overlap = hit / qaTokens.length;
      if (overlap >= 0.5 && (hit >= 2 || qaTokens.length <= 2) && hit > bestQaHit) {
        bestQaHit = hit;
        bestQaOverlap = overlap;
        matchedQaId = qa.id;
      }
    }
    if (matchedQaId !== undefined) {
      score += 25 + bestQaHit * 2;
    }

    if (score > 0) {
      scored.push({ chunk, score, matchedQaId, qaOverlap: bestQaOverlap, qaHit: bestQaHit });
    }
  }

  // Best score first; on a tie prefer the closer seeded-QA match (higher
  // overlap, then higher hit) so e.g. "The Happy Prince kis ne likha?"
  // (E-Q1, overlap 1.0) beats "Prince ne ruby kis ko diya?" (E-Q3, 0.6).
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.qaOverlap ?? 0) - (a.qaOverlap ?? 0) ||
      (b.qaHit ?? 0) - (a.qaHit ?? 0),
  );
  return scored.slice(0, topN);
}
