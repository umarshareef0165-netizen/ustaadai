export default function ProgressBar({ value, label }) {
  if (value === null || value === undefined) {
    return (
      <div className="progress-wrap">
        {label ? <div className="progress-label"><span>{label}</span></div> : null}
        <div className="progress-null">— (3 attempts ke baad)</div>
      </div>
    );
  }
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="progress-wrap">
      <div className="progress-label">
        <span>{label || 'Mastery'}</span>
        <span>{pct}%</span>
      </div>
      <div className="progress-track">
        <div className="progress-fill" style={{ width: pct + '%' }} />
      </div>
    </div>
  );
}
