// ============================================================
// מחולל תמונות מוצר — סגנון "צילום סטודיו" אחיד
// כל מוצר מקבל SVG ייחודי (צורה/צבע/פרטים) מטמפלט פרמטרי.
// הרצה: node scripts/generate-product-images.mjs
// ============================================================
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const OUT = join(dirname(fileURLToPath(import.meta.url)), '../public/images/products');
mkdirSync(OUT, { recursive: true });

const DEFS = `
  <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="#FCFAF4"/><stop offset="0.72" stop-color="#F3EDE0"/><stop offset="1" stop-color="#E2D8C3"/>
  </linearGradient>
  <radialGradient id="vig" cx="0.5" cy="0.42" r="0.8">
    <stop offset="0.6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#4A3A1E" stop-opacity="0.1"/>
  </radialGradient>
  <linearGradient id="sv" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#8E9CAC"/><stop offset="0.18" stop-color="#F2F6FA"/><stop offset="0.36" stop-color="#FFFFFF"/>
    <stop offset="0.6" stop-color="#B4BFCC"/><stop offset="0.84" stop-color="#6E7D8E"/><stop offset="1" stop-color="#9FABB9"/>
  </linearGradient>
  <linearGradient id="gd" x1="0" y1="0" x2="1" y2="0">
    <stop offset="0" stop-color="#B58A2C"/><stop offset="0.3" stop-color="#F2DE9E"/><stop offset="0.55" stop-color="#D4AF37"/><stop offset="1" stop-color="#8F6B1B"/>
  </linearGradient>
  <filter id="soft" x="-60%" y="-60%" width="220%" height="220%"><feGaussianBlur stdDeviation="7"/></filter>`;

const svg = (inner, extraDefs = '') =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500"><defs>${DEFS}${extraDefs}</defs>
<rect width="400" height="500" fill="url(#bg)"/><rect width="400" height="500" fill="url(#vig)"/>${inner}</svg>`;

const shadow = (cy = 430, rx = 130) =>
  `<ellipse cx="200" cy="${cy}" rx="${rx}" ry="15" fill="#3A3020" opacity="0.22" filter="url(#soft)"/>`;

const grad = (id, stops, x = '0', y = '0', x2 = '1', y2 = '0') =>
  `<linearGradient id="${id}" x1="${x}" y1="${y}" x2="${x2}" y2="${y2}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</linearGradient>`;

const rgrad = (id, stops, cx = '0.38', cy = '0.28', r = '0.95') =>
  `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops
    .map(([o, c]) => `<stop offset="${o}" stop-color="${c}"/>`)
    .join('')}</radialGradient>`;

// ---------- כיפות ----------
function kippah({ dome, mid, deep, band = 'gd', pattern = 'rings', scale = 1 }) {
  const extra = rgrad('dome', [['0', dome], ['0.55', mid], ['1', deep]]);
  const s = scale;
  const rows =
    pattern === 'plain'
      ? `<path d="M${200 - 108 * s} ${348} A${108 * s} ${92 * s} 0 0 1 ${200 + 108 * s} 348" stroke="#FFFFFF" stroke-width="3" stroke-dasharray="2 8" opacity="0.35" fill="none"/>`
      : pattern === 'diamonds'
        ? `<g fill="#FFFFFF" opacity="0.5">${[-70, -35, 0, 35, 70].map((x) => `<rect x="${196 + x}" y="316" width="8" height="8" transform="rotate(45 ${200 + x} 320)"/>`).join('')}</g>
           <path d="M${200 - 90 * s} 340 A${90 * s} 76 0 0 1 ${200 + 90 * s} 340" stroke="url(#${band})" stroke-width="5" fill="none"/>`
        : `<path d="M${200 - 104 * s} 346 A${104 * s} 88 0 0 1 ${200 + 104 * s} 346" stroke="#FFFFFF" stroke-width="4" stroke-dasharray="2 7" opacity="0.5" fill="none"/>
           <path d="M${200 - 80 * s} 330 A${80 * s} 68 0 0 1 ${200 + 80 * s} 330" stroke="url(#${band})" stroke-width="5" fill="none"/>
           <path d="M${200 - 54 * s} 314 A${54 * s} 46 0 0 1 ${200 + 54 * s} 314" stroke="#FFFFFF" stroke-width="3.4" stroke-dasharray="2 6.5" opacity="0.45" fill="none"/>`;
  return svg(
    `${shadow(390, 140 * s)}
     <path d="M${200 - 124 * s} 366 A${124 * s} ${106 * s} 0 0 1 ${200 + 124 * s} 366 Z" fill="url(#dome)"/>
     ${rows}
     <path d="M${200 - 124 * s} 366 A${124 * s} 22 0 0 0 ${200 + 124 * s} 366 L${200 + 124 * s} 377 A${124 * s} 22 0 0 1 ${200 - 124 * s} 377 Z" fill="url(#${band})"/>
     <ellipse cx="160" cy="304" rx="42" ry="24" fill="#FFFFFF" opacity="0.1" filter="url(#soft)"/>`,
    extra
  );
}

// ---------- טליתות וטקסטיל ----------
function tallitVariant({ stripe, stripe2 = stripe, atara = 'sv', accentW = 12 }) {
  return svg(
    `${shadow(412, 160)}
     <rect x="84" y="298" width="232" height="70" rx="12" fill="#E4DECC"/>
     <rect x="84" y="330" width="232" height="10" fill="${stripe}" opacity="0.9"/>
     <rect x="72" y="234" width="256" height="76" rx="12" fill="#EFEBDD"/>
     <rect x="72" y="266" width="256" height="${accentW}" fill="${stripe}"/>
     <rect x="72" y="284" width="256" height="5" fill="${stripe2}" opacity="0.8"/>
     <rect x="62" y="148" width="276" height="118" rx="14" fill="#FBF9F2"/>
     <rect x="62" y="196" width="276" height="14" fill="${stripe}"/>
     <rect x="62" y="216" width="276" height="6" fill="${stripe2}"/>
     <rect x="110" y="158" width="180" height="24" rx="7" fill="url(#${atara})" stroke="#8794A4" stroke-width="0.8"/>
     <g fill="#7C8B9C" opacity="0.75">${[132, 168, 204, 240].map((x) => `<rect x="${x}" y="165" width="9" height="9" rx="1.5" transform="rotate(45 ${x + 4.5} ${169.5})"/>`).join('')}</g>
     <g stroke="#EFEAD9" stroke-width="3.2" fill="none" stroke-linecap="round">
       <path d="M96 368 C94 386 98 400 95 416"/><path d="M105 368 C107 388 102 402 107 418"/>
       <path d="M295 368 C293 386 297 400 294 416"/><path d="M304 368 C306 388 301 402 306 418"/>
     </g>
     <ellipse cx="100" cy="378" rx="6.5" ry="4.2" fill="#DDD6C0"/><ellipse cx="300" cy="378" rx="6.5" ry="4.2" fill="#DDD6C0"/>`
  );
}

function tzitzitKatan() {
  return svg(
    `${shadow(420, 130)}
     <path d="M120 130 L160 118 C172 138 228 138 240 118 L280 130 L268 190 L252 184 L252 396 C220 410 180 410 148 396 L148 184 L132 190 Z" fill="#FBF9F2" stroke="#D9D2BE" stroke-width="2"/>
     <path d="M160 118 C172 138 228 138 240 118 L240 128 C226 146 174 146 160 128 Z" fill="#E8E2D0"/>
     <g stroke="#E4DCC4" stroke-width="2" opacity="0.7"><path d="M156 220 h88"/><path d="M156 260 h88"/><path d="M156 300 h88"/></g>
     <g stroke="#EFEAD9" stroke-width="3" fill="none" stroke-linecap="round">
       <path d="M152 398 C150 414 154 424 151 438"/><path d="M160 400 C162 416 157 426 162 440"/>
       <path d="M240 400 C238 414 242 424 239 438"/><path d="M248 398 C250 416 245 426 250 440"/>
     </g>
     <ellipse cx="156" cy="408" rx="6" ry="4" fill="#DDD6C0"/><ellipse cx="244" cy="408" rx="6" ry="4" fill="#DDD6C0"/>`
  );
}

function ataraOnly() {
  return svg(
    `${shadow(360, 150)}
     <rect x="60" y="210" width="280" height="120" rx="10" fill="#F6F2E7"/>
     <rect x="72" y="240" width="256" height="58" rx="10" fill="url(#sv)" stroke="#8794A4" stroke-width="1"/>
     <g stroke="url(#gd)" stroke-width="2" fill="none" opacity="0.9">
       <path d="M84 269 C104 253 124 253 144 269 C164 285 184 285 204 269 C224 253 244 253 264 269 C284 285 304 285 316 273"/>
     </g>
     <g fill="#7C8B9C">${[100, 150, 200, 250, 300].map((x) => `<circle cx="${x}" cy="252" r="2.4"/>`).join('')}</g>
     <g fill="#7C8B9C">${[100, 150, 200, 250, 300].map((x) => `<circle cx="${x}" cy="286" r="2.4"/>`).join('')}</g>`
  );
}

function scarf({ c1, c2, edge = 'gd' }) {
  const extra = grad('s1', [['0', '#FFFFFF'], ['0.5', c1], ['1', c2]], '0', '0', '0.7', '1');
  return svg(
    `${shadow(428, 140)}
     <path d="M84 176 C130 140 210 138 268 154 C312 166 330 196 322 238 C314 282 328 316 306 356 C284 396 240 416 196 410 C150 404 112 380 98 340 C84 300 70 230 84 176 Z" fill="url(#s1)"/>
     <g stroke="${c2}" stroke-width="3" fill="none" opacity="0.45" stroke-linecap="round">
       <path d="M150 212 C186 250 180 310 158 356"/><path d="M206 196 C232 252 226 316 202 368"/><path d="M256 208 C274 254 268 308 246 350"/>
     </g>
     <g stroke="#FFFFFF" stroke-width="5" fill="none" opacity="0.55" stroke-linecap="round">
       <path d="M138 224 C168 260 164 314 146 352"/><path d="M228 202 C248 252 244 310 224 356"/>
     </g>
     <path d="M84 176 C130 140 210 138 268 154" stroke="url(#${edge})" stroke-width="3.5" fill="none" stroke-linecap="round"/>
     <path d="M98 340 C112 380 150 404 196 410" stroke="url(#${edge})" stroke-width="3.5" fill="none" stroke-linecap="round"/>`,
    extra
  );
}

// ---------- כלי קידוש ----------
function goblet({ body = 'sv', h = 1, hammered = false, small = false }) {
  const s = small ? 0.72 : 1;
  const cy = small ? 60 : 0;
  const ham = hammered
    ? `<g fill="#FFFFFF" opacity="0.35">${Array.from({ length: 14 }, (_, i) => {
        const a = (i * 47) % 100;
        return `<circle cx="${160 + (a % 10) * 8}" cy="${170 + Math.floor(a / 10) * 12 + (i % 3) * 30}" r="5"/>`;
      }).join('')}</g>`
    : '';
  return svg(
    `${shadow(437, 105 * s)}
     <g transform="translate(${200 - 200 * s} ${cy}) scale(${s})">
     <path d="M124 140 C120 184 132 228 152 260 C168 286 182 296 194 298 L190 322 L186 400 L214 400 L210 322 L206 298 C218 296 232 286 248 260 C268 228 280 184 276 140 C252 152 226 157 200 157 C174 157 148 152 124 140 Z" fill="url(#${body})"/>
     ${ham}
     <ellipse cx="200" cy="332" rx="16" ry="11" fill="url(#${body})"/>
     <ellipse cx="200" cy="398" rx="42" ry="9" fill="url(#${body})"/>
     <ellipse cx="200" cy="408" rx="55" ry="11" fill="#DDE4EB"/>
     <ellipse cx="200" cy="420" rx="66" ry="13" fill="url(#${body})"/>
     <ellipse cx="200" cy="140" rx="76" ry="15" fill="url(#${body})"/>
     <ellipse cx="200" cy="141" rx="68" ry="11.5" fill="url(#gd)"/>
     <path d="M131 186 C154 198 176 203 200 203 C224 203 246 198 269 186 L269 204 C246 216 224 221 200 221 C176 221 154 216 131 204 Z" fill="url(#gd)"/>
     <path d="M150 158 C146 196 154 238 170 268" stroke="#FFFFFF" stroke-width="9" fill="none" opacity="0.55" stroke-linecap="round"/>
     </g>`
  );
}

function cupSet() {
  const cup = (x) =>
    `<g transform="translate(${x} 340)"><path d="M-16 0 C-16 26 -8 38 0 38 C8 38 16 26 16 0 Z" fill="url(#sv)"/><ellipse cx="0" cy="0" rx="16" ry="4.5" fill="#E8EDF3"/><ellipse cx="0" cy="42" rx="12" ry="3.5" fill="url(#sv)"/></g>`;
  return svg(
    `${shadow(432, 155)}
     <ellipse cx="200" cy="404" rx="150" ry="22" fill="url(#sv)"/><ellipse cx="200" cy="398" rx="136" ry="17" fill="#E8EDF3"/>
     <g transform="translate(0 -58) scale(0.62) translate(122 100)">
       <path d="M124 140 C120 184 132 228 152 260 C168 286 182 296 194 298 L190 322 L186 400 L214 400 L210 322 L206 298 C218 296 232 286 248 260 C268 228 280 184 276 140 C252 152 226 157 200 157 C174 157 148 152 124 140 Z" fill="url(#sv)"/>
       <ellipse cx="200" cy="140" rx="76" ry="15" fill="url(#sv)"/><ellipse cx="200" cy="141" rx="68" ry="11.5" fill="url(#gd)"/>
       <ellipse cx="200" cy="414" rx="60" ry="12" fill="url(#sv)"/>
     </g>
     ${[112, 156, 244, 288].map(cup).join('')}`
  );
}

function fountain() {
  const cup = (x, y) =>
    `<g transform="translate(${x} ${y})"><path d="M-13 0 C-13 20 -6 30 0 30 C6 30 13 20 13 0 Z" fill="url(#sv)"/><ellipse cx="0" cy="0" rx="13" ry="4" fill="#E8EDF3"/></g>`;
  return svg(
    `${shadow(430, 150)}
     <ellipse cx="200" cy="400" rx="152" ry="24" fill="url(#sv)"/><ellipse cx="200" cy="394" rx="138" ry="18" fill="#E8EDF3"/>
     <path d="M170 160 C166 200 176 224 188 234 L184 250 L182 292 L218 292 L216 250 L212 234 C224 224 234 200 230 160 C220 166 210 168 200 168 C190 168 180 166 170 160 Z" fill="url(#sv)"/>
     <ellipse cx="200" cy="160" rx="32" ry="8" fill="url(#sv)"/><ellipse cx="200" cy="161" rx="26" ry="5.5" fill="url(#gd)"/>
     <ellipse cx="200" cy="296" rx="40" ry="9" fill="url(#sv)"/>
     <g stroke="url(#sv)" stroke-width="5" fill="none">
       <path d="M172 240 C140 260 122 292 118 330"/><path d="M188 248 C168 272 158 300 156 336"/>
       <path d="M228 240 C260 260 278 292 282 330"/><path d="M212 248 C232 272 242 300 244 336"/>
     </g>
     ${cup(118, 336)}${cup(156, 342)}${cup(244, 342)}${cup(282, 336)}`
  );
}

// ---------- פמוטים ----------
function crystalSticks() {
  const extra = grad('cr', [['0', '#FFFFFF'], ['0.4', '#DCE8F2'], ['0.7', '#B9D0E4'], ['1', '#8FB0CC']], '0', '0', '1', '1');
  const stick = (x) =>
    `<g transform="translate(${x} 0)">
      <path d="M0 106 C-8 122 -6 136 0 142 C6 136 8 122 0 106 Z" fill="#F8C144"/><rect x="-7" y="146" width="14" height="60" rx="3" fill="#FBF7EC"/>
      <path d="M-16 206 L16 206 L10 232 L-10 232 Z" fill="url(#cr)" opacity="0.92"/>
      <path d="M-8 232 L8 232 L14 268 L-14 268 L-8 232 M-14 268 L-20 320 L20 320 L14 268" fill="url(#cr)" opacity="0.92"/>
      <path d="M-20 320 L20 320 L30 388 L-30 388 Z" fill="url(#cr)" opacity="0.92"/>
      <g stroke="#FFFFFF" stroke-width="2" opacity="0.8"><path d="M-8 240 L-14 316"/><path d="M8 240 L14 316"/><path d="M0 236 L0 318"/></g>
      <g stroke="#7FA0BE" stroke-width="1.4" opacity="0.6"><path d="M-16 330 L-24 382"/><path d="M16 330 L24 382"/></g>
      <ellipse cx="0" cy="390" rx="34" ry="8" fill="url(#cr)"/>
     </g>`;
  return svg(`${shadow(420, 150)}${stick(138)}${stick(262)}`, extra);
}

function travelSticks() {
  return svg(
    `${shadow(410, 130)}
     <rect x="96" y="330" width="208" height="52" rx="10" fill="url(#sv)"/>
     <rect x="104" y="338" width="192" height="36" rx="7" fill="#DDE4EB"/>
     <g transform="translate(150 0)"><path d="M0 196 C-7 210 -5 222 0 228 C5 222 7 210 0 196 Z" fill="#F8C144"/><rect x="-6" y="230" width="12" height="42" rx="3" fill="#FBF7EC"/><path d="M-18 272 L18 272 L12 300 L-12 300 Z" fill="url(#sv)"/><ellipse cx="0" cy="272" rx="18" ry="5" fill="#E8EDF3"/><rect x="-14" y="300" width="28" height="30" rx="4" fill="url(#sv)"/></g>
     <g transform="translate(250 0)"><path d="M0 196 C-7 210 -5 222 0 228 C5 222 7 210 0 196 Z" fill="#F8C144"/><rect x="-6" y="230" width="12" height="42" rx="3" fill="#FBF7EC"/><path d="M-18 272 L18 272 L12 300 L-12 300 Z" fill="url(#sv)"/><ellipse cx="0" cy="272" rx="18" ry="5" fill="#E8EDF3"/><rect x="-14" y="300" width="28" height="30" rx="4" fill="url(#sv)"/></g>
     <g stroke="url(#gd)" stroke-width="2" fill="none" stroke-linejoin="round"><path d="M200 344 L206 355 L194 355 Z"/><path d="M200 359 L194 348 L206 348 Z"/></g>`
  );
}

function girlStick() {
  const extra = grad('pk', [['0', '#F6D8E0'], ['0.5', '#E9B3C2'], ['1', '#C77F95']], '0', '0', '1', '1');
  return svg(
    `${shadow(420, 90)}
     <path d="M200 130 C191 148 193 164 200 171 C207 164 209 148 200 130 Z" fill="#F8C144"/>
     <rect x="192" y="175" width="16" height="60" rx="4" fill="#FBF7EC"/>
     <ellipse cx="200" cy="239" rx="24" ry="7" fill="url(#pk)"/>
     <path d="M194 244 C189 280 191 310 187 346 L213 346 C209 310 211 280 206 244 Z" fill="url(#pk)"/>
     <ellipse cx="200" cy="296" rx="15" ry="9" fill="url(#pk)"/>
     <path d="M170 398 C170 372 184 350 200 346 C216 350 230 372 230 398 Z" fill="url(#pk)"/>
     <ellipse cx="200" cy="400" rx="44" ry="11" fill="url(#pk)"/>
     <g fill="#FFFFFF" opacity="0.8"><circle cx="188" cy="290" r="2.5"/><circle cx="200" cy="284" r="2.5"/><circle cx="212" cy="290" r="2.5"/></g>
     <path d="M192 250 C190 290 192 320 190 342" stroke="#FFFFFF" stroke-width="4" opacity="0.6" fill="none" stroke-linecap="round"/>`,
    extra
  );
}

function candleTray() {
  const extra = grad('gl', [['0', '#EAF2F6'], ['0.5', '#CBDDE8'], ['1', '#A8C2D4']], '0', '0', '1', '1');
  return svg(
    `${shadow(420, 150)}
     <path d="M80 340 L320 340 L336 396 L64 396 Z" fill="url(#gl)" opacity="0.9"/>
     <path d="M80 340 L320 340 L324 352 L76 352 Z" fill="#FFFFFF" opacity="0.6"/>
     <g stroke="url(#gd)" stroke-width="2" fill="none" opacity="0.8"><path d="M92 386 h216"/></g>
     ${[150, 200, 250].map((x) => `<g transform="translate(${x} 0)"><path d="M0 208 C-7 222 -5 234 0 240 C5 234 7 222 0 208 Z" fill="#F8C144"/><rect x="-7" y="242" width="14" height="70" rx="3" fill="#FBF7EC"/><ellipse cx="0" cy="316" rx="17" ry="5" fill="url(#gl)"/><path d="M-15 318 L15 318 L11 338 L-11 338 Z" fill="url(#gl)"/></g>`).join('')}`,
    extra
  );
}

// ---------- מזוזות ----------
function mezuzahVariant({ palette, shape = 'modern' }) {
  const [a, b, c] = palette;
  const extra = grad('mz', [['0', a], ['0.5', b], ['1', c]], '0', '0', '1', '0');
  const body =
    shape === 'stone'
      ? `<rect x="168" y="100" width="64" height="290" rx="8" fill="url(#mz)"/>
         <g fill="#FFFFFF" opacity="0.25">${Array.from({ length: 10 }, (_, i) => `<circle cx="${176 + ((i * 31) % 48)}" cy="${120 + i * 26}" r="${2 + (i % 3)}"/>`).join('')}</g>
         <rect x="180" y="128" width="40" height="234" rx="5" fill="#FFFFFF" opacity="0.14"/>`
      : shape === 'ceramic'
        ? `<rect x="166" y="104" width="68" height="284" rx="30" fill="url(#mz)"/>
           <g fill="#FFFFFF" opacity="0.7"><circle cx="200" cy="150" r="7"/><circle cx="184" cy="188" r="5"/><circle cx="216" cy="188" r="5"/><circle cx="200" cy="330" r="7"/><circle cx="184" cy="294" r="5"/><circle cx="216" cy="294" r="5"/></g>
           <path d="M182 220 C192 210 208 210 218 220 C208 232 192 232 182 220 Z" fill="#FFFFFF" opacity="0.85"/>`
        : `<rect x="172" y="96" width="56" height="296" rx="14" fill="url(#mz)"/>
           <rect x="180" y="108" width="10" height="272" rx="5" fill="#FFFFFF" opacity="0.35"/>`;
  return svg(
    `${shadow(434, 110)}
     <g transform="rotate(7 200 250)">
       ${body}
       <text x="200" y="184" text-anchor="middle" font-family="'Frank Ruhl Libre','Times New Roman',serif" font-size="42" font-weight="700" fill="${shape === 'ceramic' ? '#FFFFFF' : '#1B2032'}">ש</text>
       <circle cx="200" cy="106" r="4" fill="#5A5F6B"/><circle cx="200" cy="382" r="4" fill="#5A5F6B"/>
     </g>`,
    extra
  );
}

// ---------- חגים ----------
function honeyDish() {
  const extra = grad('ap', [['0', '#FCEBD8'], ['0.5', '#F3C98F'], ['1', '#D89A4C']], '0', '0', '0.8', '1');
  return svg(
    `${shadow(424, 120)}
     <ellipse cx="200" cy="398" rx="105" ry="16" fill="url(#sv)"/>
     <path d="M118 300 C114 258 142 226 200 226 C258 226 286 258 282 300 C278 348 250 380 200 380 C150 380 122 348 118 300 Z" fill="url(#ap)"/>
     <path d="M186 226 C186 210 192 200 200 194 C208 200 214 210 214 226 Z" fill="#7A9B4E"/>
     <path d="M200 196 C206 186 216 182 226 184 C222 194 212 199 200 196 Z" fill="#5E7C3A"/>
     <ellipse cx="200" cy="252" rx="52" ry="16" fill="#B9781F"/>
     <ellipse cx="200" cy="250" rx="46" ry="13" fill="#E8A93C"/>
     <ellipse cx="188" cy="247" rx="14" ry="5" fill="#F7CE7B" opacity="0.9"/>
     <g transform="rotate(-24 258 226)"><rect x="252" y="150" width="9" height="88" rx="4" fill="#C89A55"/><g stroke="#C89A55" stroke-width="5" stroke-linecap="round"><path d="M244 150 h26"/><path d="M242 140 h30"/><path d="M244 130 h26"/></g></g>
     <ellipse cx="156" cy="280" rx="20" ry="30" fill="#FFFFFF" opacity="0.28"/>`,
    extra
  );
}

function sederPlate() {
  const bowl = (x, y) =>
    `<ellipse cx="${x}" cy="${y}" rx="26" ry="12" fill="url(#sv)"/><ellipse cx="${x}" cy="${y - 2}" rx="20" ry="8" fill="#E8EDF3"/>`;
  return svg(
    `${shadow(420, 165)}
     <ellipse cx="200" cy="330" rx="165" ry="62" fill="url(#sv)"/>
     <ellipse cx="200" cy="324" rx="150" ry="53" fill="#E8EDF3"/>
     <ellipse cx="200" cy="322" rx="132" ry="45" fill="#F4F8FC"/>
     <g stroke="url(#gd)" stroke-width="2" fill="none"><ellipse cx="200" cy="322" rx="138" ry="48"/></g>
     ${bowl(200, 284)}${bowl(120, 306)}${bowl(280, 306)}${bowl(140, 348)}${bowl(260, 348)}${bowl(200, 362)}
     <g stroke="url(#gd)" stroke-width="1.8" fill="none" stroke-linejoin="round"><path d="M200 316 L207 328 L193 328 Z"/><path d="M200 332 L193 320 L207 320 Z"/></g>`
  );
}

// ---------- מארזים ----------
function giftBox({ box, ribbon, hint = '' }) {
  const extra = grad('bx', [['0', box[0]], ['1', box[1]]], '0', '0', '0.7', '1');
  return svg(
    `${shadow(426, 140)}
     ${hint}
     <rect x="104" y="240" width="192" height="160" rx="10" fill="url(#bx)"/>
     <rect x="96" y="208" width="208" height="46" rx="8" fill="url(#bx)" stroke="#00000022" stroke-width="1"/>
     <rect x="188" y="208" width="24" height="192" fill="${ribbon}"/>
     <rect x="96" y="224" width="208" height="12" fill="${ribbon}" opacity="0.9"/>
     <path d="M200 206 C178 178 148 180 146 198 C144 214 172 214 200 206 Z" fill="${ribbon}"/>
     <path d="M200 206 C222 178 252 180 254 198 C256 214 228 214 200 206 Z" fill="${ribbon}"/>
     <circle cx="200" cy="206" r="9" fill="${ribbon}" stroke="#00000022"/>
     <path d="M112 250 L112 392" stroke="#FFFFFF" stroke-width="5" opacity="0.25" stroke-linecap="round"/>`,
    extra
  );
}

// ---------- חתונה ----------
function breakingGlass() {
  const extra = grad('gl2', [['0', '#F2F7FA'], ['0.5', '#CFE0EA'], ['1', '#A9C4D6']], '0', '0', '1', '1');
  return svg(
    `${shadow(424, 140)}
     <g transform="translate(258 0)">
       <path d="M-40 180 C-40 232 -18 262 0 266 C18 262 40 232 40 180 Z" fill="url(#gl2)" opacity="0.85"/>
       <path d="M-2 266 L-4 340 L4 340 L2 266 Z" fill="url(#gl2)"/>
       <ellipse cx="0" cy="348" rx="30" ry="8" fill="url(#gl2)"/>
       <ellipse cx="0" cy="180" rx="40" ry="10" fill="#FFFFFF" opacity="0.7"/>
       <path d="M-24 196 C-26 222 -18 244 -8 254" stroke="#FFFFFF" stroke-width="4" fill="none" opacity="0.8" stroke-linecap="round"/>
     </g>
     <g transform="translate(128 0) rotate(-3 0 340)">
       <rect x="-64" y="230" width="128" height="150" rx="14" fill="#1F2E63"/>
       <path d="M-64 258 L64 258 L64 244 C24 224 -24 224 -64 244 Z" fill="#16224C"/>
       <g stroke="url(#gd)" stroke-width="2.4" fill="none" stroke-linejoin="round"><path d="M0 292 L20 326 L-20 326 Z"/><path d="M0 340 L-20 306 L20 306 Z"/></g>
       <path d="M-30 380 C-20 388 20 388 30 380" stroke="url(#gd)" stroke-width="2" fill="none"/>
       <circle cx="0" cy="244" r="6" fill="url(#gd)"/>
     </g>`,
    extra
  );
}

function ketubah() {
  return svg(
    `${shadow(430, 140)}
     <rect x="86" y="96" width="228" height="312" rx="6" fill="url(#gd)"/>
     <rect x="98" y="108" width="204" height="288" rx="4" fill="#FDFAF1"/>
     <path d="M120 168 A80 60 0 0 1 280 168 L280 180 A80 60 0 0 0 120 180 Z" fill="none" stroke="url(#gd)" stroke-width="3"/>
     <g stroke="url(#gd)" stroke-width="1.6" fill="none" opacity="0.85">
       <path d="M120 150 C140 128 172 118 200 118 C228 118 260 128 280 150"/>
       <circle cx="200" cy="140" r="10"/>
     </g>
     <g stroke="#B9A67E" stroke-width="2.4" stroke-linecap="round" opacity="0.9">
       ${Array.from({ length: 9 }, (_, i) => `<path d="M136 ${210 + i * 18} h${128 - (i % 3) * 20}"/>`).join('')}
     </g>
     <g stroke="url(#gd)" stroke-width="1.6" fill="none" opacity="0.8">
       <path d="M112 122 q-8 10 -2 22"/><path d="M288 122 q8 10 2 22"/>
       <path d="M112 382 q-8 -10 -2 -22"/><path d="M288 382 q8 -10 2 -22"/>
     </g>
     <g fill="url(#gd)"><circle cx="150" cy="376" r="4"/><circle cx="250" cy="376" r="4"/></g>`
  );
}

// ---------- אמנות ----------
function hamsaShape(fill, cx = 200, cy = 200, s = 1) {
  // חמסה קלאסית: 3 אצבעות מרכזיות, 2 אגודלים סימטריים, כף מעוגלת
  const cap = (x, y, w, h, rot = 0) =>
    `<rect x="${cx + (x - w / 2) * s}" y="${cy + y * s}" width="${w * s}" height="${h * s}" rx="${(w / 2) * s}" ${
      rot ? `transform="rotate(${rot} ${cx + x * s} ${cy + (y + h / 2) * s})"` : ''
    } fill="${fill}"/>`;
  return `
    ${cap(0, -64, 42, 136)}
    ${cap(-46, -46, 38, 118)}
    ${cap(46, -46, 38, 118)}
    ${cap(-90, 6, 34, 100, 32)}
    ${cap(90, 6, 34, 100, -32)}
    <path d="M${cx - 80 * s} ${cy + 42 * s} L${cx + 80 * s} ${cy + 42 * s}
             C${cx + 86 * s} ${cy + 104 * s} ${cx + 78 * s} ${cy + 152 * s} ${cx + 46 * s} ${cy + 178 * s}
             C${cx + 18 * s} ${cy + 198 * s} ${cx - 18 * s} ${cy + 198 * s} ${cx - 46 * s} ${cy + 178 * s}
             C${cx - 78 * s} ${cy + 152 * s} ${cx - 86 * s} ${cy + 104 * s} ${cx - 80 * s} ${cy + 42 * s} Z" fill="${fill}"/>`;
}

function hamsa({ metal = 'sv', deco = 'engraved' }) {
  const fill = deco === 'ceramic' ? '#3E85A8' : `url(#${metal})`;
  const inner =
    deco === 'ceramic'
      ? `<circle cx="200" cy="296" r="24" fill="#FFFFFF" opacity="0.92"/><circle cx="200" cy="296" r="11" fill="#2C6E8E"/><circle cx="200" cy="296" r="4" fill="#FFFFFF"/>
         <g stroke="#FFFFFF" stroke-width="2.5" fill="none" opacity="0.8"><path d="M158 258 C176 248 224 248 242 258"/><path d="M162 340 C182 352 218 352 238 340"/></g>
         <g fill="#FFFFFF" opacity="0.75"><circle cx="152" cy="300" r="4"/><circle cx="248" cy="300" r="4"/></g>`
      : `<circle cx="200" cy="296" r="19" fill="none" stroke="url(#gd)" stroke-width="2.6"/><circle cx="200" cy="296" r="7" fill="url(#gd)"/>
         <g stroke="#7C8B9C" stroke-width="2" fill="none" opacity="0.75"><path d="M160 256 C178 246 222 246 240 256"/><path d="M164 340 C184 352 216 352 236 340"/></g>
         <path d="M178 152 L178 190" stroke="#FFFFFF" stroke-width="4" opacity="0.55" stroke-linecap="round"/>`;
  return svg(
    `${shadow(430, 115)}
     <circle cx="200" cy="112" r="8" fill="none" stroke="url(#gd)" stroke-width="3"/>
     <path d="M200 120 L200 134" stroke="url(#gd)" stroke-width="3"/>
     ${hamsaShape(fill)}
     ${inner}`
  );
}

function wallArt() {
  return svg(
    `${shadow(432, 150)}
     <rect x="66" y="120" width="268" height="268" rx="4" fill="url(#gd)"/>
     <rect x="78" y="132" width="244" height="244" fill="#101A38"/>
     <g stroke="url(#gd)" stroke-width="2" fill="none" stroke-linejoin="round">
       <path d="M92 330 L92 296 L112 296 L112 276 L132 276 L132 306"/>
       <path d="M132 306 L132 266 L156 266 L156 246 L176 246 L176 286"/>
       <path d="M176 286 L176 236 A24 20 0 0 1 224 236 L224 286"/>
       <path d="M224 296 L224 256 L248 256 L248 276 L268 276 L268 306"/>
       <path d="M268 306 L268 286 L288 286 L288 316 L308 316 L308 330"/>
       <path d="M84 330 L316 330"/>
     </g>
     <circle cx="200" cy="196" r="14" fill="none" stroke="url(#gd)" stroke-width="2"/>
     <g fill="#F2DE9E" opacity="0.9"><circle cx="120" cy="170" r="1.6"/><circle cx="260" cy="158" r="1.6"/><circle cx="292" cy="196" r="1.6"/><circle cx="146" cy="200" r="1.6"/></g>
     <path d="M84 342 C140 352 260 352 316 342" stroke="url(#gd)" stroke-width="1.6" fill="none" opacity="0.7"/>`
  );
}

function textArtPrint({ frame = '#2E3A55', panel = '#FBF7EC' }) {
  return svg(
    `${shadow(430, 135)}
     <rect x="88" y="108" width="224" height="300" rx="5" fill="${frame}"/>
     <rect x="102" y="122" width="196" height="272" fill="${panel}"/>
     <g stroke="url(#gd)" stroke-width="1.6" fill="none" opacity="0.9"><rect x="112" y="132" width="176" height="252" rx="3"/></g>
     <path d="M160 172 C172 152 228 152 240 172" stroke="url(#gd)" stroke-width="2.4" fill="none"/>
     <circle cx="200" cy="160" r="8" fill="none" stroke="url(#gd)" stroke-width="2"/>
     <g stroke="#8A7A56" stroke-width="3" stroke-linecap="round" opacity="0.85">
       ${Array.from({ length: 6 }, (_, i) => `<path d="M${138 + (i % 2) * 14} ${212 + i * 24} h${124 - (i % 2) * 28}"/>`).join('')}
     </g>
     <g fill="url(#gd)"><circle cx="200" cy="360" r="3.4"/><circle cx="184" cy="360" r="2"/><circle cx="216" cy="360" r="2"/></g>`
  );
}

// ---------- תכשיטים ----------
function pendant({ shape, metal = 'sv', kids = false }) {
  const m = `url(#${metal})`;
  const stroke = metal === 'gd' ? '#8F6B1B' : '#6E7D8E';
  const shapes = {
    magen: `<g stroke="${m}" stroke-width="9" fill="none" stroke-linejoin="round"><path d="M200 216 L246 296 L154 296 Z"/><path d="M200 328 L154 248 L246 248 Z"/></g>`,
    chai: `<text x="200" y="316" text-anchor="middle" font-family="'Frank Ruhl Libre','Times New Roman',serif" font-size="104" font-weight="700" fill="${m}" stroke="${stroke}" stroke-width="1">חי</text>`,
    hamsa: `${hamsaShape(m, 200, 254, 0.42)}
            <circle cx="200" cy="294" r="8" fill="none" stroke="${metal === 'gd' ? '#8F6B1B' : '#5F6E80'}" stroke-width="2.2"/>`,
    jerusalem: `<circle cx="200" cy="272" r="58" fill="${m}"/><circle cx="200" cy="272" r="58" fill="none" stroke="${stroke}" stroke-width="1.6"/>
            <g stroke="${metal === 'gd' ? '#7A5B16' : '#5F6E80'}" stroke-width="2.4" fill="none" stroke-linejoin="round">
              <path d="M162 296 L162 278 L176 278 L176 266 L190 266 L190 288"/>
              <path d="M190 288 L190 258 A12 10 0 0 1 214 258 L214 288"/>
              <path d="M214 292 L214 272 L228 272 L228 282 L240 282 L240 296"/>
              <path d="M156 296 L244 296"/>
            </g>`,
  };
  const chainR = kids ? 118 : 148;
  return svg(
    `${shadow(400, 110)}
     <ellipse cx="200" cy="300" rx="150" ry="118" fill="#1F2E63" opacity="0.06" filter="url(#soft)"/>
     <path d="M${200 - chainR} 96 C${200 - chainR * 0.62} ${150} ${200 - 30} 186 200 196 C${200 + 30} 186 ${200 + chainR * 0.62} 150 ${200 + chainR} 96"
       stroke="${m}" stroke-width="5" fill="none" stroke-dasharray="7 4" stroke-linecap="round"/>
     <circle cx="200" cy="202" r="7" fill="none" stroke="${m}" stroke-width="4"/>
     ${shapes[shape]}`
  );
}

// ---------- סטים ----------
function barmitzvahSet() {
  return svg(
    `${shadow(430, 160)}
     <g transform="scale(0.62) translate(24 250)">
       <rect x="84" y="150" width="232" height="248" rx="18" fill="#1F2E63"/>
       <rect x="106" y="192" width="188" height="164" rx="12" fill="none" stroke="url(#gd)" stroke-width="3"/>
       <g stroke="url(#gd)" stroke-width="3.4" fill="none" stroke-linejoin="round"><path d="M200 240 L232 296 L168 296 Z"/><path d="M200 318 L168 262 L232 262 Z"/></g>
     </g>
     <g transform="scale(0.56) translate(310 180)">
       <rect x="62" y="148" width="276" height="118" rx="14" fill="#FBF9F2"/>
       <rect x="62" y="196" width="276" height="14" fill="#1B2032"/><rect x="62" y="216" width="276" height="6" fill="#1B2032"/>
       <rect x="110" y="158" width="180" height="24" rx="7" fill="url(#sv)"/>
       <rect x="62" y="266" width="276" height="70" rx="12" fill="#EFEBDD"/>
       <rect x="62" y="296" width="276" height="10" fill="#1B2032" opacity="0.9"/>
     </g>
     <g transform="scale(0.5) translate(420 420)">
       <path d="M146 210 L170 186 L266 186 L242 210 Z" fill="#33363F"/>
       <path d="M242 210 L266 186 L266 296 L242 320 Z" fill="#1A1C22"/>
       <rect x="146" y="210" width="96" height="110" rx="4" fill="#17181D"/>
     </g>
     <g stroke="url(#gd)" stroke-width="2" fill="none" opacity="0.7"><path d="M70 434 h260"/></g>`
  );
}

function brandedKippot() {
  const k = (x, y, c) =>
    `<g transform="translate(${x} ${y})"><path d="M-62 0 A62 50 0 0 1 62 0 Z" fill="${c}"/><path d="M-62 0 A62 12 0 0 0 62 0 L62 7 A62 12 0 0 1 -62 7 Z" fill="url(#gd)"/><circle cx="0" cy="-26" r="9" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.8"/></g>`;
  return svg(
    `${shadow(420, 150)}
     ${k(200, 390, '#1B2A5E')}${k(148, 344, '#3E2A78')}${k(252, 344, '#14324A')}${k(200, 298, '#571C2C')}
     <rect x="120" y="150" width="160" height="34" rx="17" fill="none" stroke="url(#gd)" stroke-width="2"/>
     <g fill="url(#gd)"><circle cx="152" cy="167" r="4"/><circle cx="200" cy="167" r="4"/><circle cx="248" cy="167" r="4"/></g>`
  );
}

// ============================================================
// רשימת הקבצים לייצור
// ============================================================
const NAVY = ['#3C4F8E', '#22315F', '#141D3C'];
const files = {
  // כיפות
  'kippah-velvet-black.svg': kippah({ dome: '#3A3A42', mid: '#232329', deep: '#101014', pattern: 'plain' }),
  'kippah-satin-white.svg': kippah({ dome: '#FFFFFF', mid: '#EFEAE0', deep: '#D6CEBC', pattern: 'plain', band: 'sv' }),
  'kippah-suede-navy.svg': kippah({ dome: '#2E4266', mid: '#22344F', deep: '#15202F', pattern: 'plain' }),
  'kippah-leather-brown.svg': kippah({ dome: '#8A5A2E', mid: '#63401F', deep: '#3E2712', pattern: 'plain' }),
  'kippah-kids-colorful.svg': kippah({ dome: '#3E85A8', mid: '#2C6E8E', deep: '#1B4B63', pattern: 'diamonds', band: 'gd' }),
  'kippah-breslev-white.svg': kippah({ dome: '#FDFDFB', mid: '#EEEAE0', deep: '#D8D2C2', pattern: 'rings', band: 'sv', scale: 1.08 }),
  'kippot-event-branded.svg': brandedKippot(),
  // טליתות
  'tallit-acrylic-blue.svg': tallitVariant({ stripe: '#28457E', stripe2: '#D4AF37' }),
  'tallit-kids.svg': tallitVariant({ stripe: '#3E85A8', stripe2: '#7A9B4E', atara: 'gd', accentW: 9 }),
  'tallit-premium-light.svg': tallitVariant({ stripe: '#C6B173', stripe2: '#8F6B1B', atara: 'gd' }),
  'tzitzit-katan.svg': tzitzitKatan(),
  'atara-silver.svg': ataraOnly(),
  // מטפחות
  'scarf-cotton.svg': scarf({ c1: '#DCE6EE', c2: '#9FB6C9', edge: 'sv' }),
  'scarf-satin-blush.svg': scarf({ c1: '#F3DCE2', c2: '#D8A9B8' }),
  'scarf-handpainted.svg': scarf({ c1: '#E9E2F4', c2: '#A794C9' }),
  'scarf-giftbox.svg': giftBox({ box: ['#F6F2E8', '#DDD2B8'], ribbon: '#C77F95', hint: '<path d="M120 232 C150 208 250 208 280 232" stroke="#D8A9B8" stroke-width="14" fill="none" stroke-linecap="round"/>' }),
  // קידוש
  'kiddush-hammered.svg': goblet({ hammered: true }),
  'kiddush-set-cups.svg': cupSet(),
  'eliyahu-cup.svg': goblet({ body: 'gd' }),
  'kiddush-kids.svg': goblet({ small: true }),
  'wine-fountain.svg': fountain(),
  // פמוטים
  'candlesticks-crystal.svg': crystalSticks(),
  'candlesticks-travel.svg': travelSticks(),
  'candlestick-girl.svg': girlStick(),
  'candle-tray.svg': candleTray(),
  // בית
  'mezuzah-aluminum.svg': mezuzahVariant({ palette: ['#B9C4D2', '#8E9CAC', '#5F6E80'] }),
  'mezuzah-stone.svg': mezuzahVariant({ palette: ['#D9CDB4', '#C2B296', '#9C8B6C'], shape: 'stone' }),
  'mezuzah-ceramic-kids.svg': mezuzahVariant({ palette: ['#5FA8C7', '#3E85A8', '#2C6E8E'], shape: 'ceramic' }),
  'honey-dish.svg': honeyDish(),
  'seder-plate.svg': sederPlate(),
  // מתנות ומארזים
  'gift-new-home.svg': giftBox({ box: ['#26356B', '#141F49'], ribbon: '#D4AF37' }),
  'gift-baby.svg': giftBox({ box: ['#FBF7EC', '#E4D9C2'], ribbon: '#9FB6C9' }),
  'gift-hostess.svg': giftBox({ box: ['#F3E6D8', '#D9BF9E'], ribbon: '#8F6B1B', hint: '<circle cx="200" cy="216" r="34" fill="#E8A93C" opacity="0.35"/>' }),
  'barmitzvah-set.svg': barmitzvahSet(),
  'breaking-glass.svg': breakingGlass(),
  'ketubah.svg': ketubah(),
  // אמנות
  'birkat-habait.svg': textArtPrint({}),
  'jerusalem-wall-art.svg': wallArt(),
  'hamsa-ceramic.svg': hamsa({ deco: 'ceramic' }),
  'hamsa-silver.svg': hamsa({}),
  'psukim-print.svg': textArtPrint({ frame: '#8A5A2E', panel: '#FDFAF1' }),
  'shema-glass.svg': textArtPrint({ frame: '#101A38', panel: '#E9EFF5' }),
  // תכשיטים
  'necklace-magen-silver.svg': pendant({ shape: 'magen' }),
  'necklace-chai-gold.svg': pendant({ shape: 'chai', metal: 'gd' }),
  'bracelet-hamsa.svg': pendant({ shape: 'hamsa' }),
  'pendant-jerusalem.svg': pendant({ shape: 'jerusalem', metal: 'gd' }),
  'necklace-magen-men.svg': pendant({ shape: 'magen', metal: 'gd' }),
  'necklace-kids.svg': pendant({ shape: 'hamsa', metal: 'gd', kids: true }),
};

let count = 0;
for (const [name, content] of Object.entries(files)) {
  writeFileSync(join(OUT, name), content.trim() + '\n');
  count++;
}
console.log(`✓ Generated ${count} product images in ${OUT}`);
