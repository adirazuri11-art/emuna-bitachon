// ============================================================
// CRM Instrumentation · Gift Finder session ingest
// POST /api/crm/gift-finder
//
// Persists one row per Gift Finder session (idempotent by sessionId) so the
// CRM / Gift Finder Optimization Agent can learn from real usage.
// Storage: Neon/Postgres via Prisma raw (public.gift_finder_sessions).
// Safety: additive only; never throws to break the caller.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const str = (v: unknown, max = 120): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

const idList = (v: unknown, maxItems = 24): string[] =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === 'string').map((x) => (x as string).slice(0, 80)).slice(0, maxItems)
    : [];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const sessionId = str(body?.sessionId, 64);
    if (!sessionId) return NextResponse.json({ ok: false, error: 'missing sessionId' }, { status: 400 });

    const action = str(body?.action, 16) ?? 'complete';

    if (action === 'click') {
      const productId = str(body?.productId, 80);
      if (!productId) return NextResponse.json({ ok: false }, { status: 400 });
      // הוספת מזהה מוצר שנלחץ (ייחודי) לסשן קיים — best-effort.
      await prisma.$executeRawUnsafe(
        `update public.gift_finder_sessions
         set clicked_product_ids = (
               select (array_agg(distinct e))[1:24]
               from unnest(clicked_product_ids || array[$2]::text[]) e ),
             updated_at = now()
         where session_id = $1`,
        sessionId,
        productId,
      );
      return NextResponse.json({ ok: true });
    }

    // action === 'complete' → upsert הסשן עם התשובות והתוצאות.
    const budgetMax =
      typeof body?.budgetMax === 'number' && isFinite(body.budgetMax) ? body.budgetMax : null;
    const wantCustom = typeof body?.wantCustom === 'boolean' ? body.wantCustom : null;
    const resultsCount =
      typeof body?.resultsCount === 'number' ? Math.max(0, Math.min(99, body.resultsCount)) : 0;

    await prisma.$executeRawUnsafe(
      `insert into public.gift_finder_sessions
         (session_id, anonymous_id, customer_email, audience, occasion, budget_id, budget_max,
          want_custom, results_count, recommended_product_ids, recommended_categories, source, user_agent)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10::text[],$11::text[],'website',$12)
       on conflict (session_id) do update set
         anonymous_id = excluded.anonymous_id,
         customer_email = excluded.customer_email,
         audience = excluded.audience,
         occasion = excluded.occasion,
         budget_id = excluded.budget_id,
         budget_max = excluded.budget_max,
         want_custom = excluded.want_custom,
         results_count = excluded.results_count,
         recommended_product_ids = excluded.recommended_product_ids,
         recommended_categories = excluded.recommended_categories,
         updated_at = now()`,
      sessionId,
      str(body?.anonymousId, 64),
      str(body?.email, 160),
      str(body?.audience, 32),
      str(body?.occasion, 48),
      str(body?.budgetId, 16),
      budgetMax,
      wantCustom,
      resultsCount,
      idList(body?.recommendedProductIds),
      idList(body?.recommendedCategories, 12),
      str(request.headers.get('user-agent'), 200),
    );
    return NextResponse.json({ ok: true });
  } catch {
    // אף פעם לא שוברים את האתר בגלל אינסטרומנטציה.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
