// ============================================================
// מערכת Variants לכיפות — מקבצת מוצרי-מידה של אותו דגם למוצר ראשי אחד.
// קיבוץ שמרני: מאחד רק כשהשם-בסיס + חומר + צבע + תת-קטגוריה זהים, וההבדל
// היחיד הוא מידה אמיתית (sz או "NN ס\"מ"/"גודל N" בשם). לא-ודאי → נשאר נפרד.
// server/build-time; נגזר מ-supplier-products.json (מקור המוצרים).
// ⚠️ Variants בלבד — לא נוגע במחירים/תמונות/מלאי מעבר לקיבוץ תצוגה.
// ============================================================

import supplierData from '@/lib/supplier-products.json';

interface RawItem {
  id: string; t: string; cost: number; sz?: string; col?: string; mat?: string;
  c: string; s: string; img?: string; imgFull?: string; pk?: number;
}
const RAW = (supplierData as { items: RawItem[] }).items;

// חוק תמחור זהה ל-catalog-supplier (retail). מקור אמת יחיד לתמחור וריאנט.
function retail(cost: number): number {
  const mult = cost <= 25 ? 2.4 : cost <= 80 ? 2.3 : 2.25;
  let p = cost * mult;
  if (p < 30) p = Math.round(p);
  else if (p < 100) p = Math.round(p / 5) * 5 - 1;
  else p = Math.round(p / 10) * 10 - 1;
  return Math.max(1, Math.round(p));
}

// חילוץ מידה: שדה sz, אחרת "NN ס\"מ" או "גודל N" מהשם.
function sizeOf(it: RawItem): string | null {
  if (it.sz && /^\d/.test(it.sz)) return it.sz;
  const cm = it.t.match(/(\d+(?:\.\d+)?)\s*ס["״]?מ/);
  if (cm) return cm[1];
  const g = it.t.match(/גודל\s*(\d+)/);
  if (g) return g[1];
  return null;
}

// שם-בסיס: הסרת מידה/גודל/ס"מ כדי לזהות דגם.
function baseName(it: RawItem): string {
  let t = it.t;
  t = t.replace(/\d+(?:\.\d+)?\s*ס["״]?מ/g, '');
  t = t.replace(/(גודל|מידה)\s*\d+/g, '');
  const sz = it.sz;
  if (sz) t = t.split(sz).join('');
  return t.replace(/\.{2,}|…/g, '').replace(/\(\s*\)/g, '').replace(/\s+/g, ' ').replace(/[–\-]+\s*$/, '').replace(/["״]\s*$/, '').trim();
}

// גודל → ס"מ — נגזר מנתוני ART עצמם (61 מוצרים שמציינים גם גודל וגם ס"מ בשם).
// רק ערכים ברורים ושכיחים; גודל 2 ו-7 הושמטו (נתוני ART לא חד-משמעיים). אין המצאה.
const GRADE_TO_CM: Record<string, number> = { '3': 19, '4': 20, '5': 21, '6': 22, '8': 24 };

export interface KippahVariant {
  code: string;        // supplierCode = SKU
  size: string;        // המידה (ס"מ או גודל)
  unit: 'cm' | 'grade'; // יחידת המידה
  diameterCm?: number; // קוטר בס"מ למידת "גודל" — מנתוני ART בלבד
  price: number;       // מחיר אתר (retail)
  cost: number;        // עלות ספק (לפני מע"מ)
  slug: string;        // ה-slug ההיסטורי (art-<code>) — לצורך 301
}
export interface KippahGroup {
  parentCode: string;      // הקוד הראשי (וריאנט מייצג)
  parentSlug: string;      // slug ראשי (נשמר יציב)
  baseName: string;        // שם הדגם (בלי מידה)
  material?: string;
  color?: string;
  subcategory: string;
  category: string;
  image: string;
  variants: KippahVariant[]; // ממוינות לפי מידה
}

const groupsByKey = new Map<string, RawItem[]>();
for (const it of RAW) {
  if (it.c !== 'kippot') continue;
  // אותו דגם (שם-בסיס+חומר+צבע) — כולל ס"מ וגם "גודל". בבורר הם מוצגים
  // בשתי קבוצות נפרדות ("בס"מ" / "גודל") כדי שלא תהיה קפיצה מבלבלת. אין חפיפת מספרים
  // בין המערכות (ס"מ 16–24, גודל 2–8) ולכן המידות נשארות ייחודיות.
  const key = [baseName(it), it.mat ?? '', it.col ?? '', it.s ?? ''].join('|');
  const arr = groupsByKey.get(key) ?? [];
  arr.push(it);
  groupsByKey.set(key, arr);
}

// בונים קבוצות וריאנט ודאיות בלבד.
export const KIPPAH_GROUPS: KippahGroup[] = [];
export const VARIANT_TO_PARENT = new Map<string, string>(); // childCode(UPPER) → parentSlug
const PARENT_CODES = new Set<string>();

for (const items of Array.from(groupsByKey.values())) {
  if (items.length < 2) continue;
  const withSize = items.map((it) => ({ it, size: sizeOf(it) })).filter((x) => x.size);
  const sizes = new Set(withSize.map((x) => x.size));
  // ודאי: לכל הפריטים יש מידה, והמידות ייחודיות (הבדל אמיתי במידה בלבד)
  if (withSize.length !== items.length || sizes.size !== items.length) continue;

  const sorted = withSize.sort((a, b) => parseFloat(a.size!) - parseFloat(b.size!));
  // מייצג = המידה האמצעית (יציב וסביר לאינדוקס), אחרת הראשון
  const rep = sorted[Math.floor(sorted.length / 2)].it;
  const first = items[0];
  const variants: KippahVariant[] = sorted.map(({ it, size }) => {
    const unit: 'cm' | 'grade' = parseFloat(size!) >= 10 ? 'cm' : 'grade';
    return {
      code: it.id,
      size: size!,
      unit,
      ...(unit === 'grade' && GRADE_TO_CM[size!] ? { diameterCm: GRADE_TO_CM[size!] } : {}),
      price: retail(it.cost),
      cost: it.cost,
      slug: `art-${it.id.toLowerCase()}`,
    };
  });
  const group: KippahGroup = {
    parentCode: rep.id,
    parentSlug: `art-${rep.id.toLowerCase()}`,
    baseName: baseName(first),
    material: first.mat,
    color: first.col,
    subcategory: first.s,
    category: 'כיפות',
    image: `/images/supplier-real/${rep.id}.jpg`,
    variants,
  };
  KIPPAH_GROUPS.push(group);
  PARENT_CODES.add(rep.id.toUpperCase());
  for (const v of variants) {
    if (v.code.toUpperCase() !== rep.id.toUpperCase()) VARIANT_TO_PARENT.set(v.code.toUpperCase(), group.parentSlug);
  }
}

// כל קודי-הבן שאינם הראשי (מוסתרים מהרשימה, מפנים 301 לראשי).
export const HIDDEN_VARIANT_CODES = new Set(
  KIPPAH_GROUPS.flatMap((g) => g.variants.map((v) => v.code.toUpperCase()).filter((c) => c !== g.parentCode.toUpperCase())),
);

export function isVariantParent(code: string): boolean {
  return PARENT_CODES.has(code.toUpperCase());
}
export function groupForParent(code: string): KippahGroup | undefined {
  return KIPPAH_GROUPS.find((g) => g.parentCode.toUpperCase() === code.toUpperCase());
}
