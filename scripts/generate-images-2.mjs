// ============================================================
// מחולל תמונות — אצווה 2: ספרים, חגים, ילדים, בית כנסת, ועוד.
// אותה שפה ויזואלית (סטודיו, שמנת→זהב, viewBox 400×500).
// הרצה: node scripts/generate-images-2.mjs
// ============================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/images/products');
mkdirSync(OUT, { recursive: true });

const DEFS = `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FCFAF4"/><stop offset="0.72" stop-color="#F3EDE0"/><stop offset="1" stop-color="#E2D8C3"/></linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.42" r="0.8"><stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#4A3A1E" stop-opacity="0.1"/></radialGradient>
  <linearGradient id="sv" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8E9CAC"/><stop offset="0.18" stop-color="#F2F6FA"/><stop offset="0.36" stop-color="#FFFFFF"/><stop offset="0.6" stop-color="#B4BFCC"/><stop offset="0.84" stop-color="#6E7D8E"/><stop offset="1" stop-color="#9FABB9"/></linearGradient>
  <linearGradient id="gd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B58A2C"/><stop offset="0.3" stop-color="#F2DE9E"/><stop offset="0.55" stop-color="#D4AF37"/><stop offset="1" stop-color="#8F6B1B"/></linearGradient>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>`;

const svg = (inner, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs>${DEFS}${extra}</defs><rect width="400" height="500" fill="url(#bg)"/><rect width="400" height="500" fill="url(#vig)"/>${inner}</svg>`;
const shadow = (cy = 430, rx = 130) => `<ellipse cx="200" cy="${cy}" rx="${rx}" ry="15" fill="#3A3020" opacity="0.22" filter="url(#soft)"/>`;
const grad = (id, stops, x2 = '1', y2 = '0') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const rgrad = (id, stops, cx = '0.38', cy = '0.28', r = '0.95') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
const heText = (x, y, size, fill, t, w = 700) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Frank Ruhl Libre','Times New Roman',serif" font-size="${size}" font-weight="${w}" fill="${fill}">${t}</text>`;

// ---------- ספרים ----------
function book({ cover, spine = 'gd', title = '', pages = '#F2DE9E', clasp = false, w = 200, h = 280 }) {
  const extra = rgrad('bk', [['0', cover[0]], ['0.55', cover[1]], ['1', cover[2]]]);
  const x = 200 - w / 2, y = 250 - h / 2;
  return svg(
    `${shadow(250 + h / 2 + 6, w * 0.62)}
     <rect x="${x + w - 4}" y="${y + 8}" width="20" height="${h - 16}" rx="3" fill="${pages}"/>
     <g stroke="#8F6B1B" stroke-width="0.7" opacity="0.5">${[6, 11, 16].map((o) => `<line x1="${x + w - 4 + o}" y1="${y + 12}" x2="${x + w - 4 + o}" y2="${y + h - 12}"/>`).join('')}</g>
     <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="10" fill="url(#bk)"/>
     <rect x="${x + 10}" y="${y + 12}" width="${w - 20}" height="${h - 24}" rx="6" fill="none" stroke="url(#${spine})" stroke-width="2.4"/>
     ${title ? heText(200 - 8, y + h / 2 + 8, 30, `url(#${spine})`, title) : ''}
     <g stroke="url(#${spine})" stroke-width="1.6" fill="none" opacity="0.8"><path d="${'M' + (x + 24) + ' ' + (y + 40) + ' q' + (w / 2 - 20) + ' -18 ' + (w - 44) + ' 0'}"/></g>
     ${clasp ? `<rect x="${x - 8}" y="${250 - 14}" width="18" height="28" rx="5" fill="url(#gd)"/>` : ''}
     <ellipse cx="${x + 40}" cy="${y + 60}" rx="34" ry="18" fill="#FFFFFF" opacity="0.08" filter="url(#soft)"/>`,
    extra
  );
}

function tehillimSilver() {
  return svg(
    `${shadow(430, 120)}
     <path d="M150 384 L250 384 L262 404 L138 404 Z" fill="url(#sv)"/>
     <ellipse cx="200" cy="406" rx="72" ry="12" fill="url(#sv)"/>
     <g transform="rotate(-3 200 240)">
       <rect x="118" y="120" width="164" height="230" rx="10" fill="url(#sv)"/>
       <rect x="132" y="134" width="136" height="202" rx="6" fill="none" stroke="url(#gd)" stroke-width="2.6"/>
       ${heText(200, 250, 40, 'url(#gd)', 'תהילים')}
       <path d="M150 168 q50 -20 100 0" stroke="url(#gd)" stroke-width="2" fill="none"/>
       <g stroke="url(#gd)" stroke-width="1.6" fill="none"><path d="M140 300 q60 16 120 0"/></g>
       <path d="M130 140 L130 330" stroke="#FFFFFF" stroke-width="4" opacity="0.5" stroke-linecap="round"/>
     </g>`
  );
}

// ---------- חגים ----------
function dreidelSilver() {
  return svg(
    `${shadow(378, 70)}
     <path d="M148 200 L252 200 L200 330 Z" fill="url(#sv)"/>
     <path d="M192 322 L208 322 L200 352 Z" fill="#9FABB9"/>
     <path d="M148 200 L252 200 L252 220 L148 220 Z" fill="#E3EAF1"/>
     <rect x="190" y="150" width="20" height="54" rx="6" fill="url(#sv)"/>
     <ellipse cx="200" cy="150" rx="14" ry="6" fill="#E8EDF3"/>
     ${heText(200, 262, 46, '#5F6E80', 'נ')}
     <path d="M162 206 L182 288" stroke="#FFFFFF" stroke-width="4" opacity="0.5" stroke-linecap="round"/>`
  );
}
function dreidelsWood() {
  const extra = rgrad('wd', [['0', '#C89A55'], ['0.6', '#9A6A32'], ['1', '#5F3D1C']]);
  const d = (x, y, s, c) => `<g transform="translate(${x} ${y}) scale(${s})"><path d="M0 78 L-8 96 L8 96 Z" fill="${c}"/><path d="M-40 -10 L40 -10 L0 74 Z" fill="${c}"/><path d="M-40 -10 L40 -10 L40 6 L-40 6 Z" fill="#00000022"/><rect x="-8" y="-46" width="16" height="40" rx="5" fill="${c}"/>${heText(0, 48, 32, '#FBF3DD', ['נ', 'ג', 'ה'][Math.floor(Math.random() * 3)])}</g>`;
  return svg(`${shadow(430, 150)}${d(140, 250, 0.8, 'url(#wd)')}${d(255, 210, 0.62, '#A9743C')}${d(250, 320, 0.7, 'url(#wd)')}`, extra);
}
function etrogBox() {
  return svg(
    `${shadow(428, 130)}
     <ellipse cx="200" cy="392" rx="118" ry="20" fill="url(#sv)"/>
     <rect x="110" y="250" width="180" height="132" rx="16" fill="url(#sv)"/>
     <rect x="110" y="250" width="180" height="24" rx="10" fill="#E3EAF1"/>
     <path d="M102 250 C102 214 150 196 200 196 C250 196 298 214 298 250 Z" fill="url(#sv)"/>
     <path d="M102 250 C102 218 150 202 200 202 C250 202 298 218 298 250" fill="none" stroke="url(#gd)" stroke-width="3"/>
     <g stroke="url(#gd)" stroke-width="2" fill="none" opacity="0.85"><path d="M130 300 q70 -18 140 0"/><path d="M130 340 q70 18 140 0"/></g>
     ${heText(200, 332, 26, 'url(#gd)', 'אתרוג')}
     <circle cx="200" cy="188" r="9" fill="url(#gd)"/>
     <ellipse cx="150" cy="290" rx="20" ry="40" fill="#FFFFFF" opacity="0.1" filter="url(#soft)"/>`
  );
}
function arbaMinim() {
  return svg(
    `${shadow(432, 120)}
     <path d="M180 120 C176 220 176 340 182 420 L196 420 C192 340 190 220 190 120 Z" fill="#6E8B3D"/>
     <path d="M186 120 C184 160 182 200 180 240" stroke="#4E6A28" stroke-width="2" fill="none"/>
     <g stroke="#3E5A20" stroke-width="6" stroke-linecap="round">
       <path d="M186 140 l-16 -8"/><path d="M186 170 l16 -6"/><path d="M186 210 l-16 -8"/><path d="M186 250 l16 -6"/><path d="M186 290 l-16 -8"/>
     </g>
     <g transform="rotate(-10 240 300)">
       <path d="M232 150 C226 250 228 360 236 430 L250 430 C244 360 246 250 244 150 Z" fill="#7FA24B"/>
       <path d="M238 150 C236 250 238 360 243 430" stroke="#5E7C32" stroke-width="1.6" fill="none"/>
     </g>
     <g transform="rotate(10 158 300)"><path d="M150 160 C144 250 146 360 154 424 L168 424 C162 360 164 250 162 160 Z" fill="#6E8B3D"/></g>
     <ellipse cx="270" cy="360" rx="30" ry="46" fill="#E8D24A" transform="rotate(12 270 360)"/>
     <ellipse cx="270" cy="360" rx="30" ry="46" fill="none" stroke="#B79A28" stroke-width="1.5" transform="rotate(12 270 360)"/>
     <path d="M270 316 C273 306 280 302 286 300" stroke="#8A6E1E" stroke-width="4" fill="none" stroke-linecap="round"/>`
  );
}
function roshPlate() {
  const seg = (a0, a1, r, fill) => {
    const p = (a, rr) => `${200 + rr * Math.cos((a * Math.PI) / 180)} ${300 + rr * 0.55 * Math.sin((a * Math.PI) / 180)}`;
    return `<path d="M${p(a0, r)} A${r} ${r * 0.55} 0 0 1 ${p(a1, r)} L${p(a1, 36)} A36 20 0 0 0 ${p(a0, 36)} Z" fill="${fill}" stroke="url(#sv)" stroke-width="1.5"/>`;
  };
  return svg(
    `${shadow(392, 155)}
     <ellipse cx="200" cy="304" rx="152" ry="86" fill="url(#sv)"/>
     <ellipse cx="200" cy="300" rx="140" ry="78" fill="#E8EDF3"/>
     ${seg(0, 60, 132, '#E8A93C')}${seg(60, 120, 132, '#B7C98A')}${seg(120, 180, 132, '#D96B4A')}${seg(180, 240, 132, '#E0D2A0')}${seg(240, 300, 132, '#8A9B5A')}${seg(300, 360, 132, '#C46A6A')}
     <circle cx="200" cy="300" r="34" fill="url(#gd)"/>
     ${heText(200, 310, 20, '#5A430E', 'שנה טובה')}`
  );
}
function mishloachTray() {
  const extra = grad('bsk', [['0', '#C89A55'], ['1', '#7A4E24']], '0', '1');
  return svg(
    `${shadow(430, 140)}
     <ellipse cx="200" cy="388" rx="120" ry="24" fill="url(#bsk)"/>
     <path d="M96 300 L304 300 L288 388 L112 388 Z" fill="url(#bsk)"/>
     <g stroke="#5F3D1C" stroke-width="1.4" opacity="0.5">${[320, 344, 368].map((y) => `<path d="M108 ${y} h184"/>`).join('')}</g>
     <path d="M110 300 C130 220 270 220 290 300" fill="none" stroke="url(#gd)" stroke-width="9"/>
     <circle cx="160" cy="290" r="26" fill="#C0392B"/><circle cx="240" cy="290" r="24" fill="#E8A93C"/>
     <path d="M198 286 l7 -20 7 20 z" fill="#8A5A2E"/>
     <rect x="150" y="250" width="40" height="34" rx="4" fill="#F0D9A0"/>
     <path d="M182 262 q18 -14 36 0" stroke="url(#gd)" stroke-width="4" fill="none"/>`,
    extra
  );
}
function purimCrown() {
  return svg(
    `${shadow(400, 120)}
     <path d="M110 340 L120 210 L160 280 L200 190 L240 280 L280 210 L290 340 Z" fill="url(#gd)"/>
     <path d="M110 340 L290 340 L290 366 L110 366 Z" fill="url(#gd)"/>
     <g fill="#C0392B"><circle cx="120" cy="214" r="8"/><circle cx="200" cy="196" r="10"/><circle cx="280" cy="214" r="8"/></g>
     <g fill="#2C6E8E"><circle cx="160" cy="284" r="7"/><circle cx="240" cy="284" r="7"/></g>
     <g fill="#FBF3DD" opacity="0.85"><circle cx="150" cy="350" r="4"/><circle cx="200" cy="352" r="4"/><circle cx="250" cy="350" r="4"/></g>`
  );
}
function megillah() {
  const extra = grad('kl', [['0', '#FBF3DD'], ['1', '#E4D5AE']], '0', '1');
  return svg(
    `${shadow(430, 130)}
     <ellipse cx="200" cy="398" rx="118" ry="18" fill="url(#sv)"/>
     <rect x="118" y="250" width="164" height="140" rx="12" fill="url(#sv)"/>
     <rect x="130" y="264" width="140" height="112" rx="7" fill="none" stroke="url(#gd)" stroke-width="2"/>
     ${heText(200, 338, 26, 'url(#gd)', 'מגילה')}
     <g transform="translate(200 180)">
       <rect x="-60" y="-20" width="120" height="40" rx="19" fill="url(#kl)"/>
       <g stroke="#B9A67E" stroke-width="1.4" opacity="0.8"><path d="M-50 -8 h100"/><path d="M-50 0 h88"/><path d="M-50 8 h96"/></g>
       <ellipse cx="-60" cy="0" rx="9" ry="20" fill="#D9C79A"/><ellipse cx="60" cy="0" rx="9" ry="20" fill="#D9C79A"/>
       <rect x="-64" y="-30" width="8" height="60" rx="4" fill="url(#gd)"/><rect x="56" y="-30" width="8" height="60" rx="4" fill="url(#gd)"/>
     </g>`,
    extra
  );
}

// ---------- ילדים ----------
function kidsBook({ cover, title }) {
  const extra = rgrad('kb', [['0', cover[0]], ['0.6', cover[1]], ['1', cover[2]]]);
  return svg(
    `${shadow(408, 120)}
     <rect x="112" y="120" width="176" height="248" rx="14" fill="url(#kb)"/>
     <rect x="124" y="132" width="152" height="224" rx="9" fill="#FFFFFF" opacity="0.16"/>
     <circle cx="200" cy="210" r="46" fill="#FFFFFF" opacity="0.9"/>
     ${heText(200, 226, 52, cover[1], 'א', 700)}
     ${heText(200, 318, 26, '#FFFFFF', title)}
     <g fill="#FFE9A8"><path d="M150 168 l4 10 10 1 -8 7 3 11 -9 -6 -9 6 3 -11 -8 -7 10 -1 Z"/><path d="M252 168 l4 10 10 1 -8 7 3 11 -9 -6 -9 6 3 -11 -8 -7 10 -1 Z"/></g>`,
    extra
  );
}
function netlaKids() {
  const extra = grad('nk', [['0', '#7FCBE0'], ['0.5', '#4FA9C9'], ['1', '#2C7E9E']], '1', '1');
  return svg(
    `${shadow(430, 120)}
     <path d="M150 236 C100 236 100 320 150 320" stroke="url(#nk)" stroke-width="18" fill="none" stroke-linecap="round"/>
     <path d="M250 236 C300 236 300 320 250 320" stroke="url(#nk)" stroke-width="18" fill="none" stroke-linecap="round"/>
     <path d="M146 190 L146 372 Q146 396 200 396 Q254 396 254 372 L254 190 Z" fill="url(#nk)"/>
     <ellipse cx="200" cy="190" rx="56" ry="13" fill="#3E97B8"/>
     <g fill="#FFFFFF" opacity="0.85"><circle cx="180" cy="250" r="10"/><circle cx="222" cy="270" r="8"/><circle cx="192" cy="300" r="7"/><circle cx="228" cy="320" r="6"/></g>
     <path d="M160 220 L160 360" stroke="#FFFFFF" stroke-width="6" opacity="0.4" stroke-linecap="round"/>`,
    extra
  );
}
function shabbatKids() {
  return svg(
    `${shadow(428, 145)}
     <rect x="96" y="250" width="208" height="150" rx="14" fill="#2E4B8A"/>
     <rect x="96" y="250" width="208" height="26" rx="12" fill="#3A5CA8"/>
     <g transform="translate(150 210) scale(0.7)"><path d="M0 -30 C-8 -14 -6 -2 0 4 C6 -2 8 -14 0 -30 Z" fill="#F8C144"/><rect x="-7" y="4" width="14" height="30" rx="3" fill="#FBF7EC"/><ellipse cx="0" cy="40" rx="16" ry="5" fill="url(#sv)"/></g>
     <g transform="translate(250 210) scale(0.7)"><path d="M0 -30 C-8 -14 -6 -2 0 4 C6 -2 8 -14 0 -30 Z" fill="#F8C144"/><rect x="-7" y="4" width="14" height="30" rx="3" fill="#FBF7EC"/><ellipse cx="0" cy="40" rx="16" ry="5" fill="url(#sv)"/></g>
     <ellipse cx="200" cy="330" rx="60" ry="24" fill="#D99A4E"/><ellipse cx="200" cy="322" rx="54" ry="20" fill="#E8B265"/>
     <g fill="#FBE1AE" opacity="0.8"><ellipse cx="185" cy="318" rx="8" ry="4"/><ellipse cx="215" cy="318" rx="8" ry="4"/></g>
     ${heText(200, 384, 22, 'url(#gd)', 'שבת שלום')}`
  );
}
function alephBetPuzzle() {
  const tile = (x, y, c, l) => `<g transform="translate(${x} ${y})"><rect x="-26" y="-26" width="52" height="52" rx="9" fill="${c}"/><rect x="-26" y="-26" width="52" height="52" rx="9" fill="none" stroke="#00000018" stroke-width="1.5"/>${heText(0, 14, 34, '#FFFFFF', l)}</g>`;
  return svg(
    `${shadow(430, 145)}
     ${tile(148, 210, '#C0392B', 'א')}${tile(210, 200, '#2C7E9E', 'ב')}${tile(266, 232, '#E0A32E', 'ג')}
     ${tile(150, 288, '#4E8A4E', 'ד')}${tile(212, 300, '#8E4B9E', 'ה')}${tile(268, 300, '#C0392B', 'ו')}
     ${tile(178, 356, '#2C7E9E', 'ז')}${tile(240, 360, '#E0A32E', 'ח')}`
  );
}
function tzedakahKids() {
  const extra = grad('tz', [['0', '#F6C860'], ['0.5', '#E0A32E'], ['1', '#B87A18']], '1', '1');
  return svg(
    `${shadow(428, 120)}
     <rect x="128" y="230" width="144" height="160" rx="16" fill="url(#tz)"/>
     <rect x="128" y="230" width="144" height="30" rx="14" fill="#F0BC55"/>
     <rect x="176" y="242" width="48" height="7" rx="3" fill="#7A5210"/>
     ${heText(200, 330, 30, '#FFFFFF', 'צדקה')}
     <g fill="#FFFFFF" opacity="0.85"><circle cx="160" cy="360" r="4"/><circle cx="240" cy="360" r="4"/></g>
     <circle cx="200" cy="200" r="20" fill="url(#gd)"/><circle cx="200" cy="200" r="13" fill="none" stroke="#8A6E1E" stroke-width="2"/>
     ${heText(200, 208, 16, '#7A5210', '₪')}`,
    extra
  );
}

// ---------- בית כנסת ----------
function parochet() {
  const extra = rgrad('pv', [['0', '#7A1F2C'], ['0.55', '#5A1420'], ['1', '#3A0C16']], '0.4', '0.25', '1.1');
  return svg(
    `${shadow(430, 150)}
     <rect x="90" y="120" width="220" height="290" rx="8" fill="url(#pv)"/>
     <path d="M90 120 L310 120 L310 150 C245 168 155 168 90 150 Z" fill="#8A2634"/>
     <rect x="104" y="150" width="192" height="248" rx="6" fill="none" stroke="url(#gd)" stroke-width="3"/>
     <g stroke="url(#gd)" stroke-width="2.4" fill="none" stroke-linejoin="round"><path d="M200 200 L232 256 L168 256 Z"/><path d="M200 278 L168 222 L232 222 Z"/></g>
     <path d="M176 190 L182 172 L190 184 L200 168 L210 184 L218 172 L224 190 Z" fill="url(#gd)"/>
     <g stroke="url(#gd)" stroke-width="1.8" fill="none" opacity="0.85"><path d="M130 320 q70 -16 140 0"/><path d="M130 350 q70 16 140 0"/></g>
     <g fill="url(#gd)">${[120, 160, 200, 240, 280].map((x) => `<circle cx="${x}" cy="404" r="4"/>`).join('')}</g>
     <path d="M110 130 L110 396" stroke="#FFFFFF" stroke-width="4" opacity="0.12" stroke-linecap="round"/>`,
    extra
  );
}
function torahMantle() {
  const extra = rgrad('mv', [['0', '#1F3A6E'], ['0.55', '#152A52'], ['1', '#0C1A38']], '0.4', '0.25', '1.1');
  return svg(
    `${shadow(430, 130)}
     <ellipse cx="152" cy="150" rx="16" ry="10" fill="url(#gd)"/><ellipse cx="248" cy="150" rx="16" ry="10" fill="url(#gd)"/>
     <rect x="146" y="120" width="12" height="40" rx="4" fill="url(#gd)"/><rect x="242" y="120" width="12" height="40" rx="4" fill="url(#gd)"/>
     <path d="M120 168 C120 160 130 156 200 156 C270 156 280 160 280 168 L280 390 C280 402 270 406 200 406 C130 406 120 402 120 390 Z" fill="url(#mv)"/>
     <rect x="134" y="188" width="132" height="196" rx="6" fill="none" stroke="url(#gd)" stroke-width="2.6"/>
     <path d="M186 210 L182 194 L192 204 L200 190 L208 204 L218 194 L214 210 Z" fill="url(#gd)"/>
     <g stroke="url(#gd)" stroke-width="2.2" fill="none" stroke-linejoin="round"><path d="M200 236 L228 286 L172 286 Z"/><path d="M200 318 L172 268 L228 268 Z"/></g>
     ${heText(200, 368, 18, 'url(#gd)', 'כתר תורה')}
     <path d="M132 176 L132 382" stroke="#FFFFFF" stroke-width="4" opacity="0.14" stroke-linecap="round"/>`,
    extra
  );
}
function yadTorah() {
  return svg(
    `${shadow(432, 70)}
     <g transform="rotate(28 200 250)">
       <rect x="192" y="120" width="16" height="200" rx="7" fill="url(#sv)"/>
       <ellipse cx="200" cy="120" rx="14" ry="8" fill="url(#gd)"/>
       <rect x="186" y="150" width="28" height="18" rx="6" fill="url(#gd)"/>
       <rect x="186" y="250" width="28" height="16" rx="6" fill="url(#gd)"/>
       <rect x="188" y="320" width="24" height="26" rx="6" fill="url(#sv)"/>
       <path d="M198 346 C196 360 196 372 200 384 C204 372 204 360 202 346 Z" fill="url(#sv)"/>
       <path d="M200 384 l-10 6 M200 384 l-2 12 M200 384 l6 10" stroke="url(#sv)" stroke-width="5" stroke-linecap="round"/>
       <path d="M196 130 L196 315" stroke="#FFFFFF" stroke-width="3" opacity="0.5" stroke-linecap="round"/>
     </g>`
  );
}
function torahCrown() {
  return svg(
    `${shadow(430, 130)}
     <path d="M110 320 L120 210 C150 236 250 236 280 210 L290 320 Z" fill="url(#gd)"/>
     <path d="M110 320 L290 320 L288 352 L112 352 Z" fill="url(#gd)"/>
     <path d="M110 210 A14 14 0 1 1 138 210 A14 14 0 1 1 110 210Z" fill="url(#gd)"/>
     <path d="M186 210 A14 14 0 1 1 214 210 A14 14 0 1 1 186 210Z" fill="url(#gd)"/>
     <path d="M262 210 A14 14 0 1 1 290 210 A14 14 0 1 1 262 210Z" fill="url(#gd)"/>
     <g fill="#C0392B"><circle cx="150" cy="286" r="8"/><circle cx="250" cy="286" r="8"/></g>
     <g fill="#2C6E8E"><circle cx="200" cy="278" r="9"/></g>
     <g fill="#FBF3DD" opacity="0.9">${[130, 170, 200, 230, 270].map((x) => `<circle cx="${x}" cy="336" r="4.5"/>`).join('')}</g>
     <g stroke="#8A6E1E" stroke-width="1.5" opacity="0.5" fill="none"><path d="M120 300 q80 -16 160 0"/></g>
     ${heText(200, 250, 20, '#8A6E1E', 'כתר תורה')}`
  );
}
function nerNeshama() {
  const extra = rgrad('fl', [['0', '#FFF6D8'], ['0.5', '#F8C144'], ['1', '#E07B1F']], '0.5', '0.7', '0.7');
  return svg(
    `${shadow(430, 90)}
     <rect x="150" y="300" width="100" height="96" rx="10" fill="url(#sv)"/>
     <rect x="150" y="300" width="100" height="18" rx="9" fill="#E3EAF1"/>
     <ellipse cx="200" cy="300" rx="52" ry="14" fill="url(#sv)"/>
     <ellipse cx="200" cy="298" rx="42" ry="10" fill="#E9EFF5"/>
     <circle cx="200" cy="210" r="46" fill="#F8C144" opacity="0.18" filter="url(#soft)"/>
     <path d="M200 168 C184 196 188 226 200 240 C212 226 216 196 200 168 Z" fill="url(#fl)"/>
     <path d="M200 210 C194 222 196 232 200 238 C204 232 206 222 200 210 Z" fill="#FFF9E0"/>
     ${heText(200, 356, 20, 'url(#gd)', 'לזכר')}`,
    extra
  );
}
function memorialPlaque() {
  return svg(
    `${shadow(430, 140)}
     <rect x="96" y="120" width="208" height="280" rx="10" fill="url(#gd)"/>
     <rect x="108" y="132" width="184" height="256" rx="6" fill="#1B2740"/>
     <path d="M200 160 C180 160 170 176 170 192 C170 216 200 232 200 232 C200 232 230 216 230 192 C230 176 220 160 200 160 Z" fill="none" stroke="url(#gd)" stroke-width="2"/>
     <path d="M186 178 L182 164 L190 172 L200 160 L210 172 L218 164 L214 178 Z" fill="url(#gd)"/>
     <g stroke="url(#gd)" stroke-width="1.6" fill="none" opacity="0.85">${[262, 288, 314, 340].map((y) => `<path d="M140 ${y} h120"/>`).join('')}</g>
     ${heText(200, 250, 22, 'url(#gd)', 'לעילוי נשמת')}`
  );
}
function tzedakahShul() {
  return svg(
    `${shadow(428, 120)}
     <rect x="132" y="220" width="136" height="176" rx="10" fill="url(#sv)"/>
     <rect x="132" y="220" width="136" height="28" rx="8" fill="#E3EAF1"/>
     <rect x="178" y="230" width="44" height="8" rx="4" fill="#5F6E80"/>
     <rect x="146" y="264" width="108" height="120" rx="6" fill="none" stroke="url(#gd)" stroke-width="2"/>
     ${heText(200, 312, 26, 'url(#gd)', 'צדקה')}
     <path d="M160 336 q40 -12 80 0" stroke="url(#gd)" stroke-width="1.6" fill="none"/>
     <path d="M146 230 L146 380" stroke="#FFFFFF" stroke-width="4" opacity="0.5" stroke-linecap="round"/>
     <g stroke="url(#gd)" stroke-width="2" fill="none" stroke-linejoin="round"><path d="M200 356 L212 376 L188 376 Z"/></g>`
  );
}

// ---------- בשמים ותכשיטים נוספים ----------
function besamimTower() {
  return svg(
    `${shadow(432, 80)}
     <rect x="180" y="250" width="40" height="120" rx="6" fill="url(#sv)"/>
     <g fill="#101A38">${[268, 292, 316].flatMap((y) => [`<rect x="186" y="${y}" width="9" height="9" transform="rotate(45 190 ${y + 4})"/>`, `<rect x="205" y="${y}" width="9" height="9" transform="rotate(45 209 ${y + 4})"/>`]).join('')}</g>
     <path d="M178 250 A22 18 0 0 1 222 250 Z" fill="url(#gd)"/>
     <rect x="197" y="150" width="6" height="66" fill="url(#gd)"/>
     <path d="M203 152 L228 160 L203 170 Z" fill="url(#gd)"/>
     <circle cx="200" cy="146" r="5" fill="url(#gd)"/>
     <ellipse cx="200" cy="374" rx="36" ry="9" fill="url(#sv)"/>
     <rect x="186" y="216" width="28" height="12" rx="4" fill="url(#gd)"/>
     <path d="M186 258 L186 366" stroke="#FFFFFF" stroke-width="3.5" opacity="0.5" stroke-linecap="round"/>`
  );
}
function besamimPomegranate() {
  const extra = rgrad('pm', [['0', '#C0453E'], ['0.55', '#9E2E2A'], ['1', '#6E1A18']], '0.4', '0.3', '1');
  return svg(
    `${shadow(430, 100)}
     <circle cx="200" cy="288" r="86" fill="url(#pm)"/>
     <g stroke="#5A1210" stroke-width="2" opacity="0.4" fill="none"><path d="M150 240 C138 280 138 320 150 356"/><path d="M200 224 C194 280 194 320 200 360"/><path d="M250 240 C262 280 262 320 250 356"/></g>
     <path d="M180 208 L184 184 L192 200 L200 178 L208 200 L216 184 L220 208 Z" fill="url(#gd)"/>
     <g fill="#F2DE9E" opacity="0.9">${Array.from({ length: 12 }, (_, i) => `<circle cx="${170 + (i % 4) * 20}" cy="${262 + Math.floor(i / 4) * 24}" r="2.2"/>`).join('')}</g>
     <ellipse cx="168" cy="258" rx="20" ry="30" fill="#FFFFFF" opacity="0.14"/>`,
    extra
  );
}
function ringShema() {
  return svg(
    `${shadow(410, 70)}
     <ellipse cx="200" cy="300" rx="120" ry="70" fill="#1F2E63" opacity="0.05" filter="url(#soft)"/>
     <circle cx="200" cy="272" r="96" fill="none" stroke="url(#gd)" stroke-width="34"/>
     <circle cx="200" cy="272" r="112" fill="none" stroke="#8F6B1B" stroke-width="1.5"/>
     <circle cx="200" cy="272" r="80" fill="none" stroke="#8F6B1B" stroke-width="1.5"/>
     ${heText(200, 200, 20, '#7A5B16', 'שמע ישראל')}
     ${heText(200, 360, 18, '#7A5B16', "ה' אחד")}`
  );
}
function earringsMagen() {
  const one = (x) => `<g transform="translate(${x} 0)">
     <path d="M0 150 L0 176" stroke="url(#gd)" stroke-width="2.5"/>
     <circle cx="0" cy="148" r="6" fill="none" stroke="url(#gd)" stroke-width="2.5"/>
     <g stroke="url(#gd)" stroke-width="8" fill="none" stroke-linejoin="round"><path d="M0 190 L34 250 L-34 250 Z"/><path d="M0 310 L-34 250 L34 250 Z"/></g>
     <circle cx="0" cy="250" r="6" fill="url(#gd)"/></g>`;
  return svg(`${shadow(400, 110)}<ellipse cx="200" cy="290" rx="130" ry="90" fill="#1F2E63" opacity="0.05" filter="url(#soft)"/>${one(150)}${one(250)}`);
}

const files = {
  // ספרים
  'siddur-pocket-brown.svg': book({ cover: ['#8A5A2E', '#63401F', '#3E2712'], title: 'סידור', clasp: true }),
  'tehillim-mini-blue.svg': book({ cover: ['#2E4B8A', '#1F3A6E', '#132650'], title: 'תהילים', w: 150, h: 210 }),
  'chumash-rashi-set.svg': book({ cover: ['#5A1420', '#3E0E17', '#280910'], title: 'חומש', pages: '#E8D48B' }),
  'haggadah-illustrated.svg': book({ cover: ['#1F5A5E', '#134044', '#0C2A2E'], title: 'הגדה' }),
  'birkon-personalized.svg': book({ cover: ['#EFEADE', '#DDD2B8', '#C6B892'], spine: 'gd', title: 'ברכון', w: 170, h: 190 }),
  'tehillim-silver-stand.svg': tehillimSilver(),
  // חגים
  'dreidel-silver-925.svg': dreidelSilver(),
  'dreidels-wood-set.svg': dreidelsWood(),
  'etrog-box-silver.svg': etrogBox(),
  'arba-minim-mehadrin.svg': arbaMinim(),
  'rosh-hashana-plate.svg': roshPlate(),
  'mishloach-manot-tray.svg': mishloachTray(),
  'purim-crown-kids.svg': purimCrown(),
  'megillat-esther-klaf.svg': megillah(),
  // ילדים
  'siddur-kids-illustrated.svg': kidsBook({ cover: ['#3E97B8', '#2C7E9E'], title: 'הסידור שלי' }),
  'brachot-book-kids.svg': kidsBook({ cover: ['#E0A32E', '#B87A18'], title: 'מה מברכים' }),
  'netla-kids-color.svg': netlaKids(),
  'shabbat-set-kids.svg': shabbatKids(),
  'alephbet-puzzle.svg': alephBetPuzzle(),
  'tzedakah-box-kids.svg': tzedakahKids(),
  // בית כנסת
  'parochet-embroidered.svg': parochet(),
  'torah-mantle-royal.svg': torahMantle(),
  'yad-torah-silver.svg': yadTorah(),
  'torah-crown-silver.svg': torahCrown(),
  'ner-neshama-memorial.svg': nerNeshama(),
  'memorial-plaque.svg': memorialPlaque(),
  'tzedakah-box-shul.svg': tzedakahShul(),
  // בשמים ותכשיטים
  'besamim-tower-silver.svg': besamimTower(),
  'besamim-pomegranate.svg': besamimPomegranate(),
  'ring-shema-silver.svg': ringShema(),
  'earrings-magen-david.svg': earringsMagen(),
};

let n = 0;
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content.trim() + '\n');
  n++;
}
console.log(`✓ Generated ${n} images (batch 2)`);
