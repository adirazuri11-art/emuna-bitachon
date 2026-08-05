// ============================================================
// POST /api/gift-finder/recommend — המלצות מתנה מבוססות AI (ציבורי).
// Rate-limited. נכשל בחן → { ok:false } וה-client נופל חזרה ל-rule-based.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { recommendGifts, type GiftQuery } from '@/lib/gift-ai';

export const runtime = 'nodejs';
export const maxDuration = 30;

// Rate limit: 8 בקשות/דקה ל-IP (הקריאה ל-AI יקרה).
const hits = new Map<string, { n: number; reset: number }>();
function limited(ip: string): boolean {
  const now = Date.now();
  const e = hits.get(ip);
  if (!e || now > e.reset) {
    hits.set(ip, { n: 1, reset: now + 60_000 });
    return false;
  }
  if (e.n >= 8) return true;
  e.n++;
  return false;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || req.headers.get('x-real-ip') || 'unknown';
  if (limited(ip)) {
    return NextResponse.json({ ok: false, error: 'rate' }, { status: 429 });
  }

  const body = await req.json().catch(() => ({}));
  const q: GiftQuery = {
    audience: typeof body.audience === 'string' ? body.audience.slice(0, 20) : null,
    occasion: typeof body.occasion === 'string' ? body.occasion.slice(0, 40) : null,
    budgetMin: Number.isFinite(body.budgetMin) ? Number(body.budgetMin) : 0,
    budgetMax: Number.isFinite(body.budgetMax) ? Number(body.budgetMax) : Infinity,
    freeText: typeof body.freeText === 'string' ? body.freeText.slice(0, 400) : '',
  };

  const result = await recommendGifts(q);
  return NextResponse.json(result);
}
