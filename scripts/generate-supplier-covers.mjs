// ============================================================
// כריכות placeholder ממותגות למוצרי הספק — עד החלפה בצילומי הספק.
// כל כרטיס: שם המוצר, שורת מידה/חומר, אייקון קטגוריה וסימן מים "אמונה וביטחון".
// הרצה: node scripts/generate-supplier-covers.mjs
// ============================================================
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/images/supplier');
mkdirSync(OUT, { recursive: true });

const { items } = JSON.parse(readFileSync(join(ROOT, 'lib/supplier-products.json'), 'utf8'));

// גוון פאנל לפי קטגוריה
const TINT = {
  'home-judaica': '#1E2A52', 'kiddush-cups': '#2A3A6E', candlesticks: '#243357',
  'tzitzit-tallit': '#1F3A5A', kippot: '#3A2A5E', headscarves: '#5A2A4A',
  'gifts-events': '#7A4A1E', 'judaica-jewelry': '#3A3550', 'jewish-art': '#1F4A44',
  'books-siddurim': '#5A1F2C', 'holidays-moadim': '#7A3A1E', kids: '#2C6E8E',
  'brit-newborn': '#2E4B8A', 'jerusalem-gifts': '#6E4A24',
};

function esc(s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

function wrap(title, per = 16, max = 4) {
  const words = title.split(' ');
  const lines = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > per && cur) { lines.push(cur.trim()); cur = w; }
    else cur = (cur + ' ' + w).trim();
  }
  if (cur) lines.push(cur.trim());
  return lines.slice(0, max);
}

function cover(it) {
  const tint = TINT[it.c] ?? '#26356B';
  const lines = wrap(it.t, 17, 4);
  const fs = lines.length >= 4 ? 22 : lines.length === 3 ? 25 : 28;
  const startY = 232 - ((lines.length - 1) * (fs + 4)) / 2;
  const meta = [it.sz && `מידה ${it.sz}`, it.mat, it.col].filter(Boolean).join(' · ');
  const tspans = lines.map((ln, i) => `<tspan x="200" dy="${i === 0 ? 0 : fs + 4}">${esc(ln)}</tspan>`).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
<defs>
  <linearGradient id="sbg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCFAF4"/><stop offset="1" stop-color="#EAE0CB"/></linearGradient>
  <radialGradient id="spanel" cx="0.35" cy="0.25" r="1.1"><stop offset="0" stop-color="${tint}" stop-opacity="0.92"/><stop offset="1" stop-color="${tint}"/></radialGradient>
  <linearGradient id="sgold" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B58A2C"/><stop offset="0.3" stop-color="#F2DE9E"/><stop offset="0.55" stop-color="#D4AF37"/><stop offset="1" stop-color="#8F6B1B"/></linearGradient>
</defs>
<rect width="400" height="500" fill="url(#sbg)"/>
<ellipse cx="200" cy="452" rx="150" ry="16" fill="#3A3020" opacity="0.14"/>
<rect x="40" y="44" width="320" height="380" rx="18" fill="url(#spanel)"/>
<rect x="54" y="58" width="292" height="352" rx="12" fill="none" stroke="url(#sgold)" stroke-width="2"/>
<!-- עיטור כתר -->
<path d="M170 108 L177 88 L186 102 L200 82 L214 102 L223 88 L230 108 Z" fill="url(#sgold)"/>
<!-- שם המוצר -->
<text x="200" y="${startY}" text-anchor="middle" font-family="'Frank Ruhl Libre','Times New Roman',serif" font-size="${fs}" font-weight="700" fill="#FBF7EC">${tspans}</text>
<!-- מידה/חומר -->
${meta ? `<text x="200" y="336" text-anchor="middle" font-family="'Assistant',sans-serif" font-size="15" fill="#F2DE9E" opacity="0.85">${esc(meta)}</text>` : ''}
<path d="M120 360 q80 12 160 0" stroke="url(#sgold)" stroke-width="1.4" fill="none" opacity="0.7"/>
<!-- סימן מותג -->
<text x="200" y="392" text-anchor="middle" font-family="'Frank Ruhl Libre',serif" font-size="17" font-weight="700" fill="url(#sgold)">אמונה וביטחון</text>
</svg>`;
}

let n = 0;
for (const it of items) {
  writeFileSync(join(OUT, `${it.id}.svg`), cover(it).trim() + '\n');
  n++;
}
console.log(`✓ Generated ${n} branded supplier covers in ${OUT}`);
