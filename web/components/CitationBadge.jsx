export default function CitationBadge({ citation }) {
  if (!citation) return null;
  const chapter = citation.chapter || citation.chapterId || '';
  const section = citation.section || citation.chunkId || '';
  return (
    <span className="citation-badge">
      📖 {chapter}
      {section ? ` · ${section}` : ''}
    </span>
  );
}
