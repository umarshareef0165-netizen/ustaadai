'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { getHealth, getChapters, FALLBACK_CHAPTERS } from '../lib/api';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState(null);
  const [apiDown, setApiDown] = useState(false);
  const [chapters, setChapters] = useState(FALLBACK_CHAPTERS);

  useEffect(() => {
    let alive = true;
    getHealth().then((h) => {
      if (!alive) return;
      if (h && !h.error) {
        setMode(h.mode || 'deterministic');
        setApiDown(false);
      } else {
        setApiDown(true);
      }
    });
    getChapters().then((res) => {
      if (!alive) return;
      if (res && !res.error && Array.isArray(res.chapters) && res.chapters.length) {
        setChapters(res.chapters);
      }
    });
    return () => { alive = false; };
  }, []);

  return (
    <div className="container">
      <section className="hero">
        <h1>UstaadAI</h1>
        <p className="tagline">Apni zaban mein, apne syllabus ka tutor — muft.</p>
        <p>
          Pakistan ki classes mein 40+ students hote hain, private tuition har kisi ki
          pohnch mein nahi, aur maujooda apps aksar English mein hain. UstaadAI Matric
          students ko unke apne syllabus se, Urdu aur Roman Urdu mein, muft padhata hai.
        </p>
        {apiDown ? (
          <span className="mode-pill down">API abhi down hai — chapters phir bhi dekh sakte hain</span>
        ) : mode ? (
          <span className="mode-pill">
            {mode === 'gemini' ? 'Gemini mode' : 'Deterministic mode'}
          </span>
        ) : (
          <span className="mode-pill down">Mode check ho raha hai…</span>
        )}
      </section>

      {apiDown ? (
        <div className="error-note">
          Tutor API se connect nahi ho saka. Chapters neeche dikhaye gaye hain — Tutor ya Quiz
          kholne par dobara koshish hogi.
        </div>
      ) : null}

      <div className="chapter-grid">
        {chapters.map((ch) => (
          <div key={ch.chapterId} className="chapter-card">
            <h3>
              {ch.subject.charAt(0).toUpperCase() + ch.subject.slice(1)} · Class {ch.class}
            </h3>
            <div className="meta">{ch.chapter}</div>
            <div className="meta">
              {ch.book ? ch.book + ' · ' : ''}
              {Array.isArray(ch.sections) ? ch.sections.length : 0} sections ·{' '}
              {ch.quizCount || 0} quiz questions
            </div>
            <div className="actions">
              <button className="btn" onClick={() => router.push('/tutor?chapter=' + ch.chapterId)}>
                Tutor kholo
              </button>
              <button className="btn secondary" onClick={() => router.push('/quiz?chapter=' + ch.chapterId)}>
                Quiz do
              </button>
            </div>
          </div>
        ))}
      </div>

      <section className="how-it-works">
        <h2>How it works</h2>
        <ol>
          <li>Chapter chuno — 4 chapters mein se koi aik.</li>
          <li>Urdu mein sawal poochho — Roman Urdu ya Urdu script, jo aasan lage.</li>
          <li>Quiz do aur mastery dekho — kamzor topics ki revision plan milegi.</li>
        </ol>
      </section>

      <p className="scope-note">
        4 chapters seeded — Physics 9 Kinematics, Physics 9 Dynamics, Maths 10 Quadratic
        Equations, English 10 The Happy Prince.
      </p>
    </div>
  );
}
