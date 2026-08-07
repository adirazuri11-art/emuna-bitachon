// בדיקות תקינות לקטגוריית הכיפות — variants, מידות, תמחור, תמונות, כפילויות.
// מריצים ב-node --test. משכפל את לוגיקת הקיבוץ של lib/kippah-variants.ts (נשמר מסונכרן).
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const data = JSON.parse(fs.readFileSync('lib/supplier-products.json', 'utf8'));
const kippot = data.items.filter((i) => i.c === 'kippot');
const IMG_DIR = 'public/images/supplier-real';

function sizeOf(it) {
  if (it.sz && /^\d/.test(String(it.sz))) return String(it.sz);
  let m = String(it.t).match(/(\d+(?:\.\d+)?)\s*ס["״]?מ/);
  if (m) return m[1];
  m = String(it.t).match(/גודל\s*(\d+)/);
  if (m) return m[1];
  return null;
}
const unitOf = (it) => { const s = sizeOf(it); return s ? (parseFloat(s) >= 10 ? 'cm' : 'grade') : 'none'; };
function baseName(it) {
  let t = String(it.t).replace(/\d+(?:\.\d+)?\s*ס["״]?מ/g, '').replace(/(גודל|מידה)\s*\d+/g, '');
  if (it.sz) t = t.split(it.sz).join('');
  return t.replace(/\.{2,}|…/g, '').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').replace(/[–\-]+\s*$/, '').replace(/["״]\s*$/, '').trim();
}
function retail(cost) {
  const mult = cost <= 25 ? 2.4 : cost <= 80 ? 2.3 : 2.25;
  let p = cost * mult;
  if (p < 30) p = Math.round(p); else if (p < 100) p = Math.round(p / 5) * 5 - 1; else p = Math.round(p / 10) * 10 - 1;
  return Math.max(1, Math.round(p));
}
function groups() {
  const g = new Map();
  for (const it of kippot) {
    const key = [baseName(it), it.mat ?? '', it.col ?? '', it.s ?? '', unitOf(it)].join('|');
    (g.get(key) ?? g.set(key, []).get(key)).push(it);
  }
  // multi-size confident groups (all have unique sizes)
  const variantGroups = [];
  for (const items of g.values()) {
    if (items.length < 2) continue;
    const ws = items.map((it) => ({ it, size: sizeOf(it) })).filter((x) => x.size);
    if (ws.length !== items.length) continue;
    if (new Set(ws.map((x) => x.size)).size !== items.length) continue;
    variantGroups.push(ws);
  }
  return variantGroups;
}

test('no SKU is duplicated in the catalog', () => {
  const ids = data.items.map((i) => i.id.toUpperCase());
  assert.equal(new Set(ids).size, ids.length, 'duplicate SKU ids found');
});

test('cm (>=10) and grade (<10) size numbers never collide within a group', () => {
  // דגם יכול לכלול גם ס"מ וגם גודל (מוצגים בבוררים נפרדים), אך המספרים לא חופפים
  // כדי שבחירת מידה (לפי מספר) תישאר חד-משמעית.
  for (const ws of groups()) {
    const cm = ws.filter((x) => parseFloat(x.size) >= 10).map((x) => x.size);
    const gr = ws.filter((x) => parseFloat(x.size) < 10).map((x) => x.size);
    const overlap = cm.filter((s) => gr.includes(s));
    assert.deepEqual(overlap, [], `size number collision in ${baseName(ws[0].it)}`);
  }
});

test('every variant group has unique sizes and >=2 sizes', () => {
  for (const ws of groups()) {
    const sizes = ws.map((x) => x.size);
    assert.ok(sizes.length >= 2);
    assert.equal(new Set(sizes).size, sizes.length, `dup size in ${baseName(ws[0].it)}`);
  }
});

test('every kippah SKU that has a size has a local product image', () => {
  const missing = [];
  for (const it of kippot) {
    if (!sizeOf(it)) continue;
    if (!fs.existsSync(path.join(IMG_DIR, `${it.id}.jpg`))) missing.push(it.id);
  }
  assert.deepEqual(missing, [], `missing images: ${missing.join(', ')}`);
});

test('pricing rule (retail) is applied correctly', () => {
  assert.equal(retail(7.99), 19);
  assert.equal(retail(11.99), 29);
  assert.equal(retail(19.99), 49);
  assert.equal(retail(2.69), 6);
  assert.equal(retail(99.99), 219); // 99.99*2.25=224.98 → round(22.498)*10-1 = 219
});

test('all kippot have a positive supplier cost', () => {
  const bad = kippot.filter((i) => !(Number(i.cost) > 0)).map((i) => i.id);
  assert.deepEqual(bad, [], `kippot without valid cost: ${bad.join(', ')}`);
});
