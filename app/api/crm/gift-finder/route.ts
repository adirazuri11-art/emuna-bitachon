// ============================================================
// CRM Instrumentation · Gift Finder session ingest
// POST /api/crm/gift-finder
//
// Persists one row per Gift Finder session (idempotent by sessionId) so the
// CRM / Gift Finder Optimization Agent can learn from real usage.
//
// Safety contract:
//  - Additive only: writes to the new gift_finder_sessions table, nothing else.
//  - Never throws to break the caller; misconfig/errors => quiet 200/503.
//  - Uses the server-only SUPABASE_SERVICE_ROLE_KEY (never exposed to client).
//  - Input validated + length-capped to resist abuse/injection.
// ============================================================

import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

const str = (v: unknown, max = 120): string | null =>
  typeof v === 'string' && v.trim() ? v.trim().slice(0, max) : null;

const idList = (v: unknown, maxItems = 24): string[] =>
  Array.isArray(v)
    ? v.filter((x) => typeof x === 'string').map((x) => (x as string).slice(0, 80)).slice(0, maxItems)
    : [];

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabase();
    // Misconfigured env → no-op success so the site is never affected.
    if (!supabase) return NextResponse.json({ ok: false, skipped: true }, { status: 200 });

    const body = await request.json().catch(() => null);
    const sessionId = str(body?.sessionId, 64);
    if (!sessionId) {
      return NextResponse.json({ ok: false, error: 'missing sessionId' }, { status: 400 });
    }

    const action = str(body?.action, 16) ?? 'complete';

    if (action === 'click') {
      // Append a clicked product id to the existing session (best-effort).
      const productId = str(body?.productId, 80);
      if (!productId) return NextResponse.json({ ok: false }, { status: 400 });
      const { data: existing } = await supabase
        .from('gift_finder_sessions')
        .select('clicked_product_ids')
        .eq('session_id', sessionId)
        .single();
      const merged = Array.from(
        new Set([...((existing?.clicked_product_ids as string[]) ?? []), productId]),
      ).slice(0, 24);
      await supabase
        .from('gift_finder_sessions')
        .update({ clicked_product_ids: merged, updated_at: new Date().toISOString() })
        .eq('session_id', sessionId);
      return NextResponse.json({ ok: true });
    }

    // action === 'complete' → upsert the session with answers + results.
    const row = {
      session_id: sessionId,
      anonymous_id: str(body?.anonymousId, 64),
      customer_email: str(body?.email, 160),
      audience: str(body?.audience, 32),
      occasion: str(body?.occasion, 48),
      budget_id: str(body?.budgetId, 16),
      budget_max:
        typeof body?.budgetMax === 'number' && isFinite(body.budgetMax) ? body.budgetMax : null,
      want_custom: typeof body?.wantCustom === 'boolean' ? body.wantCustom : null,
      results_count:
        typeof body?.resultsCount === 'number' ? Math.max(0, Math.min(99, body.resultsCount)) : 0,
      recommended_product_ids: idList(body?.recommendedProductIds),
      recommended_categories: idList(body?.recommendedCategories, 12),
      source: 'website',
      user_agent: str(request.headers.get('user-agent'), 200),
      updated_at: new Date().toISOString(),
    };

    const { error } = await supabase
      .from('gift_finder_sessions')
      .upsert(row, { onConflict: 'session_id' });

    if (error) {
      // Table not created yet, or transient DB error — do not surface to caller.
      return NextResponse.json({ ok: false, skipped: true }, { status: 200 });
    }
    return NextResponse.json({ ok: true });
  } catch {
    // Absolutely never break the site because of instrumentation.
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
