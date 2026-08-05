// POST /api/reviews — הגשת ביקורת מוצר (ציבורי, rate-limited). נכנסת כ-pending למודרציה ב-CRM.
import { NextRequest, NextResponse } from 'next/server';
import { createReview } from '@/lib/reviews';

export const runtime = 'nodejs';

const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.reset) { hits.set(ip, { n: 1, reset: now + 60_000 }); return false; }
  if (e.n >= 4) return true; // עד 4 ביקורות/דקה ל-IP
  e.n++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  if (limited(ip)) return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });

  const b = await req.json().catch(() => ({}));
  const res = await createReview({
    productSlug: String(b.productSlug ?? ''),
    productId: b.productId ? String(b.productId) : null,
    authorName: String(b.authorName ?? ''),
    rating: Number(b.rating),
    title: b.title ? String(b.title) : null,
    body: String(b.body ?? ''),
    email: b.email ? String(b.email) : null,
  });
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}
