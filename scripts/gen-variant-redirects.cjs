// ============================================================
// scripts/gen-variant-redirects.cjs
// מייצר את lib/variant-redirects.json — מיפוי 301/308 קבוע מכל slug של
// וריאנט-מידה שאוחד (הבן המוסתר) אל המוצר הראשי. מקור אמת יחיד:
// VARIANT_TO_PARENT (lib/kippah-variants) — נגזר מ-supplier-products.json.
//
// רץ כ-prebuild (ראה package.json) → הרשימה לעולם לא יוצאת-סנכרון: כל build
// מקמפל מחדש את kippah-variants ומקרין ממנו. אין רשימה ידנית.
//
// שלב 1 (חיצוני): tsc -p tsconfig.gen.json → .gen-build/**.js
// שלב 2 (כאן): טוענים את המפה המקומפלת דרך hook שממפה '@/…' ומקרינים.
//
// היעד: next.config.mjs צורך את הקובץ ב-redirects() → 308 אמיתי בקצה (SEO).
// ============================================================

const fs = require('fs');
const path = require('path');
const Module = require('module');

const ROOT = process.cwd();
const GEN = path.join(ROOT, '.gen-build');

// --- hook: ממפה ייבוא '@/…' אל הפלט המקומפל (JS) או אל קובץ המקור (JSON) ---
const origResolve = Module._resolveFilename;
Module._resolveFilename = function (request, ...rest) {
  if (request.startsWith('@/')) {
    const rel = request.slice(2);
    if (rel.endsWith('.json')) return path.join(ROOT, rel);
    const candidate = path.join(GEN, rel + '.js');
    if (fs.existsSync(candidate)) return candidate;
    const asDir = path.join(GEN, rel, 'index.js');
    if (fs.existsSync(asDir)) return asDir;
    return path.join(GEN, rel);
  }
  return origResolve.call(this, request, ...rest);
};

const compiled = path.join(GEN, 'lib', 'kippah-variants.js');
if (!fs.existsSync(compiled)) {
  console.error('[gen-variant-redirects] missing compiled module:', compiled);
  console.error('  run: tsc -p tsconfig.gen.json  first');
  process.exit(1);
}

const { VARIANT_TO_PARENT } = require(compiled);
if (!(VARIANT_TO_PARENT instanceof Map)) {
  console.error('[gen-variant-redirects] VARIANT_TO_PARENT is not a Map');
  process.exit(1);
}

// childCode(UPPER) → parentSlug(art-...) ⇒ 308 קבוע /product/art-<child> → /product/<parent>
const redirects = [];
for (const [childCode, parentSlug] of VARIANT_TO_PARENT.entries()) {
  const source = `/product/art-${String(childCode).toLowerCase()}`;
  const destination = `/product/${parentSlug}`;
  if (source === destination) continue; // בטיחות: לעולם לא ממפה לעצמו
  redirects.push({ source, destination, permanent: true });
}

const OUT = path.join(ROOT, 'lib', 'variant-redirects.json');
fs.writeFileSync(OUT, JSON.stringify(redirects, null, 0));
console.log(`[gen-variant-redirects] wrote ${redirects.length} redirects → lib/variant-redirects.json`);
