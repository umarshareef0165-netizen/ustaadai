// UstaadAI v2 — headless E2E re-verification (recreated Nov 20, 2026; original runner was ephemeral).
// Chrome 156 via puppeteer-core. 17 checks. Screenshots -> docs/screenshots/.
// Usage: node e2e.cjs
const puppeteer = require('puppeteer-core');
const fs = require('fs');
const path = require('path');

const BASE = 'http://127.0.0.1:3000';
const SHOT_DIR = '/home/hatch/workspace/hackglobal/ustaadai-v2/docs/screenshots';
const SEED_DIR = '/home/hatch/workspace/hackglobal/ustaadai-v2/api/data/seed';
const CHROME = '/home/hatch/.cache/puppeteer/chrome/linux-156.0.8078.47/chrome-linux64/chrome';

const results = [];
let pageErrors = [];
let consoleErrors = [];
let failedRequests = [];

function check(name, ok, detail) {
  results.push({ name, ok: !!ok, detail: detail || '' });
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);
}

const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase();

// Answer map from seed files: normalized question -> answer
const answerMap = new Map();
for (const f of fs.readdirSync(SEED_DIR).filter((x) => x.endsWith('.json'))) {
  const d = JSON.parse(fs.readFileSync(path.join(SEED_DIR, f), 'utf8'));
  for (const c of d.chunks || []) {
    for (const q of c.quiz || []) {
      answerMap.set(norm(q.question), q.answer);
    }
  }
}
console.log(`Answer map: ${answerMap.size} quiz items`);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function askTutor(page, text) {
  const before = await page.$$eval('.bubble.assistant', (els) => els.length);
  await page.type('.chat-input-row input', text, { delay: 5 });
  await page.click('.chat-input-row .btn');
  await page.waitForFunction(
    (n) => document.querySelectorAll('.bubble.assistant').length > n,
    { timeout: 15000 },
    before
  );
  await sleep(300);
  const bubbles = await page.$$eval('.bubble.assistant', (els) =>
    els.map((e) => ({ text: e.innerText, refusal: e.classList.contains('refusal') }))
  );
  return bubbles[bubbles.length - 1];
}

async function clickTabByText(page, sel, fragment) {
  await page.$$eval(sel, (btns, frag) => {
    const b = btns.find((x) => x.innerText.toLowerCase().includes(frag.toLowerCase()));
    if (!b) throw new Error('tab not found: ' + frag);
    b.click();
  }, fragment);
  await sleep(400);
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--window-size=1280,900'],
    defaultViewport: { width: 1280, height: 900 },
  });
  const page = await browser.newPage();
  page.on('pageerror', (e) => pageErrors.push(String(e)));
  page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
  page.on('requestfailed', (r) => failedRequests.push(r.url() + ' :: ' + (r.failure() || {}).errorText));
  page.on('response', (r) => { if (r.status() >= 400) failedRequests.push(r.url() + ' :: HTTP ' + r.status()); });

  // ---- HOME ----
  await page.goto(BASE + '/', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1200);
  const homeText = await page.evaluate(() => document.body.innerText);
  check('1. Home loads with UstaadAI heading', homeText.includes('UstaadAI'));
  const cardCount = await page.$$eval('.chapter-card', (els) => els.length);
  check('2. Home shows 4 chapter cards', cardCount === 4, `${cardCount} cards`);
  check('3. Home mode pill shows Deterministic mode', homeText.includes('Deterministic mode'));
  const hasAllChapters = ['Kinematics', 'Dynamics', 'Quadratic', 'Happy Prince'].every((s) => homeText.includes(s));
  check('4. Home lists all 4 chapters (Kinematics, Dynamics, Quadratic, Happy Prince)', hasAllChapters);
  await page.screenshot({ path: path.join(SHOT_DIR, 'shot-home.png') });

  // ---- TUTOR: physics numerical ----
  await page.goto(BASE + '/tutor?chapter=physics-kinematics', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(800);
  const num = await askTutor(page, 'A car starts from rest with acceleration 2 m/s2. After 5 seconds, what is its final velocity and distance?');
  check('5. Tutor physics numerical: vf=10 m/s and S=25 m', num.text.includes('10 m/s') && num.text.includes('25 m'), num.text.slice(0, 120).replace(/\n/g, ' | '));
  const tutorHtml = await page.evaluate(() => document.body.innerHTML);
  // CitationBadge renders chapter + section, never the raw chunkId:
  // phy-kin-2.6-eom == "Ch 2 — Kinematics · Equations of Motion" (chunkId verified at API level via curl).
  const badgeText = await page.$$eval('.citation-badge', (els) => els.map((e) => e.innerText).join(' | ')).catch(() => '');
  check('6. Tutor numerical shows citation badge for Equations of Motion (phy-kin-2.6-eom)', badgeText.includes('Equations of Motion'), badgeText.slice(0, 120));
  check('7. Tutor numerical shows follow-up mentioning 4 m/s²', num.text.includes('4 m/s') || tutorHtml.includes('4 m/s²'), 'follow-up present in bubble/HTML');
  await page.screenshot({ path: path.join(SHOT_DIR, 'shot-tutor-physics.png') });

  // ---- TUTOR: off-syllabus refusal ----
  const refusal = await askTutor(page, 'Explain the chemical reaction of photosynthesis');
  check('8. Off-syllabus (photosynthesis) refused with 0-citation refusal text', refusal.refusal === true && refusal.text.includes('4 چیپٹرز') || refusal.refusal === true && refusal.text.includes('4 chapters'), refusal.text.slice(0, 100));

  // ---- TUTOR: maths discriminant ----
  await clickTabByText(page, '.tabs .tab', 'Maths');
  const disc = await askTutor(page, '2x^2 + 5x - 3 = 0 ka discriminant kya hai?');
  check('9. Tutor maths discriminant: D=49, x=0.5 / -3', disc.text.includes('49') && (disc.text.includes('0.5') && disc.text.includes('-3') || disc.text.includes('−3')), disc.text.slice(0, 140).replace(/\n/g, ' | '));

  // ---- TUTOR: English author ----
  await clickTabByText(page, '.tabs .tab', 'English');
  const author = await askTutor(page, 'The Happy Prince kis ne likha?');
  check('10. Tutor English author: Oscar Wilde', author.text.includes('Oscar Wilde'), author.text.slice(0, 100));

  // ---- TUTOR: Urdu-script toggle ----
  await clickTabByText(page, '.lang-toggle .tab', 'اردو');
  // 'Physics' alone matches Dynamics first (tab order); acceleration lives in Kinematics.
  await clickTabByText(page, '.tabs .tab', 'Kinematics');
  const urdu = await askTutor(page, 'ایکسلریشن کیا ہے؟');
  check('11. Urdu-script question answered (not refused)', urdu.refusal === false && urdu.text.length > 20, urdu.text.slice(0, 100));
  // back to roman for the rest
  await clickTabByText(page, '.lang-toggle .tab', 'Roman Urdu');

  // ---- QUIZ ----
  await page.goto(BASE + '/quiz?chapter=physics-kinematics', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(800);
  await page.select('.quiz-select', 'physics-kinematics').catch(() => {});
  await page.$$eval('button.btn', (btns) => { const b = btns.find((x) => x.innerText.includes('Quiz shuru karo')); if (b) b.click(); });
  await page.waitForSelector('.quiz-card', { timeout: 15000 });
  await sleep(800);
  const qCards = await page.$$('.quiz-card');
  check('12. Quiz starts with 5 question cards', qCards.length === 5, `${qCards.length} cards`);
  const optCount = await page.$$eval('.option-btn', (els) => els.length);
  console.log(`INFO  quiz option buttons: ${optCount}`);

  // Answer each question from the seed answer map
  const cards = await page.$$('.quiz-card');
  let answered = 0;
  for (const card of cards) {
    const qText = await card.$eval('h3', (el) => el.innerText.replace(/^Q\d+\.\s*/, ''));
    const ans = answerMap.get(norm(qText));
    if (ans === undefined) { console.log('WARN  no seed answer for: ' + qText); continue; }
    const opts = await card.$$('.option-btn');
    if (opts.length) {
      let clicked = false;
      for (const o of opts) {
        const t = await o.evaluate((el) => el.innerText);
        if (norm(t) === norm(ans)) { await o.evaluate((el) => el.click()); clicked = true; break; }
      }
      if (!clicked) console.log('WARN  no matching option for answer "' + ans + '" in: ' + qText);
      else answered++;
    } else {
      const input = await card.$('input');
      if (input) { await input.type(String(ans), { delay: 5 }); answered++; }
    }
  }
  console.log(`INFO  answered ${answered}/5 via seed map`);
  await sleep(500);
  await page.$$eval('button.btn', (btns) => { const b = btns.find((x) => x.innerText.trim().startsWith('Submit karo')); if (b) b.click(); });
  await page.waitForSelector('.results', { timeout: 15000 });
  await sleep(800);
  const quizText = await page.evaluate(() => document.body.innerText);
  const scoreOk = quizText.includes('Score: 5 / 5');
  const masteryOk = /Mastery[\s\S]{0,40}100\s?%/.test(quizText);
  const verdicts = await page.$$eval('.verdict.correct', (els) => els.length);
  check('13. Quiz submit 5/5 via UI', scoreOk && verdicts === 5, `score line: ${scoreOk}, correct verdicts: ${verdicts}/5`);
  check('14. Quiz result shows Mastery 100%', masteryOk, 'Mastery 100% in results');
  await page.screenshot({ path: path.join(SHOT_DIR, 'shot-quiz.png') });

  // ---- DASHBOARD ----
  await page.goto(BASE + '/dashboard', { waitUntil: 'networkidle0', timeout: 30000 });
  await sleep(1200);
  const dashText = await page.evaluate(() => document.body.innerText);
  check('15. Dashboard shows mastery 100%', /Mastery[\s\S]{0,40}100\s?%/.test(dashText), dashText.slice(0, 300).replace(/\n/g, ' | '));
  check('16. Dashboard shows 5 attempts, 5 correct', dashText.includes('Attempts: 5') && dashText.includes('Correct: 5'), (dashText.match(/Attempts:.*/) || ['?'])[0]);
  await page.screenshot({ path: path.join(SHOT_DIR, 'shot-dashboard.png') });

  // ---- ERRORS ----
  check('17. Zero page errors, zero console errors, zero failed requests', pageErrors.length === 0 && consoleErrors.length === 0 && failedRequests.length === 0,
    `pageErrors=${pageErrors.length} consoleErrors=${consoleErrors.length} failedRequests=${failedRequests.length}` +
    (pageErrors.length ? ' | ' + pageErrors.join('; ') : '') +
    (consoleErrors.length ? ' | ' + consoleErrors.join('; ') : '') +
    (failedRequests.length ? ' | ' + failedRequests.join('; ') : ''));

  await browser.close();
  const passed = results.filter((r) => r.ok).length;
  console.log(`\n==== E2E RESULT: ${passed}/${results.length} passed ====`);
  if (passed !== results.length) process.exit(1);
})().catch((e) => { console.error('E2E CRASH:', e); process.exit(2); });
