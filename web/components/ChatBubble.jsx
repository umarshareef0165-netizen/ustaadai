export default function ChatBubble({ role, text, dir }) {
  const cls = role === 'user' ? 'bubble user' : 'bubble assistant';
  return (
    <div className={cls} dir={dir || 'auto'}>
      {text}
    </div>
  );
}
