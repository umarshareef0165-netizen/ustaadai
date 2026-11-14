import './globals.css';

export const metadata = {
  title: 'UstaadAI — Urdu-First AI Tutor',
  description:
    'Apni zaban mein, apne syllabus ka tutor — muft. Urdu-first AI tutor for Pakistan Matric students.',
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header className="site-header">
          <a className="logo" href="/">
            🎓 UstaadAI
          </a>
          <nav>
            <a href="/">Home</a>
            <a href="/tutor">Tutor</a>
            <a href="/quiz">Quiz</a>
            <a href="/dashboard">Dashboard</a>
          </nav>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          HackGlobal 2026 · Built fresh Nov 14, 2026 · Solo — Umar Shareef
        </footer>
      </body>
    </html>
  );
}
