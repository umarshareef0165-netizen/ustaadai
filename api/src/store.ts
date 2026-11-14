import { DatabaseSync } from "node:sqlite";
import { fileURLToPath } from "node:url";

export interface SessionRow {
  id: string;
  display_name: string | null;
  created_at: string;
}

export interface WeakTopic {
  topic: string;
  correct: number;
  attempted: number;
}

export interface ChapterProgress {
  chapter: string;
  attempts: number;
  correct: number;
  mastery: number | null;
  weakTopics: WeakTopic[];
}

function dbPath(): string {
  if (process.env.USTAADAI_DB) return process.env.USTAADAI_DB;
  return fileURLToPath(new URL("../data.db", import.meta.url));
}

let db: DatabaseSync | null = null;

export function getDb(): DatabaseSync {
  if (db) return db;
  db = new DatabaseSync(dbPath());
  db.exec(`
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY,
      display_name TEXT,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      chapter TEXT NOT NULL,
      quiz_item_id TEXT NOT NULL,
      correct INTEGER NOT NULL,
      topic TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chat_turns (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      chapter TEXT NOT NULL,
      question TEXT NOT NULL,
      chunk_ids TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
  return db;
}

export function ensureSession(id: string, displayName?: string): SessionRow {
  const conn = getDb();
  const now = new Date().toISOString();
  conn.prepare("INSERT OR IGNORE INTO sessions (id, display_name, created_at) VALUES (?, ?, ?)").run(id, displayName ?? null, now);
  if (displayName) {
    conn.prepare("UPDATE sessions SET display_name = ? WHERE id = ?").run(displayName, id);
  }
  const row = conn.prepare("SELECT id, display_name, created_at FROM sessions WHERE id = ?").get(id) as unknown as SessionRow | undefined;
  if (!row) throw new Error(`Session ${id} not found after insert`);
  return row;
}

export function recordAttempts(
  sessionId: string,
  chapter: string,
  marks: Array<{ itemId: string; correct: boolean; topic: string }>,
): void {
  const conn = getDb();
  const now = new Date().toISOString();
  const stmt = conn.prepare(
    "INSERT INTO attempts (session_id, chapter, quiz_item_id, correct, topic, created_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  for (const m of marks) {
    stmt.run(sessionId, chapter, m.itemId, m.correct ? 1 : 0, m.topic, now);
  }
}

export function recordChatTurn(
  sessionId: string,
  chapter: string,
  question: string,
  chunkIds: string[],
): void {
  const conn = getDb();
  conn.prepare(
    "INSERT INTO chat_turns (session_id, chapter, question, chunk_ids, created_at) VALUES (?, ?, ?, ?, ?)",
  ).run(sessionId, chapter, question, JSON.stringify(chunkIds), new Date().toISOString());
}

export function progressForSession(sessionId: string): ChapterProgress[] {
  const conn = getDb();
  const rows = conn.prepare(
    "SELECT chapter, quiz_item_id, correct, topic FROM attempts WHERE session_id = ? ORDER BY id ASC",
  ).all(sessionId) as Array<{ chapter: string; quiz_item_id: string; correct: number; topic: string }>;

  const byChapter = new Map<string, typeof rows>();
  for (const row of rows) {
    const list = byChapter.get(row.chapter) ?? [];
    list.push(row);
    byChapter.set(row.chapter, list);
  }

  const out: ChapterProgress[] = [];
  for (const [chapter, list] of byChapter) {
    const attempts = list.length;
    const correct = list.filter((r) => r.correct === 1).length;
    // Mastery: percentage (0-100) over the LAST 10 attempts; null if < 3 attempts.
    let mastery: number | null = null;
    if (attempts >= 3) {
      const last10 = list.slice(-10);
      mastery = Math.round((last10.filter((r) => r.correct === 1).length / last10.length) * 100);
    }
    // Weak topics: attempted >= 2 and ratio < 0.6 (over all attempts in the chapter).
    const byTopic = new Map<string, { correct: number; attempted: number }>();
    for (const r of list) {
      const t = byTopic.get(r.topic) ?? { correct: 0, attempted: 0 };
      t.attempted++;
      if (r.correct === 1) t.correct++;
      byTopic.set(r.topic, t);
    }
    const weakTopics: WeakTopic[] = [];
    for (const [topic, t] of byTopic) {
      if (t.attempted >= 2 && t.correct / t.attempted < 0.6) {
        weakTopics.push({ topic, correct: t.correct, attempted: t.attempted });
      }
    }
    out.push({ chapter, attempts, correct, mastery, weakTopics });
  }
  return out;
}

export function sessionCount(): number {
  const conn = getDb();
  const row = conn.prepare("SELECT COUNT(*) AS n FROM sessions").get() as { n: number };
  return row.n;
}
