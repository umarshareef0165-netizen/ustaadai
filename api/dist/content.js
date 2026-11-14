import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
let cachedFiles = null;
function isNonEmptyString(v) {
    return typeof v === "string" && v.trim().length > 0;
}
function validateQuizItem(raw, where) {
    const q = raw;
    if (!isNonEmptyString(q.id) || !isNonEmptyString(q.question) || !isNonEmptyString(q.answer)) {
        throw new Error(`Invalid quiz item in ${where}: quiz item needs id/question/answer`);
    }
    return q;
}
function validateChunk(raw, where) {
    if (!isNonEmptyString(raw.id) ||
        !isNonEmptyString(raw.section) ||
        !isNonEmptyString(raw.textUr) ||
        !isNonEmptyString(raw.textRoman)) {
        throw new Error(`Invalid chunk in ${where}: chunk needs id/section/textUr/textRoman (got id=${String(raw.id)})`);
    }
    const quizRaw = Array.isArray(raw.quiz) ? raw.quiz : [];
    return {
        id: raw.id,
        section: raw.section,
        title: typeof raw.title === "string" ? raw.title : "",
        textUr: raw.textUr,
        textRoman: raw.textRoman,
        textEn: typeof raw.textEn === "string" ? raw.textEn : "",
        formulas: Array.isArray(raw.formulas) ? raw.formulas : [],
        keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
        qa: Array.isArray(raw.qa) ? raw.qa : [],
        quiz: quizRaw.map((item) => validateQuizItem(item, where)),
    };
}
export function loadSeeds() {
    if (cachedFiles)
        return cachedFiles;
    const seedDir = fileURLToPath(new URL("../data/seed", import.meta.url));
    const files = readdirSync(seedDir).filter((f) => f.endsWith(".json")).sort();
    const loaded = [];
    for (const file of files) {
        const raw = JSON.parse(readFileSync(join(seedDir, file), "utf-8"));
        if (!isNonEmptyString(raw.book) ||
            !isNonEmptyString(raw.chapter) ||
            !isNonEmptyString(raw.chapterId) ||
            !isNonEmptyString(raw.subject) ||
            typeof raw.class !== "number" ||
            !Array.isArray(raw.chunks)) {
            throw new Error(`Invalid seed file ${file}: needs book/chapter/chapterId/subject/class/chunks`);
        }
        const chunks = raw.chunks.map((c) => {
            const base = validateChunk(c, file);
            return {
                ...base,
                chapterId: raw.chapterId,
                chapter: raw.chapter,
                book: raw.book,
                subject: raw.subject,
                class: raw.class,
            };
        });
        loaded.push({
            book: raw.book,
            chapter: raw.chapter,
            chapterId: raw.chapterId,
            subject: raw.subject,
            class: raw.class,
            chunks,
        });
    }
    cachedFiles = loaded;
    return loaded;
}
export function allChunks() {
    return loadSeeds().flatMap((f) => f.chunks);
}
export function allQuizItems() {
    return allChunks().flatMap((c) => c.quiz ?? []);
}
export function chapters() {
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
export function chunksForChapter(chapterId) {
    return allChunks().filter((c) => c.chapterId === chapterId);
}
export function quizForChapter(chapterId) {
    return chunksForChapter(chapterId).flatMap((c) => c.quiz ?? []);
}
export function chunkById(id) {
    return allChunks().find((c) => c.id === id);
}
