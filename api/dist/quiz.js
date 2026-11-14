import { quizForChapter } from "./content.js";
/** Lowercase, trim, collapse whitespace, normalize Unicode minus, drop light punctuation. */
export function normalizeText(s) {
    return s
        .replace(/−/g, "-")
        .replace(/–/g, "-")
        .toLowerCase()
        .replace(/[.,!?;:()"“”‘’]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}
function firstNumber(s) {
    const m = s.replace(/−/g, "-").replace(/–/g, "-").match(/-?\d+(?:\.\d+)?/);
    return m ? parseFloat(m[0]) : null;
}
const TRUE_WORDS = new Set(["sahi", "true", "sach", "haan", "han", "yes", "t"]);
const FALSE_WORDS = new Set(["ghalat", "false", "jhoot", "nahi", "no", "f"]);
const SHORT_EXCLUDED = new Set(["ke", "ki", "ka", "ko", "se", "mein", "logon"]);
export function markAnswer(item, given) {
    if (!given || !given.trim())
        return false;
    if (item.type === "mcq") {
        const letter = given.trim().toLowerCase().replace(/^[a-d][.)]$/, (m) => m[0]);
        if (/^[a-d]$/.test(letter) && item.options) {
            const idx = letter.charCodeAt(0) - "a".charCodeAt(0);
            const opt = item.options[idx];
            return opt !== undefined && normalizeText(opt) === normalizeText(item.answer);
        }
        return normalizeText(given) === normalizeText(item.answer);
    }
    if (item.type === "numerical") {
        const expected = firstNumber(item.answer);
        const got = firstNumber(given);
        return expected !== null && got !== null && Math.abs(expected - got) <= 0.01;
    }
    if (item.type === "truefalse") {
        const word = normalizeText(given);
        const expectedFalse = normalizeText(item.answer).startsWith("ghalat");
        if (TRUE_WORDS.has(word))
            return !expectedFalse;
        if (FALSE_WORDS.has(word))
            return expectedFalse;
        return false;
    }
    // short: any key content word (length >= 4, excluding ke/ki/ka/ko/se/mein/logon)
    // of the expected answer appears in the given answer.
    const expectedWords = normalizeText(item.answer)
        .split(" ")
        .filter((w) => w.length >= 4 && !SHORT_EXCLUDED.has(w));
    const givenWords = new Set(normalizeText(given).split(" ").filter(Boolean));
    return expectedWords.some((w) => givenWords.has(w));
}
// --- Deterministic seeded shuffle -------------------------------------------
// startQuiz shuffles MCQ options, but the server is stateless: submitQuiz must
// show the same display order so letter answers (a–d) map back correctly.
// Both sides shuffle with the same seed derived from the item id.
function hashSeed(s) {
    let h = 2166136261;
    for (const ch of s) {
        h ^= ch.codePointAt(0) ?? 0;
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function mulberry32(seed) {
    let a = seed;
    return () => {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
export function seededShuffle(arr, seedStr) {
    const out = [...arr];
    const rand = mulberry32(hashSeed(seedStr));
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
function shuffleQuestions(arr) {
    const out = [...arr];
    for (let i = out.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
}
/**
 * Round-robin across topics for variety, questions shuffled, MCQ options
 * shuffled (deterministically per item id). NEVER leaks answers.
 */
export function startQuiz(chapterId, count = 5) {
    const items = quizForChapter(chapterId);
    if (items.length === 0)
        return [];
    const byTopic = new Map();
    for (const item of items) {
        const list = byTopic.get(item.topic) ?? [];
        list.push(item);
        byTopic.set(item.topic, list);
    }
    const topics = [...byTopic.keys()];
    const pointers = new Array(topics.length).fill(0);
    const picked = [];
    while (picked.length < Math.min(count, items.length)) {
        let progressed = false;
        for (let t = 0; t < topics.length && picked.length < Math.min(count, items.length); t++) {
            const list = byTopic.get(topics[t]);
            if (pointers[t] < list.length) {
                picked.push(list[pointers[t]]);
                pointers[t]++;
                progressed = true;
            }
        }
        if (!progressed)
            break;
    }
    return shuffleQuestions(picked).map((item) => {
        const q = {
            id: item.id,
            type: item.type,
            question: item.question,
            topic: item.topic,
        };
        if (item.options)
            q.options = seededShuffle(item.options, item.id);
        return q;
    });
}
export function submitQuiz(chapterId, answers) {
    const items = quizForChapter(chapterId);
    const byId = new Map(items.map((i) => [i.id, i]));
    const marks = answers.map(({ itemId, answer }) => {
        const item = byId.get(itemId);
        if (!item) {
            return {
                itemId,
                correct: false,
                correctAnswer: "",
                explanation: "Ye sawal is chapter ke quiz mein nahi hai.",
                explanationUr: "یہ سوال اس چیپٹر کے کوئز میں نہیں ہے۔",
                topic: "",
            };
        }
        // Re-apply the same display-order shuffle so letter answers map correctly.
        const displayItem = item.options
            ? { ...item, options: seededShuffle(item.options, item.id) }
            : item;
        const correct = markAnswer(displayItem, answer);
        return {
            itemId,
            correct,
            correctAnswer: item.answer,
            explanation: item.explanation,
            explanationUr: item.explanationUr,
            topic: item.topic,
        };
    });
    return {
        marks,
        correct: marks.filter((m) => m.correct).length,
        total: marks.length,
    };
}
