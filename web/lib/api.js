// UstaadAI API helpers — never throw; return { error } on failure.
export function apiBase() {
  return (
    (typeof process !== 'undefined' &&
      process.env &&
      process.env.NEXT_PUBLIC_API_URL) ||
    'http://127.0.0.1:3001'
  );
}

export function getSessionId() {
  try {
    if (typeof window === 'undefined') return 'server-session';
    let id = window.localStorage.getItem('ustaadai-session');
    if (!id) {
      id =
        (window.crypto && window.crypto.randomUUID
          ? window.crypto.randomUUID()
          : 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2)) ;
      window.localStorage.setItem('ustaadai-session', id);
    }
    return id;
  } catch (e) {
    return 'sess-' + Date.now();
  }
}

async function getJson(path) {
  try {
    const res = await fetch(apiBase() + path, { cache: 'no-store' });
    if (!res.ok) return { error: 'API error ' + res.status };
    return await res.json();
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
}

async function postJson(path, body) {
  try {
    const res = await fetch(apiBase() + path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return { error: 'API error ' + res.status };
    return await res.json();
  } catch (e) {
    return { error: String((e && e.message) || e) };
  }
}

export async function getHealth() {
  return getJson('/health');
}

export async function getChapters() {
  return getJson('/api/chapters');
}

export async function tutorChat({ chapter, message }) {
  const sessionId = getSessionId();
  return postJson('/api/tutor/chat', { sessionId, chapter, message });
}

export async function startQuiz(chapter, count) {
  const sessionId = getSessionId();
  return postJson('/api/quiz/start', { sessionId, chapter, count: count || 5 });
}

export async function submitQuiz(chapter, answers) {
  const sessionId = getSessionId();
  return postJson('/api/quiz/submit', { sessionId, chapter, answers });
}

export async function getProgress(sessionId) {
  const id = sessionId || getSessionId();
  return getJson('/api/progress/' + encodeURIComponent(id));
}

// Fallback chapter list used when the API is down.
export const FALLBACK_CHAPTERS = [
  {
    chapterId: 'physics-kinematics',
    subject: 'Physics',
    class: '9',
    chapter: 'Ch 2 — Kinematics',
    book: 'Physics 9',
    sections: [],
    chunkCount: 0,
    quizCount: 0,
  },
  {
    chapterId: 'physics-dynamics',
    subject: 'Physics',
    class: '9',
    chapter: 'Ch 3 — Dynamics',
    book: 'Physics 9',
    sections: [],
    chunkCount: 0,
    quizCount: 0,
  },
  {
    chapterId: 'maths-quadratic',
    subject: 'Maths',
    class: '10',
    chapter: 'Ch 2 — Quadratic Equations and Inequalities',
    book: 'Maths 10',
    sections: [],
    chunkCount: 0,
    quizCount: 0,
  },
  {
    chapterId: 'english-happy-prince',
    subject: 'English',
    class: '10',
    chapter: 'Unit 5 — The Happy Prince',
    book: 'English 10',
    sections: [],
    chunkCount: 0,
    quizCount: 0,
  },
];
