// ============================================================
// מחולל כריכות ספרים — כריכה אחת לכל ספר מתוך lib/books-data.json.
// צבע לפי תת-קטגוריה, כותרת עברית עטופה, מחבר, מסגרת זהב ועיטור.
// הרצה: node scripts/generate-book-covers.mjs
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/images/books');
mkdirSync(OUT, { recursive: true });

const { books } = JSON.parse(readFileSync(join(ROOT, 'lib/books-data.json'), 'utf8'));

// פלטת עור/בד לפי תת-קטגוריה [כהה, בהיר]
const PALETTES = {
  'תנ"ך וחומשים': ['#7A2130', '#4E1220'],
  'גמרא ומשניות': ['#243357', '#141F3C'],
  הלכה: ['#234E3C', '#123024'],
  'מוסר ומידות': ['#654024', '#3E2712'],
  חסידות: ['#175058', '#0C3238'],
  'מחשבה ואמונה': ['#312C70', '#1A1746'],
  'סידורים ותפילה': ['#293C74', '#152650'],
  'תהילים וברכונים': ['#7A2140', '#4E1228'],
  'הגדות של פסח': ['#4E2160', '#2E103A'],
  'רבנים בני זמננו': ['#3A465E', '#222C40'],
  'ספרונים והקדשות': ['#8A6A2E', '#5E4718'],
};
const KIDS_COLORS = [
  ['#2C7E9E', '#1B4B63'], ['#C0453E', '#7E241F'], ['#E0A32E', '#A8741A'],
  ['#4E8A4E', '#2E5A2E'], ['#8E4B9E', '#5A2E63'], ['#2E6E8A', '#1B4356'],
];

const gold = 'url(#bkGold)';

function wrapTitle(title) {
  const words = title.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > 12 && cur) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, 4);
}

function cover(book, idx) {
  const kids = book.c === 'kids';
  const [c1, c2] = kids ? KIDS_COLORS[idx % KIDS_COLORS.length] : PALETTES[book.s] ?? ['#3A465E', '#222C40'];
  const lines = wrapTitle(book.t);
  const fontSize = lines.length >= 4 ? 26 : lines.length === 3 ? 30 : 34;
  const startY = 200 - ((lines.length - 1) * fontSize) / 2;
  const titleFill = kids ? '#FFFFFF' : gold;

  const titleTspans = lines
    .map((ln, i) => `<tspan x="160" dy="${i === 0 ? 0 : fontSize + 4}">${escapeXml(ln)}</tspan>`)
    .join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 400">
<defs>
  <linearGradient id="bkBg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCFAF4"/><stop offset="1" stop-color="#E7DDC8"/></linearGradient>
  <radialGradient id="bkCloth" cx="0.36" cy="0.24" r="1.05"><stop offset="0" stop-color="${c1}"/><stop offset="0.6" stop-color="${c1}"/><stop offset="1" stop-color="${c2}"/></radialGradient>
  <linearGradient id="bkGold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B58A2C"/><stop offset="0.3" stop-color="#F2DE9E"/><stop offset="0.55" stop-color="#D4AF37"/><stop offset="1" stop-color="#8F6B1B"/></linearGradient>
  <linearGradient id="bkPages" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#C8A245"/><stop offset="0.4" stop-color="#F2DE9E"/><stop offset="1" stop-color="#A87F26"/></linearGradient>
  <filter id="bkSoft" x="-40%" y="-40%" width="180%" height="180%"><feGaussianBlur stdDeviation="6"/></filter>
</defs>
<rect width="320" height="400" fill="url(#bkBg)"/>
<ellipse cx="164" cy="372" rx="120" ry="13" fill="#3A3020" opacity="0.2" filter="url(#bkSoft)"/>
<!-- דפים -->
<rect x="250" y="46" width="20" height="316" rx="3" fill="url(#bkPages)"/>
<g stroke="#8F6B1B" stroke-width="0.6" opacity="0.5"><line x1="255" y1="52" x2="255" y2="356"/><line x1="260" y1="52" x2="260" y2="356"/><line x1="265" y1="52" x2="265" y2="356"/></g>
<!-- כריכה -->
<rect x="46" y="40" width="212" height="324" rx="9" fill="url(#bkCloth)"/>
<rect x="46" y="40" width="14" height="324" rx="7" fill="#00000026"/>
<!-- מסגרת זהב -->
<rect x="66" y="58" width="176" height="288" rx="5" fill="none" stroke="${gold}" stroke-width="2.4"/>
<rect x="72" y="64" width="164" height="276" rx="3" fill="none" stroke="${gold}" stroke-width="0.9" stroke-dasharray="4 3" opacity="0.75"/>
<!-- עיטור עליון -->
<path d="M140 96 L145 80 L152 92 L160 76 L168 92 L175 80 L180 96 Z" fill="${titleFill}"/>
<!-- כותרת -->
<text x="160" y="${startY}" text-anchor="middle" font-family="'Frank Ruhl Libre','Times New Roman',serif" font-size="${fontSize}" font-weight="700" fill="${titleFill}">${titleTspans}</text>
<!-- קו מפריד -->
<path d="M96 300 q64 14 128 0" stroke="${gold}" stroke-width="1.4" fill="none" opacity="0.8"/>
${book.a ? `<text x="160" y="324" text-anchor="middle" font-family="'Frank Ruhl Libre',serif" font-size="15" fill="${kids ? '#FFFFFF' : gold}" opacity="0.9">${escapeXml(book.a)}</text>` : ''}
<!-- ברק עדין -->
<ellipse cx="104" cy="120" rx="40" ry="26" fill="#FFFFFF" opacity="0.06" filter="url(#bkSoft)"/>
</svg>`;
}

function escapeXml(s) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

let n = 0;
books.forEach((b, i) => {
  writeFileSync(join(OUT, `${b.id}.svg`), cover(b, i).trim() + '\n');
  n++;
});
console.log(`✓ Generated ${n} book covers in ${OUT}`);
