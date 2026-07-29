import { NextResponse } from 'next/server';
import { mockProducts } from '@/lib/mock-data';

/**
 * חיפוש חכם — סמנטי + ויזואלי.
 *
 * ארכיטקטורת הייצור:
 * 1. embedding לשאילתה (Voyage / OpenAI text-embedding-3) —
 *    או לתמונה שהועלתה (Claude vision מתאר את הפריט ואז embedding לתיאור).
 * 2. שאילתת pgvector על עמודת Product.embedding:
 *    SELECT * FROM "Product" ORDER BY embedding <=> $1 LIMIT 12;
 * 3. סינון לפי אילוצים שחולצו מהשאילתה (תקציב, חומר, קטגוריה).
 * 4. רישום ב-AIInteraction + Recommendation למעקב המרות.
 *
 * כרגע (עד חיבור DB + מפתחות): fallback של התאמת מילות מפתח + חילוץ תקציב.
 */

export async function POST(req: Request) {
  const { query } = (await req.json()) as { query?: string; imageBase64?: string };

  if (!query?.trim()) {
    return NextResponse.json({ error: 'query is required' }, { status: 400 });
  }

  // חילוץ תקציב משאילתה טבעית: "עד 500 שקלים" / "עד ₪500"
  const budgetMatch = query.match(/עד\s*₪?\s*([\d,]+)/);
  const budget = budgetMatch ? Number(budgetMatch[1].replace(/,/g, '')) : null;

  const tokens = query
    .replace(/[^֐-׿a-zA-Z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 1);

  const results = mockProducts
    .map((p) => {
      const haystack = `${p.titleHe} ${p.category} ${p.material ?? ''}`;
      const score =
        tokens.filter((t) => haystack.includes(t)).length / Math.max(tokens.length, 1);
      return { product: p, score };
    })
    .filter(({ product, score }) => {
      const price = product.discountPrice ?? product.basePrice;
      return score > 0 && (budget === null || price <= budget);
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

  return NextResponse.json({
    query,
    budget,
    engine: 'keyword-fallback', // יוחלף ל-'semantic' עם pgvector
    results,
  });
}
