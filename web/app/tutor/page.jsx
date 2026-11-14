'use client';

import { useEffect, useRef, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ChatBubble from '../../components/ChatBubble';
import CitationBadge from '../../components/CitationBadge';
import { getChapters, tutorChat, FALLBACK_CHAPTERS } from '../../lib/api';

const SUGGESTIONS = {
  'physics-kinematics': [
    'Speed aur velocity mein kya farq hai?',
    'Ek car rest se 2 m/s² ki acceleration se 5 second chalti hai — final velocity aur distance?',
  ],
  'physics-dynamics': [
    "Newton's first law kya hai?",
    'Mass 5 kg ho aur acceleration 2 m/s² ho to force kitni?',
    'Momentum kya hai?',
  ],
  'maths-quadratic': [
    'Discriminant kya hai?',
    'x² − 5x + 6 = 0 hal karo.',
    'Quadratic formula likho.',
  ],
  'english-happy-prince': [
    'The Happy Prince kis ne likha?',
    'Story ka moral / theme kya hai?',
    'Statue kis cheez se bana tha?',
  ],
};

function TutorInner() {
  const searchParams = useSearchParams();
  const initialChapter = searchParams.get('chapter') || 'physics-kinematics';
  const [chapters, setChapters] = useState(FALLBACK_CHAPTERS);
  const [chapter, setChapter] = useState(initialChapter);
  const [lang, setLang] = useState('roman'); // 'roman' | 'urdu'
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const chatRef = useRef(null);

  // Keep the newest answer visible — the chat window is capped at 520px.
  useEffect(() => {
    const el = chatRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, loading]);

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

  async function sendMessage(text) {
    const msg = (text ?? input).trim();
    if (!msg || loading) return;
    setInput('');
    setError('');
    setMessages((prev) => [...prev, { role: 'user', text: msg }]);
    setLoading(true);
    const res = await tutorChat({ chapter, message: msg });
    setLoading(false);
    if (!res || res.error) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: 'Maaf kijiye — API se connect nahi ho saka. Dobara koshish karein.',
          refusal: true,
        },
      ]);
      return;
    }
    setMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: lang === 'urdu' ? (res.answerUr || res.answerRoman || res.answer || '') : (res.answerRoman || res.answer || ''),
        answerUr: res.answerUr,
        answerRoman: res.answerRoman,
        answer: res.answer,
        followUp: res.followUp,
        followUpRoman: res.followUpRoman,
        citations: res.citations || [],
        refusal: !!res.refusal,
      },
    ]);
  }

  function displayText(m) {
    if (m.role === 'user') return m.text;
    if (lang === 'urdu') return m.answerUr || m.answerRoman || m.answer || m.text || '';
    return m.answerRoman || m.answer || m.text || '';
  }

  function displayFollowUp(m) {
    if (lang === 'urdu') return m.followUp || m.followUpRoman || '';
    return m.followUpRoman || m.followUp || '';
  }

  const chips = SUGGESTIONS[chapter] || [];

  return (
    <div className="container">
      <h1>Tutor</h1>
      <p>Apne chapter ka sawal poochho — Urdu, Roman Urdu ya English mein.</p>

      <div className="tabs">
        {chapters.map((ch) => (
          <button
            key={ch.chapterId}
            type="button"
            className={'tab' + (chapter === ch.chapterId ? ' active' : '')}
            onClick={() => setChapter(ch.chapterId)}
          >
            {ch.subject.charAt(0).toUpperCase() + ch.subject.slice(1)} · {ch.chapter}
          </button>
        ))}
      </div>

      <div className="lang-toggle">
        <span>Zaban:</span>
        <button type="button" className={'tab' + (lang === 'roman' ? ' active' : '')} onClick={() => setLang('roman')}>
          Roman Urdu
        </button>
        <button type="button" className={'tab' + (lang === 'urdu' ? ' active' : '')} onClick={() => setLang('urdu')}>
          اردو
        </button>
      </div>

      <div className="chips">
        {chips.map((c) => (
          <button key={c} type="button" className="chip" onClick={() => sendMessage(c)}>
            {c}
          </button>
        ))}
      </div>

      {error ? <div className="error-note">{error}</div> : null}

      <div className="chat-window" ref={chatRef}>
        {messages.length === 0 ? (
          <div className="empty-state">Koi sawal poochho — Urdu, Roman Urdu ya English mein.</div>
        ) : (
          messages.map((m, i) => (
            <div key={i} style={{ display: 'contents' }}>
              {m.role === 'assistant' && m.refusal ? (
                <div className="bubble assistant refusal" dir={lang === 'urdu' ? 'rtl' : 'auto'}>
                  {displayText(m)}
                </div>
              ) : (
                <ChatBubble role={m.role} text={displayText(m)} dir={m.role === 'assistant' && lang === 'urdu' ? 'rtl' : 'auto'} />
              )}
              {m.role === 'assistant' && m.followUp ? (
                <div className="follow-up" dir={lang === 'urdu' ? 'rtl' : 'auto'}>
                  {displayFollowUp(m)}
                </div>
              ) : null}
              {m.role === 'assistant' && Array.isArray(m.citations) && m.citations.length ? (
                <div className="citations">
                  {m.citations.map((c, j) => (
                    <CitationBadge key={j} citation={c} />
                  ))}
                </div>
              ) : null}
            </div>
          ))
        )}
        {loading ? <div className="spinner">Ustaad soch raha hai…</div> : null}
      </div>

      <div className="chat-input-row">
        <input
          type="text"
          placeholder="Sawal likho…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
        />
        <button className="btn" type="button" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}

export default function TutorPage() {
  return (
    <Suspense fallback={<div className="container"><p>Loading…</p></div>}>
      <TutorInner />
    </Suspense>
  );
}
