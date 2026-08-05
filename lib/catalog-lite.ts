// ============================================================
// lib/catalog-lite.ts — שכבת קטלוג רזה לצד-לקוח.
//
// צורך את lib/search-index.json (הקרנה רזה של PRODUCTS, נוצר ב-prebuild ע"י
// scripts/gen-search-index.cjs) — רק השדות שחיפוש / מאתר-מתנה / כרטיס-מוצר /
// QuickView צריכים. כך קומפוננטות לקוח לא גוררות את קוד ההעשרה הכבד של
// lib/catalog.ts (תיאורים ארוכים, גלריות, FAQ, קונפיגורציות התאמה) ל-bundle.
//
// ⚠️ מקור אמת נשאר lib/catalog.ts (PRODUCTS). כאן רק תמונת-מראה רזה שנגזרת ממנו
// אוטומטית בכל build — אין לערוך את search-index.json ידנית.
// ============================================================

import indexData from '@/lib/search-index.json';
import {
  CATEGORIES,
  getCategory,
  type Audience,
  type StockStatus,
  type ProductBadge,
} from '@/lib/catalog-constants';
import type { ProductCardData } from '@/types';

export interface LiteVariantOption {
  id: string;
  label: string;
  hex?: string;
}
export interface LiteVariantGroup {
  id: string;
  label: string;
  options: LiteVariantOption[];
}

// כל השדות שהלקוח צורך — מקביל ל-CatalogProduct אך בלי התוכן הכבד.
export interface LiteProduct extends ProductCardData {
  sku: string;
  shortDescription: string;
  tags: string[];
  stockStatus: StockStatus;
  badges: ProductBadge[];
  hasCustomization: boolean;
  subcategory?: string;
  priceType?: 'fixed' | 'from' | 'quote';
  prepTimeDays?: [number, number];
  audience?: Audience[];
  occasions?: string[];
  variantGroups?: LiteVariantGroup[];
}

// cast דרך unknown — ה-JSON נטען עם טיפוסים רחבים (string במקום ה-unions); המבנה
// מובטח ע"י הגנרטור (scripts/gen-search-index.cjs) שנגזר מ-CatalogProduct.
export const LITE_PRODUCTS: LiteProduct[] = (indexData as unknown as { items: LiteProduct[] }).items;

const BY_SLUG = new Map(LITE_PRODUCTS.map((p) => [p.slug, p]));

export const getLiteProduct = (slug: string): LiteProduct | undefined => BY_SLUG.get(slug);

// תת-קטגוריות בפועל בקטגוריה (לפי שם עברי) — מזין את תפריט הניווט.
export const getSubcategories = (categorySlug: string): string[] => {
  const cat = getCategory(categorySlug);
  if (!cat) return [];
  const set = new Set<string>();
  for (const p of LITE_PRODUCTS) {
    if (p.category === cat.nameHe && p.subcategory) set.add(p.subcategory);
  }
  return Array.from(set);
};

// קטגוריות פעילות בלבד — כאלה שיש בהן מוצרים (מסתיר קטגוריות ריקות מהניווט).
export const ACTIVE_CATEGORIES = CATEGORIES.filter((c) =>
  LITE_PRODUCTS.some((p) => p.category === c.nameHe)
);

// ---------- חיפוש חכם בעברית (הועבר מ-lib/search.ts, רץ על האינדקס הרזה) ----------

/** נירמול עברית: הסרת ניקוד, אותיות סופיות, גרשיים ורווחים כפולים */
export function normalizeHebrew(s: string): string {
  return s
    .replace(/[֑-ׇ]/g, '') // ניקוד וטעמים
    .replace(/[ך]/g, 'כ')
    .replace(/[ם]/g, 'מ')
    .replace(/[ן]/g, 'נ')
    .replace(/[ף]/g, 'פ')
    .replace(/[ץ]/g, 'צ')
    .replace(/["'׳״]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/** מרחק לוינשטיין קצר — מספיק לטעות הקלדה אחת במילה */
function editDistance(a: string, b: string, max = 2): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  const dp = Array.from({ length: a.length + 1 }, (_, i) => i);
  for (let j = 1; j <= b.length; j++) {
    let prev = dp[0];
    dp[0] = j;
    for (let i = 1; i <= a.length; i++) {
      const tmp = dp[i];
      dp[i] = Math.min(dp[i] + 1, dp[i - 1] + 1, prev + (a[i - 1] === b[j - 1] ? 0 : 1));
      prev = tmp;
    }
  }
  return dp[a.length];
}

function tokenScore(token: string, haystackWords: string[]): number {
  for (const w of haystackWords) {
    if (w.includes(token)) return 1; // התאמה מלאה / חלקית
  }
  if (token.length >= 3) {
    for (const w of haystackWords) {
      if (editDistance(token, w, 1) <= 1) return 0.7; // שגיאת כתיב אחת
    }
  }
  return 0;
}

export interface SearchResult {
  product: LiteProduct;
  score: number;
}

export function searchCatalog(query: string, limit = 8): SearchResult[] {
  const q = normalizeHebrew(query);
  if (!q) return [];
  const tokens = q.split(' ').filter((t) => t.length > 1);
  if (tokens.length === 0) return [];

  // חילוץ תקציב: "עד 500" / "עד ₪500"
  const budgetMatch = q.match(/עד\s*₪?\s*([\d,]+)/);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, '')) : null;
  const searchTokens = tokens.filter(
    (t) => !/^\d+$/.test(t) && t !== 'עד' && t !== 'שקלים' && t !== 'שח'
  );

  return LITE_PRODUCTS.map((product) => {
    const corpus = normalizeHebrew(
      [
        product.titleHe,
        product.category,
        product.subcategory ?? '',
        product.material ?? '',
        product.shortDescription,
        ...(product.occasions ?? []),
        ...product.tags,
      ].join(' ')
    ).split(' ');
    const score =
      searchTokens.reduce((s, t) => s + tokenScore(t, corpus), 0) / Math.max(searchTokens.length, 1);
    return { product, score };
  })
    .filter(({ product, score }) => {
      const price = product.discountPrice ?? product.basePrice;
      return score > 0.3 && (budget === null || price <= budget);
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
