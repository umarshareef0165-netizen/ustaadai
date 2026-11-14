import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";

export interface SeedQA {
  id: string;
  q: string;
  a: string;
  aRoman: string;
  followUp: string;
  followUpRoman: string;
}

export interface QuizItem {
  id: string;
  type: "mcq" | "numerical" | "truefalse" | "short";
  question: string;
  options?: string[];
  answer: string;
  answerUnit?: string;
  explanation: string;
  explanationUr: string;
  topic: string;
  backgroundOnly?: boolean;
}

export interface SeedChunk {
  id: string;
  section: string;
  title: string;
  textUr: string;
  textRoman: string;
  textEn: string;
  formulas?: string[];
  keywords: string[];
  qa?: SeedQA[];
  quiz?: QuizItem[];
  // Stamped from the parent seed file by loadSeeds().
  chapterId: string;
  chapter: string;
  book: string;
  subject: string;
  class: number;
}

export interface SeedFile {
  book: string;
  chapter: string;
  chapterId: string;
  subject: "physics" | "maths" | "english";
  class: number;
  chunks: SeedChunk[];
}

export interface ChapterSummary {
  chapterId: string;
  chapter: string;
  book: string;
  subject: string;
  class: number;
  sections: { section: string; chunkId: string }[];
  chunkCount: number;
  quizCount: number;
}

interface RawChunk {
  id?: unknown;
  section?: unknown;
  title?: unknown;
  textUr?: unknown;
  textRoman?: unknown;
  textEn?: unknown;
  formulas?: unknown;
  keywords?: unknown;
  qa?: unknown;
  quiz?: unknown;
}

interface RawSeedFile {
  book?: unknown;
  chapter?: unknown;
  chapterId?: unknown;
  subject?: unknown;
  class?: unknown;
  chunks?: unknown;
}

let cachedFiles: SeedFile[] | null = null;

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

function validateQuizItem(raw: unknown, where: string): QuizItem {
  const q = raw as Record<string, unknown>;
  if (!isNonEmptyString(q.id) || !isNonEmptyString(q.question) || !isNonEmptyString(q.answer)) {
    throw new Error(`Invalid quiz item in ${where}: quiz item needs id/question/answer`);
  }
  return q as unknown as QuizItem;
}

function validateChunk(raw: RawChunk, where: string): Omit<SeedChunk, "chapterId" | "chapter" | "book" | "subject" | "class"> {
  if (
    !isNonEmptyString(raw.id) ||
    !isNonEmptyString(raw.section) ||
    !isNonEmptyString(raw.textUr) ||
    !isNonEmptyString(raw.textRoman)
  ) {
    throw new Error(
      `Invalid chunk in ${where}: chunk needs id/section/textUr/textRoman (got id=${String(raw.id)})`,
    );
  }
  const quizRaw = Array.isArray(raw.quiz) ? raw.quiz : [];
  return {
    id: raw.id,
    section: raw.section,
    title: typeof raw.title === "string" ? raw.title : "",
    textUr: raw.textUr,
    textRoman: raw.textRoman,
    textEn: typeof raw.textEn === "string" ? raw.textEn : "",
    formulas: Array.isArray(raw.formulas) ? (raw.formulas as string[]) : [],
    keywords: Array.isArray(raw.keywords) ? (raw.keywords as string[]) : [],
    qa: Array.isArray(raw.qa) ? (raw.qa as SeedQA[]) : [],
    quiz: quizRaw.map((item) => validateQuizItem(item, where)),
  };
}

export function loadSeeds(): SeedFile[] {
  if (cachedFiles) return cachedFiles;
  const seedDir = fileURLToPath(new URL("../data/seed", import.meta.url));
  const files = readdirSync(seedDir).filter((f) => f.endsWith(".json")).sort();
  const loaded: SeedFile[] = [];
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(seedDir, file), "utf-8")) as RawSeedFile;
    if (
      !isNonEmptyString(raw.book) ||
      !isNonEmptyString(raw.chapter) ||
      !isNonEmptyString(raw.chapterId) ||
      !isNonEmptyString(raw.subject) ||
      typeof raw.class !== "number" ||
      !Array.isArray(raw.chunks)
    ) {
      throw new Error(`Invalid seed file ${file}: needs book/chapter/chapterId/subject/class/chunks`);
    }
    const chunks: SeedChunk[] = raw.chunks.map((c) => {
      const base = validateChunk(c as RawChunk, file);
      return {
        ...base,
        chapterId: raw.chapterId as string,
        chapter: raw.chapter as string,
        book: raw.book as string,
        subject: raw.subject as string,
        class: raw.class as number,
      };
    });
    loaded.push({
      book: raw.book,
      chapter: raw.chapter,
      chapterId: raw.chapterId,
      subject: raw.subject as SeedFile["subject"],
      class: raw.class,
      chunks,
    });
  }
  cachedFiles = loaded;
  return loaded;
}

export function allChunks(): SeedChunk[] {
  return loadSeeds().flatMap((f) => f.chunks);
}

export function allQuizItems(): QuizItem[] {
  return allChunks().flatMap((c) => c.quiz ?? []);
}

export function chapters(): ChapterSummary[] {
  return loadSeeds().map((f) => ({
    chapterId: f.chapterId,
    chapter: f.chapter,
    book: f.book,
    subject: f.subject,
    class: f.class,
    sections: f.chunks.map((c) => ({ section: c.section, chunkId: c.id })),
    chunkCount: f.chunks.length,
    quizCount: f.chunks.reduce((n, c) => n + (c.quiz?.length ?? 0), 0),
  }));
}

export function chunksForChapter(chapterId: string): SeedChunk[] {
  return allChunks().filter((c) => c.chapterId === chapterId);
}

export function quizForChapter(chapterId: string): QuizItem[] {
  return chunksForChapter(chapterId).flatMap((c) => c.quiz ?? []);
}

export function chunkById(id: string): SeedChunk | undefined {
  return allChunks().find((c) => c.id === id);
}
