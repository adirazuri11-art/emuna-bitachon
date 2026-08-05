// ============================================================
// CRM — API לניהול קופונים מותאמים. מוגן ב-isCrmAuthed בלבד.
//   GET    → רשימת קופונים + ביצועים
//   POST   → יצירת קופון { code, type, value, label?, expiresAt?, maxRedemptions? }
//   PATCH  → הפעלה/כיבוי { code, active }
//   DELETE → מחיקה { code }
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import {
  createPromoCoupon,
  listPromoCouponsWithPerf,
  setPromoActive,
  deletePromoCoupon,
} from '@/lib/crm/promotions';

export const dynamic = 'force-dynamic';

function guard(req: NextRequest) {
  return isCrmAuthed(req) ? null : NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
}

export async function GET(req: NextRequest) {
  // אבחון זמני (ללא חשיפת סודות) — יוסר אחרי איתור התקלה.
  if (new URL(req.url).searchParams.get('debug') === '1') {
    const key = process.env.CRM_ACCESS_KEY;
    const cookie = req.cookies.get('crm_session')?.value ?? null;
    return NextResponse.json({
      hasKey: !!key,
      keyLen: key ? key.length : 0,
      hasCookie: !!cookie,
      cookieLen: cookie ? cookie.length : 0,
      authed: isCrmAuthed(req),
    });
  }
  const bad = guard(req);
  if (bad) return bad;
  const coupons = await listPromoCouponsWithPerf();
  return NextResponse.json({ ok: true, coupons });
}

export async function POST(req: NextRequest) {
  const bad = guard(req);
  if (bad) return bad;
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const res = await createPromoCoupon({
    code: String(body.code ?? ''),
    type: body.type === 'fixed' ? 'fixed' : 'pct',
    value: Number(body.value ?? 0),
    label: body.label ? String(body.label) : undefined,
    expiresAt: body.expiresAt ? String(body.expiresAt) : null,
    maxRedemptions: body.maxRedemptions != null ? Number(body.maxRedemptions) : null,
  });
  return NextResponse.json(res, { status: res.ok ? 200 : 400 });
}

export async function PATCH(req: NextRequest) {
  const bad = guard(req);
  if (bad) return bad;
  let body: { code?: string; active?: boolean };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  if (!body.code) return NextResponse.json({ ok: false, error: 'missing code' }, { status: 400 });
  const ok = await setPromoActive(String(body.code), Boolean(body.active));
  return NextResponse.json({ ok });
}

export async function DELETE(req: NextRequest) {
  const bad = guard(req);
  if (bad) return bad;
  let body: { code?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  if (!body.code) return NextResponse.json({ ok: false, error: 'missing code' }, { status: 400 });
  const ok = await deletePromoCoupon(String(body.code));
  return NextResponse.json({ ok });
}
