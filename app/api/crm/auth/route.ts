// ============================================================
// CRM access gate (milestone 1) — single shared passphrase.
// Not full RBAC/MFA (that's a later phase); a real, server-verified gate
// so the CRM (which shows customer data) is never public.
//
// The session cookie stores sha256(CRM_ACCESS_KEY). The key is server-only,
// so the cookie value cannot be forged without it. httpOnly => not readable
// by client JS. Middleware recomputes the same hash to verify.
// ============================================================

import { createHash } from 'crypto';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const COOKIE = 'crm_session';

function expectedToken(): string | null {
  const key = process.env.CRM_ACCESS_KEY;
  if (!key) return null;
  return createHash('sha256').update(key).digest('hex');
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const key = process.env.CRM_ACCESS_KEY;
  const token = expectedToken();

  if (!key || !token) {
    return NextResponse.json({ ok: false, error: 'CRM access not configured' }, { status: 503 });
  }
  if (typeof body?.password !== 'string' || body.password !== key) {
    return NextResponse.json({ ok: false, error: 'סיסמה שגויה' }, { status: 401 });
  }

  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, token, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 30, // 30 יום — פאנל אדמין, פחות ניתוקים מיותרים
  });
  return res;
}

// Logout
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.cookies.set(COOKIE, '', { httpOnly: true, path: '/', maxAge: 0 });
  return res;
}
