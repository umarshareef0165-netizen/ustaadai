'use client';

import { useEffect, useState } from 'react';
import ProgressBar from '../../components/ProgressBar';
import { getProgress, getSessionId } from '../../lib/api';

const CHAPTER_NAMES = {
  'physics-kinematics': 'Physics 9 · Ch 2 — Kinematics',
  'physics-dynamics': 'Physics 9 · Ch 3 — Dynamics',
  'maths-quadratic': 'Maths 10 · Ch 2 — Quadratic Equations and Inequalities',
  'english-happy-prince': 'English 10 · Unit 5 — The Happy Prince',
};

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [apiDown, setApiDown] = useState(false);

  useEffect(() => {
    const sessionId = getSessionId();
    getProgress(sessionId).then((res) => {
      setLoading(false);
      if (!res || res.error) {
        setApiDown(true);
        return;
      }
      setData(res);
    });
  }, []);

  const chapters = data && Array.isArray(data.chapters) ? data.chapters : [];

  return (
    <div className="container">
      <h1>Dashboard</h1>
      <p>Apni quiz progress aur mastery dekho.</p>

      {loading ? <p>Loading…</p> : null}

      {!loading && apiDown ? (
        <div className="error-note">
          Progress load nahi ho saka — API se connect nahi ho saka. Dobara koshish karein,
          ya pehle quiz dein.
        </div>
      ) : null}

      {!loading && !apiDown && chapters.length === 0 ? (
        <div className="empty-state">Abhi koi quiz attempt nahi — pehle quiz do!</div>
      ) : null}

      {!loading && !apiDown
        ? chapters.map((ch) => (
            <div key={ch.chapter} className="dashboard-card">
              <h3>{CHAPTER_NAMES[ch.chapter] || ch.chapter}</h3>
              <ProgressBar
                value={ch.attempts >= 3 ? ch.mastery : null}
                label="Mastery"
              />
              <p>
                Attempts: {ch.attempts || 0} · Correct: {ch.correct || 0}
              </p>
              {Array.isArray(ch.weakTopics) && ch.weakTopics.length ? (
                <div>
                  <strong>Kamzor topics:</strong>
                  <ul className="weak-list">
                    {ch.weakTopics.map((w, i) => (
                      <li key={i}>
                        Revise: {w.topic} — {w.correct}/{w.attempted} correct
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </div>
          ))
        : null}
    </div>
  );
}
