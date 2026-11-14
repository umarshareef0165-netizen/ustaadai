'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import QuizCard from '../../components/QuizCard';
import ProgressBar from '../../components/ProgressBar';
import { getChapters, startQuiz, submitQuiz, FALLBACK_CHAPTERS } from '../../lib/api';

function QuizInner() {
  const searchParams = useSearchParams();
  const [chapters, setChapters] = useState(FALLBACK_CHAPTERS);
  const [chapter, setChapter] = useState(searchParams.get('chapter') || 'physics-kinematics');
  const [lang, setLang] = useState('roman');
  const [questions, setQuestions] = useState([]);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getChapters().then((res) => {
      if (res && !res.error && Array.isArray(res.chapters) && res.chapters.length) {
        setChapters(res.chapters);
      }
    });
  }, []);

  useEffect(() => {
    const c = searchParams.get('chapter');
    if (c) setChapter(c);
  }, [searchParams]);

  async function handleStart() {
    setLoading(true);
    setError('');
    setResult(null);
    setAnswers({});
    const res = await startQuiz(chapter, 5);
    setLoading(false);
    if (!res || res.error || !Array.isArray(res.questions)) {
      setError('Quiz shuru nahi ho saka — API se connect nahi ho saka. Dobara koshish karein.');
      return;
    }
    setQuestions(res.questions);
  }

  function handleChange(itemId, value) {
    setAnswers((prev) => ({ ...prev, [itemId]: value }));
  }

  async function handleSubmit() {
    const payload = questions.map((q) => ({
      itemId: q.id,
      answer: answers[q.id] !== undefined ? answers[q.id] : '',
    }));
    setLoading(true);
    setError('');
    const res = await submitQuiz(chapter, payload);
    setLoading(false);
    if (!res || res.error) {
      setError('Submit nahi ho saka — API se connect nahi ho saka. Dobara koshish karein.');
      return;
    }
    setResult(res);
  }

  function handleReset() {
    setQuestions([]);
    setAnswers({});
    setResult(null);
    setError('');
  }

  const total = result ? result.total || questions.length : questions.length;
  const correct = result ? result.correct : 0;
  const unanswered = questions.filter((q) => answers[q.id] === undefined || answers[q.id] === '').length;

  return (
    <div className="container">
      <h1>Quiz</h1>
      <p>5 sawal — apni mastery check karo.</p>

      <div className="lang-toggle">
        <span>Zaban:</span>
        <button type="button" className={'tab' + (lang === 'roman' ? ' active' : '')} onClick={() => setLang('roman')}>
          Roman Urdu
        </button>
        <button type="button" className={'tab' + (lang === 'urdu' ? ' active' : '')} onClick={() => setLang('urdu')}>
          اردو
        </button>
      </div>

      {questions.length === 0 && !result ? (
        <div>
          <select className="quiz-select" value={chapter} onChange={(e) => setChapter(e.target.value)}>
            {chapters.map((ch) => (
              <option key={ch.chapterId} value={ch.chapterId}>
                {ch.subject} · Class {ch.class} · {ch.chapter}
              </option>
            ))}
          </select>
          <div style={{ marginTop: 14 }}>
            <button className="btn" type="button" onClick={handleStart} disabled={loading}>
              {loading ? 'Shuru ho raha hai…' : 'Quiz shuru karo'}
            </button>
          </div>
          {error ? <div className="error-note">{error}</div> : null}
        </div>
      ) : null}

      {questions.length > 0 && !result ? (
        <div>
          {questions.map((q, i) => (
            <QuizCard key={q.id} question={q} index={i} value={answers[q.id]} onChange={handleChange} />
          ))}
          {error ? <div className="error-note">{error}</div> : null}
          <button className="btn" type="button" onClick={handleSubmit} disabled={loading}>
            {loading
              ? 'Submit ho raha hai…'
              : unanswered > 0
                ? `Submit karo (${unanswered} sawal baghair jawab)`
                : 'Submit karo'}
          </button>
        </div>
      ) : null}

      {result ? (
        <div className="results">
          <h2>
            Score: {correct} / {total}
          </h2>
          <ProgressBar value={result.mastery} label="Mastery" />
          {Array.isArray(result.marks)
            ? result.marks.map((m, i) => {
                const q = questions.find((qq) => qq.id === m.itemId);
                return (
                  <div key={m.itemId || i} className="quiz-card">
                    <div className={'verdict ' + (m.correct ? 'correct' : 'wrong')}>
                      {m.correct ? '✓ Sahi' : '✗ Ghalat'}
                    </div>
                    {q ? <div>{q.question}</div> : null}
                    <div>Sahi jawab: {m.correctAnswer}</div>
                    <div className="explanation" dir={lang === 'urdu' ? 'rtl' : 'auto'}>
                      {lang === 'urdu' ? (m.explanationUr || m.explanation || '') : (m.explanation || '')}
                    </div>
                    {lang === 'urdu' && m.explanationUr ? null : m.explanationUr ? (
                      <div className="explanation rtl">{m.explanationUr}</div>
                    ) : null}
                    {m.topic ? <div className="meta">Topic: {m.topic}</div> : null}
                  </div>
                );
              })
            : null}
          {Array.isArray(result.revisionPlan) && result.revisionPlan.length ? (
            <div>
              <h3>Revision Plan</h3>
              <ul>
                {result.revisionPlan.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </div>
          ) : null}
          <button className="btn" type="button" onClick={handleReset}>
            Dobara quiz do
          </button>
        </div>
      ) : null}
    </div>
  );
}

export default function QuizPage() {
  return (
    <Suspense fallback={<div className="container"><p>Loading…</p></div>}>
      <QuizInner />
    </Suspense>
  );
}
