'use client';

export default function QuizCard({ question, index, value, onChange }) {
  if (!question) return null;
  const q = question;
  const type = q.type || 'mcq';

  return (
    <div className="quiz-card">
      <h3>
        Q{index + 1}. {q.question}
      </h3>
      {q.topic ? <div className="meta">Topic: {q.topic}</div> : null}

      {type === 'mcq' && Array.isArray(q.options) ? (
        <div className="options">
          {q.options.map((opt, i) => (
            <button
              key={i}
              type="button"
              className={'option-btn' + (value === opt ? ' selected' : '')}
              onClick={() => onChange(q.id, opt)}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : null}

      {type === 'truefalse' ? (
        <div className="options">
          <button
            type="button"
            className={'option-btn' + (value === 'Sahi' ? ' selected' : '')}
            onClick={() => onChange(q.id, 'Sahi')}
          >
            Sahi
          </button>
          <button
            type="button"
            className={'option-btn' + (value === 'Ghalat' ? ' selected' : '')}
            onClick={() => onChange(q.id, 'Ghalat')}
          >
            Ghalat
          </button>
        </div>
      ) : null}

      {(type === 'numerical' || type === 'short') ? (
        <input
          type="text"
          placeholder="Apna jawab likho…"
          value={value || ''}
          onChange={(e) => onChange(q.id, e.target.value)}
        />
      ) : null}
    </div>
  );
}
