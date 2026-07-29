// ============================================================
// מחולל תמונות — אצווה 3: חשמל ושבת, ברית ולידה, מזכרות מירושלים, שובר מתנה.
// אותה שפה ויזואלית (סטודיו, שמנת→זהב, viewBox 400×500).
// הרצה: node scripts/generate-images-3.mjs
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
  <linearGradient id="steel" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9AA6B2"/><stop offset="0.3" stop-color="#E7ECF1"/><stop offset="0.55" stop-color="#C2CBD5"/><stop offset="1" stop-color="#7E8A97"/></linearGradient>
  <linearGradient id="gd" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#B58A2C"/><stop offset="0.3" stop-color="#F2DE9E"/><stop offset="0.55" stop-color="#D4AF37"/><stop offset="1" stop-color="#8F6B1B"/></linearGradient>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>`;

const svg = (inner, extra = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs>${DEFS}${extra}</defs><rect width="400" height="500" fill="url(#bg)"/><rect width="400" height="500" fill="url(#vig)"/>${inner}</svg>`;
const shadow = (cy = 430, rx = 130) => `<ellipse cx="200" cy="${cy}" rx="${rx}" ry="15" fill="#3A3020" opacity="0.22" filter="url(#soft)"/>`;
const grad = (id, stops, x2 = '1', y2 = '0') => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</linearGradient>`;
const rgrad = (id, stops, cx = '0.38', cy = '0.28', r = '0.95') => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`).join('')}</radialGradient>`;
const heText = (x, y, size, fill, t, w = 700) => `<text x="${x}" y="${y}" text-anchor="middle" font-family="'Frank Ruhl Libre','Times New Roman',serif" font-size="${size}" font-weight="${w}" fill="${fill}">${t}</text>`;

// ---------- חשמל ושבת ----------
function plataShabbat() {
  return svg(
    `${shadow(400, 155)}
     <path d="M70 340 L330 300 L360 340 L100 380 Z" fill="url(#steel)"/>
     <path d="M70 340 L330 300 L330 316 L70 356 Z" fill="#C8D0DA"/>
     <path d="M100 380 L360 340 L360 356 L100 396 Z" fill="#8892A0"/>
     <g stroke="#7E8A97" stroke-width="2" opacity="0.5"><path d="M110 352 L320 316"/><path d="M120 364 L332 328"/></g>
     <ellipse cx="330" cy="330" rx="14" ry="8" fill="url(#sv)"/><ellipse cx="330" cy="328" rx="7" ry="4" fill="#5F6E80"/>
     <path d="M360 348 C380 356 388 372 384 392" stroke="#33363F" stroke-width="4" fill="none"/>
     <path d="M120 356 L300 322" stroke="#FFFFFF" stroke-width="3" opacity="0.5"/>`
  );
}
function urnWater() {
  return svg(
    `${shadow(430, 110)}
     <ellipse cx="200" cy="404" rx="86" ry="16" fill="url(#steel)"/>
     <rect x="126" y="150" width="148" height="248" rx="20" fill="url(#steel)"/>
     <rect x="126" y="150" width="148" height="30" rx="15" fill="#DCE3EA"/>
     <ellipse cx="200" cy="150" rx="74" ry="16" fill="#E7ECF1"/>
     <ellipse cx="200" cy="146" rx="42" ry="9" fill="#C2CBD5"/>
     <rect x="188" y="128" width="24" height="18" rx="6" fill="url(#sv)"/>
     <!-- ברז -->
     <path d="M274 300 L306 300 L306 320 L296 320 L296 336 L286 336 L286 320 L274 320 Z" fill="url(#sv)"/>
     <rect x="284" y="286" width="18" height="16" rx="4" fill="#5F6E80"/>
     <!-- ידית -->
     <path d="M126 220 C96 220 96 300 126 300" stroke="#33363F" stroke-width="10" fill="none" stroke-linecap="round"/>
     <!-- מד -->
     <rect x="150" y="230" width="10" height="120" rx="5" fill="#2A3448" opacity="0.6"/>
     <circle cx="200" cy="210" r="6" fill="#E0533A"/>
     <path d="M146 176 L146 380" stroke="#FFFFFF" stroke-width="5" opacity="0.5" stroke-linecap="round"/>`
  );
}
function shabbatClock() {
  const extra = grad('dial', [['0', '#2A3448'], ['1', '#151C2E']], '1', '1');
  return svg(
    `${shadow(420, 100)}
     <rect x="130" y="180" width="140" height="180" rx="16" fill="#E7E2D6"/>
     <rect x="130" y="180" width="140" height="180" rx="16" fill="none" stroke="#C7BFAE" stroke-width="2"/>
     <circle cx="200" cy="252" r="52" fill="url(#dial)"/>
     <circle cx="200" cy="252" r="52" fill="none" stroke="url(#gd)" stroke-width="2"/>
     <g stroke="#F2DE9E" stroke-width="2" opacity="0.85">${Array.from({ length: 12 }, (_, i) => { const a = (i * 30 - 90) * Math.PI / 180; return `<line x1="${200 + 44 * Math.cos(a)}" y1="${252 + 44 * Math.sin(a)}" x2="${200 + 48 * Math.cos(a)}" y2="${252 + 48 * Math.sin(a)}"/>`; }).join('')}</g>
     <line x1="200" y1="252" x2="200" y2="220" stroke="#F2DE9E" stroke-width="3" stroke-linecap="round"/>
     <line x1="200" y1="252" x2="226" y2="252" stroke="#F2DE9E" stroke-width="2.5" stroke-linecap="round"/>
     <circle cx="200" cy="252" r="3" fill="#F2DE9E"/>
     ${heText(200, 335, 16, '#5A5346', 'שעון שבת')}
     <!-- תקע -->
     <rect x="180" y="360" width="10" height="22" fill="#8892A0"/><rect x="210" y="360" width="10" height="22" fill="#8892A0"/>`,
    extra
  );
}
function shabbatLamp() {
  const extra = rgrad('shade', [['0', '#F6E9C8'], ['0.6', '#E8CE84'], ['1', '#C9A94E']], '0.5', '0.2', '1');
  return svg(
    `${shadow(430, 90)}
     <rect x="196" y="90" width="8" height="120" fill="#8892A0"/>
     <path d="M120 210 L280 210 L250 300 L150 300 Z" fill="url(#shade)"/>
     <path d="M120 210 L280 210 L278 220 L122 220 Z" fill="#FFFFFF" opacity="0.4"/>
     <ellipse cx="200" cy="300" rx="50" ry="10" fill="#C9A94E"/>
     <circle cx="200" cy="255" r="34" fill="#FFF6D8" opacity="0.5" filter="url(#soft)"/>
     <rect x="188" y="300" width="24" height="70" fill="#8892A0"/>
     <path d="M160 372 L240 372 L252 396 L148 396 Z" fill="url(#sv)"/>
     <ellipse cx="200" cy="396" rx="56" ry="10" fill="url(#sv)"/>
     <!-- שרשרת משיכה -->
     <path d="M260 220 L260 270" stroke="#8892A0" stroke-width="2" stroke-dasharray="2 3"/><circle cx="260" cy="274" r="4" fill="url(#gd)"/>`,
    extra
  );
}
function kettleSteel() {
  return svg(
    `${shadow(430, 110)}
     <ellipse cx="200" cy="404" rx="88" ry="15" fill="url(#steel)"/>
     <path d="M124 250 C124 210 160 190 200 190 C240 190 276 210 276 250 L272 384 C272 396 240 400 200 400 C160 400 128 396 128 384 Z" fill="url(#steel)"/>
     <ellipse cx="200" cy="196" rx="60" ry="14" fill="#DCE3EA"/>
     <rect x="184" y="168" width="32" height="24" rx="8" fill="url(#sv)"/>
     <!-- זרבובית -->
     <path d="M124 260 C96 250 78 232 74 210 L88 206 C94 226 110 242 128 250 Z" fill="url(#steel)"/>
     <!-- ידית -->
     <path d="M276 240 C320 240 320 330 276 340" stroke="#33363F" stroke-width="12" fill="none" stroke-linecap="round"/>
     <path d="M140 220 C136 280 138 340 142 384" stroke="#FFFFFF" stroke-width="5" opacity="0.5" fill="none" stroke-linecap="round"/>`
  );
}

// ---------- ברית ולידה ----------
function britPillow() {
  const extra = rgrad('vel', [['0', '#2C3D78'], ['0.6', '#1F2E63'], ['1', '#131F49']], '0.35', '0.25', '1.1');
  return svg(
    `${shadow(400, 150)}
     <path d="M90 180 Q90 160 112 158 L288 158 Q310 160 310 180 L310 360 Q310 382 288 384 L112 384 Q90 382 90 360 Z" fill="url(#vel)"/>
     <path d="M96 168 L304 372" stroke="#FFFFFF" stroke-width="50" opacity="0.05" stroke-linecap="round"/>
     <rect x="112" y="182" width="176" height="176" rx="10" fill="none" stroke="url(#gd)" stroke-width="2.4"/>
     ${heText(200, 244, 26, 'url(#gd)', 'ברוך הבא')}
     ${heText(200, 284, 20, 'url(#gd)', 'בזאת הברית')}
     <g stroke="url(#gd)" stroke-width="2" fill="none" opacity="0.85"><path d="M140 312 q60 14 120 0"/></g>
     <!-- גדילי פינה -->
     <g fill="url(#gd)"><circle cx="96" cy="168" r="6"/><circle cx="304" cy="168" r="6"/><circle cx="96" cy="374" r="6"/><circle cx="304" cy="374" r="6"/></g>`,
    extra
  );
}
function britSetTray() {
  return svg(
    `${shadow(420, 155)}
     <ellipse cx="200" cy="332" rx="158" ry="60" fill="url(#sv)"/>
     <ellipse cx="200" cy="326" rx="144" ry="51" fill="#E8EDF3"/>
     <ellipse cx="200" cy="324" rx="128" ry="43" fill="#F4F8FC"/>
     <g stroke="url(#gd)" stroke-width="2" fill="none"><ellipse cx="200" cy="324" rx="134" ry="46"/></g>
     <!-- בקבוקון שמן -->
     <g transform="translate(150 300)"><rect x="-14" y="-56" width="28" height="56" rx="8" fill="url(#gd)" opacity="0.85"/><rect x="-8" y="-70" width="16" height="16" rx="4" fill="url(#sv)"/></g>
     <!-- כוסית -->
     <g transform="translate(240 300)"><path d="M-18 -46 C-18 -20 -8 -6 0 -6 C8 -6 18 -20 18 -46 Z" fill="url(#sv)"/><ellipse cx="0" cy="-46" rx="18" ry="5" fill="#E8EDF3"/><ellipse cx="0" cy="0" rx="14" ry="4" fill="url(#sv)"/></g>
     <!-- נר -->
     <g transform="translate(200 296)"><path d="M0 -70 C-5 -62 -3 -56 0 -53 C3 -56 5 -62 0 -70 Z" fill="#F8C144"/><rect x="-5" y="-53" width="10" height="46" rx="2" fill="#FBF7EC"/></g>
     ${heText(200, 360, 15, '#5F6E80', 'סט לברית')}`
  );
}
function newbornGiftBox() {
  const extra = grad('baby', [['0', '#EAF3F7'], ['1', '#CFE2EC']], '0.6', '1');
  return svg(
    `${shadow(426, 140)}
     <rect x="104" y="236" width="192" height="160" rx="12" fill="url(#baby)"/>
     <rect x="96" y="204" width="208" height="46" rx="8" fill="url(#baby)" stroke="#B7D0DC" stroke-width="1"/>
     <rect x="186" y="204" width="28" height="192" fill="#9FB6C9"/>
     <rect x="96" y="220" width="208" height="12" fill="#9FB6C9" opacity="0.9"/>
     <path d="M200 202 C178 176 150 178 148 196 C146 210 172 210 200 202 Z" fill="#9FB6C9"/>
     <path d="M200 202 C222 176 250 178 252 196 C254 210 228 210 200 202 Z" fill="#9FB6C9"/>
     <circle cx="200" cy="202" r="9" fill="#9FB6C9"/>
     <!-- פריטי תינוק מציצים -->
     <circle cx="150" cy="250" r="18" fill="#FBF7EC"/><path d="M150 240 a10 10 0 0 1 0 20" fill="#F3D9A0"/>
     <rect x="230" y="238" width="30" height="24" rx="6" fill="#FBF7EC"/>
     ${heText(200, 360, 18, '#3E6076', 'מזל טוב')}`,
    extra
  );
}
function babyBlessingFrame() {
  return svg(
    `${shadow(430, 130)}
     <rect x="88" y="110" width="224" height="290" rx="6" fill="url(#gd)"/>
     <rect x="100" y="122" width="200" height="266" rx="4" fill="#FBF9F2"/>
     <g stroke="url(#gd)" stroke-width="1.4" fill="none" opacity="0.85"><rect x="112" y="134" width="176" height="242" rx="4"/></g>
     <path d="M164 176 C176 156 224 156 236 176" stroke="url(#gd)" stroke-width="2.2" fill="none"/>
     <circle cx="200" cy="164" r="8" fill="none" stroke="url(#gd)" stroke-width="2"/>
     ${heText(200, 226, 26, '#8A6E2E', 'ברכת הלידה')}
     <g stroke="#B9A67E" stroke-width="2.4" stroke-linecap="round" opacity="0.85">${[262, 288, 314].map((y) => `<path d="M140 ${y} h120"/>`).join('')}</g>
     <g fill="url(#gd)"><circle cx="200" cy="352" r="3.4"/><circle cx="184" cy="352" r="2"/><circle cx="216" cy="352" r="2"/></g>`
  );
}

// ---------- מזכרות מירושלים ----------
function templeModel() {
  const extra = grad('stone', [['0', '#EAD9B4'], ['0.5', '#D6C094'], ['1', '#B79A66']], '0', '1');
  return svg(
    `${shadow(420, 150)}
     <rect x="70" y="330" width="260" height="60" fill="url(#stone)"/>
     <g stroke="#A88E5E" stroke-width="1" opacity="0.5">${[344, 358, 372].map((y) => `<line x1="70" y1="${y}" x2="330" y2="${y}"/>`).join('')}</g>
     <!-- מבנה מרכזי -->
     <rect x="150" y="200" width="100" height="130" fill="url(#stone)"/>
     <path d="M150 200 L200 150 L250 200 Z" fill="url(#gd)"/>
     <rect x="176" y="250" width="48" height="80" rx="24" fill="#7A6238"/>
     <!-- עמודים -->
     <rect x="100" y="240" width="22" height="90" fill="url(#stone)"/><rect x="128" y="240" width="22" height="90" fill="url(#stone)"/>
     <rect x="250" y="240" width="22" height="90" fill="url(#stone)"/><rect x="278" y="240" width="22" height="90" fill="url(#stone)"/>
     <rect x="96" y="234" width="30" height="8" fill="url(#gd)"/><rect x="124" y="234" width="30" height="8" fill="url(#gd)"/>
     <rect x="246" y="234" width="30" height="8" fill="url(#gd)"/><rect x="274" y="234" width="30" height="8" fill="url(#gd)"/>
     <circle cx="200" cy="130" r="6" fill="url(#gd)"/>`,
    extra
  );
}
function jerusalemMagnets() {
  const tile = (x, y, c, sym) => `<g transform="translate(${x} ${y})"><rect x="-34" y="-34" width="68" height="68" rx="8" fill="${c}"/><rect x="-34" y="-34" width="68" height="68" rx="8" fill="none" stroke="url(#gd)" stroke-width="1.5"/>${sym}</g>`;
  return svg(
    `${shadow(430, 150)}
     ${tile(140, 200, '#23346E', `<g stroke="url(#gd)" stroke-width="2" fill="none" stroke-linejoin="round"><path d="M0 -14 L14 10 L-14 10 Z"/><path d="M0 14 L-14 -10 L14 -10 Z"/></g>`)}
     ${tile(260, 200, '#7A2130', heText(0, 8, 30, '#F2DE9E', 'חי'))}
     ${tile(140, 300, '#175058', `<g stroke="url(#gd)" stroke-width="2.4" fill="none"><path d="M-16 12 L-16 -6 L0 -14 L16 -6 L16 12"/><path d="M-6 12 L-6 0 L6 0 L6 12"/></g>`)}
     ${tile(260, 300, '#654024', `<circle cx="0" cy="0" r="15" fill="none" stroke="url(#gd)" stroke-width="2.4"/><path d="M-6 -18 L0 -10 L6 -18" stroke="url(#gd)" stroke-width="2" fill="none"/>`)}`
  );
}
function kotelFrame() {
  const extra = grad('kstone', [['0', '#EAD9B4'], ['0.5', '#CDB58A'], ['1', '#B79A66']], '0', '1');
  return svg(
    `${shadow(430, 130)}
     <rect x="92" y="120" width="216" height="270" rx="6" fill="url(#gd)"/>
     <rect x="104" y="132" width="192" height="246" rx="3" fill="#DCC79A"/>
     <g stroke="#B29A6A" stroke-width="1.5" opacity="0.7">
       ${Array.from({ length: 8 }, (_, r) => `<line x1="104" y1="${150 + r * 30}" x2="296" y2="${150 + r * 30}"/>`).join('')}
       ${Array.from({ length: 8 }, (_, r) => Array.from({ length: 5 }, (_, c) => `<line x1="${120 + c * 40 + (r % 2) * 20}" y1="${150 + r * 30}" x2="${120 + c * 40 + (r % 2) * 20}" y2="${180 + r * 30}"/>`).join('')).join('')}
     </g>
     <!-- פתקים -->
     <g fill="#FBF9F2">${[[150,210],[230,250],[180,300],[250,330],[130,280]].map(([x,y])=>`<rect x="${x}" y="${y}" width="9" height="12" rx="1"/>`).join('')}</g>
     <!-- צמחייה -->
     <g fill="#5E7C3A" opacity="0.8"><ellipse cx="140" cy="200" rx="6" ry="14" transform="rotate(-20 140 200)"/><ellipse cx="262" cy="320" rx="6" ry="14" transform="rotate(20 262 320)"/></g>`,
    extra
  );
}
function blessingCards() {
  const card = (rot, x, c) => `<g transform="rotate(${rot} 200 300) translate(${x} 0)"><rect x="140" y="180" width="120" height="170" rx="8" fill="#FBF9F2" stroke="url(#gd)" stroke-width="2"/><path d="M158 214 q42 -16 84 0" stroke="url(#gd)" stroke-width="1.6" fill="none"/><circle cx="200" cy="250" r="18" fill="none" stroke="url(#gd)" stroke-width="1.6"/><g stroke="url(#gd)" stroke-width="1.4" fill="none" stroke-linejoin="round"><path d="M200 240 L208 254 L192 254 Z"/><path d="M200 260 L192 246 L208 246 Z"/></g><g stroke="#B9A67E" stroke-width="1.6" opacity="0.7"><path d="M164 300 h72"/><path d="M164 316 h56"/></g></g>`;
  return svg(`${shadow(420, 130)}${card(-12, -30, 1)}${card(0, 0, 1)}${card(12, 30, 1)}`);
}
function pomegranateFigurine() {
  const extra = rgrad('pom', [['0', '#C0453E'], ['0.55', '#9E2E2A'], ['1', '#6E1A18']], '0.4', '0.3', '1');
  return svg(
    `${shadow(430, 90)}
     <circle cx="200" cy="290" r="88" fill="url(#pom)"/>
     <g stroke="#5A1210" stroke-width="2" opacity="0.35" fill="none"><path d="M150 244 C138 284 138 320 150 356"/><path d="M200 228 C194 284 194 320 200 360"/><path d="M250 244 C262 284 262 320 250 356"/></g>
     <path d="M178 208 L184 182 L192 200 L200 176 L208 200 L216 182 L222 208 Z" fill="url(#gd)"/>
     <g stroke="url(#gd)" stroke-width="1.5" fill="none" opacity="0.9"><path d="M150 300 q50 16 100 0"/></g>
     <ellipse cx="170" cy="258" rx="20" ry="30" fill="#FFFFFF" opacity="0.14"/>`,
    extra
  );
}

// ---------- שובר מתנה ----------
function giftCard() {
  const extra = grad('gcNavy', [['0', '#1F2E63'], ['1', '#0B132B']], '0.7', '1');
  return svg(
    `${shadow(360, 150)}
     <g transform="rotate(-6 200 260)">
       <rect x="70" y="180" width="260" height="164" rx="16" fill="url(#gcNavy)"/>
       <rect x="70" y="180" width="260" height="164" rx="16" fill="none" stroke="url(#gd)" stroke-width="2"/>
       <rect x="84" y="194" width="232" height="136" rx="10" fill="none" stroke="url(#gd)" stroke-width="0.8" stroke-dasharray="4 3" opacity="0.6"/>
       ${heText(200, 236, 30, 'url(#gd)', 'שובר מתנה')}
       ${heText(200, 268, 16, '#E8D9A8', 'אמונה וביטחון')}
       <!-- פס מגנטי / לוגו -->
       <rect x="96" y="300" width="120" height="16" rx="4" fill="#D4AF37" opacity="0.25"/>
       <path d="M270 292 L276 306 L262 306 Z M270 320 L262 306 L276 306 Z" fill="url(#gd)"/>
     </g>
     <!-- סרט מתנה -->
     <path d="M200 140 C176 120 150 128 152 144 C154 158 178 154 200 146 Z" fill="url(#gd)"/>
     <path d="M200 146 C224 120 250 128 248 144 C246 158 222 154 200 146 Z" fill="url(#gd)"/>`,
    extra
  );
}

const files = {
  // חשמל ושבת
  'plata-shabbat.svg': plataShabbat(),
  'urn-water-electric.svg': urnWater(),
  'shabbat-clock-timer.svg': shabbatClock(),
  'shabbat-lamp.svg': shabbatLamp(),
  'kettle-steel.svg': kettleSteel(),
  // ברית ולידה
  'brit-pillow-embroidered.svg': britPillow(),
  'brit-set-tray.svg': britSetTray(),
  'newborn-gift-box.svg': newbornGiftBox(),
  'baby-blessing-frame.svg': babyBlessingFrame(),
  // מזכרות מירושלים
  'temple-model.svg': templeModel(),
  'jerusalem-magnets.svg': jerusalemMagnets(),
  'kotel-frame.svg': kotelFrame(),
  'blessing-cards-set.svg': blessingCards(),
  'pomegranate-figurine.svg': pomegranateFigurine(),
  // שובר מתנה
  'gift-card.svg': giftCard(),
};

let n = 0;
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content.trim() + '\n');
  n++;
}
console.log(`✓ Generated ${n} images (batch 3)`);
