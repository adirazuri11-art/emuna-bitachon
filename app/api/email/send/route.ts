// ============================================================
// שליחת מייל דרך EmailJS — צד-שרת בלבד
// מפתחות סודיים לא חשופים לקליינט
// Rate limited: 5 מיילים/דקה ל-IP אחד
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// In-memory rate limiter
const rateLimits = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(ip: string) {
  return ip || 'unknown';
}

function checkRateLimit(ip: string): boolean {
  const key = getRateLimitKey(ip);
  const now = Date.now();
  const limit = rateLimits.get(key);

  if (!limit || now > limit.resetAt) {
    rateLimits.set(key, { count: 1, resetAt: now + 60000 }); // 1 דקה
    return true;
  }

  if (limit.count >= 5) return false; // מקסימום 5 מיילים דקה
  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    // ייחוס ל-IP של הבקשה
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    // בדיקת rate limiting
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { ok: false, error: 'יותר מדי בקשות — אנא חכו דקה' },
        { status: 429 }
      );
    }

    const body = await req.json();
    const { toEmail, toName, code, validUntil } = body;

    // ולידציה
    if (!toEmail || !code || !validUntil) {
      return NextResponse.json(
        { ok: false, error: 'משדה חסר' },
        { status: 400 }
      );
    }

    // בדיקה שהמייל הוא תקין
    if (!toEmail.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { ok: false, error: 'מייל לא תקין' },
        { status: 400 }
      );
    }

    // שליחה ל-EmailJS דרך צד-שרת (מפתחות סודיים)
    const SERVICE = process.env.EMAILJS_SERVICE_ID;
    const TEMPLATE = process.env.EMAILJS_TEMPLATE_ID;
    const API_KEY = process.env.EMAILJS_API_KEY;

    if (!SERVICE || !TEMPLATE || !API_KEY) {
      console.error('EmailJS not configured');
      return NextResponse.json(
        { ok: false, error: 'שרת מייל לא מוגדר' },
        { status: 500 }
      );
    }

    const res = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        service_id: SERVICE,
        template_id: TEMPLATE,
        user_id: API_KEY,
        template_params: {
          to_email: toEmail,
          to_name: toName || '',
          coupon: code,
          valid_until: validUntil,
        },
      }),
    });

    if (!res.ok) {
      console.error('EmailJS error:', await res.text());
      return NextResponse.json(
        { ok: false, error: 'שגיאה בשליחת המייל' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Email send error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בשרת' },
      { status: 500 }
    );
  }
}
