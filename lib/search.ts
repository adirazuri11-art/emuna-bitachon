// ============================================================
// lib/search.ts — חיפוש חכם בעברית עם סובלנות לשגיאות כתיב קלות
// רץ בצד לקוח על הקטלוג — מהיר, בלי תלות בשרת.
// ============================================================

import { PRODUCTS, type CatalogProduct } from '@/lib/catalog';

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
  product: CatalogProduct;
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
  const searchTokens = tokens.filter((t) => !/^\d+$/.test(t) && t !== 'עד' && t !== 'שקלים' && t !== 'שח');

  return PRODUCTS.map((product) => {
    const corpus = normalizeHebrew(
      [product.titleHe, product.category, product.material ?? '', product.shortDescription, ...product.tags].join(' ')
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
