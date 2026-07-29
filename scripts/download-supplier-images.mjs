// ============================================================
// מוריד את תמונות המוצר האמיתיות מארט יודאיקה (לקוח מורשה).
// תבנית: israel-judaica.com/big/<מספר מק"ט>.jpg
// שומר ל-public/images/supplier-real/<SKU>.jpg
// הרצה: node scripts/download-supplier-images.mjs
// ============================================================
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const OUT = join(ROOT, 'public/images/supplier-real');
mkdirSync(OUT, { recursive: true });

const { items } = JSON.parse(readFileSync(join(ROOT, 'lib/supplier-products.json'), 'utf8'));

const HEADERS = {
  Referer: 'https://www.israel-judaica.com/',
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
};

async function tryDownload(num) {
  const url = `https://www.israel-judaica.com/big/${num}.jpg`;
  const res = await fetch(url, { headers: HEADERS });
  if (res.ok && (res.headers.get('content-type') || '').includes('image')) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 800) return buf; // מסנן תמונות "אין תמונה" זעירות
  }
  return null;
}

const ok = [];
const failed = [];

for (const it of items) {
  const dest = join(OUT, `${it.id}.jpg`);
  if (existsSync(dest)) { ok.push(it.id); continue; }
  const numRaw = it.id.replace(/^UK/i, '');
  let buf = null;
  try { buf = await tryDownload(numRaw); } catch { /* retry below */ }
  if (!buf && /^0/.test(numRaw)) {
    try { buf = await tryDownload(String(parseInt(numRaw, 10))); } catch { /* ignore */ }
  }
  if (buf) { writeFileSync(dest, buf); ok.push(it.id); }
  else failed.push(it.id);
  await new Promise((r) => setTimeout(r, 60)); // עדין על השרת שלהם
}

writeFileSync(join(OUT, '_manifest.json'), JSON.stringify({ ok, failed }, null, 2));
console.log(`✓ Downloaded ${ok.length}/${items.length} real images. Failed: ${failed.length}`);
if (failed.length) console.log('Failed SKUs:', failed.join(', '));
