// ============================================================
// הרשמה לניוזלטר — צד-שרת בלבד
// FormSubmit יטעון בחזית דרך endpoint זה בלבד
// Rate limited: 1 הרשמה/דקה ל-email אחד
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

// Track email signup attempts (in-memory)
const emailLimits = new Map<string, { count: number; resetAt: number }>();

function checkEmailRateLimit(email: string): boolean {
  const now = Date.now();
  const limit = emailLimits.get(email);

  if (!limit || now > limit.resetAt) {
    emailLimits.set(email, { count: 1, resetAt: now + 60000 }); // 1 דקה
    return true;
  }

  if (limit.count >= 1) return false; // מקסימום פעם אחת בדקה
  limit.count++;
  return true;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name } = body;

    // ולידציה
    if (!email || !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      return NextResponse.json(
        { ok: false, error: 'מייל לא תקין' },
        { status: 400 }
      );
    }

    // Rate limiting per email
    if (!checkEmailRateLimit(email)) {
      return NextResponse.json(
        { ok: false, error: 'הרשמה זו לתיבת הדוא"ל קיימת כבר בשנייה' },
        { status: 429 }
      );
    }

    // שליחה לFormSubmit דרך צד-שרת (מייל סוכנות מוגן)
    const TARGET_EMAIL = process.env.NEXT_PUBLIC_NEWSLETTER_EMAIL || 'lalevmedia@gmail.com';

    const formsubmitRes = await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(TARGET_EMAIL)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        _subject: 'הרשמה חדשה לניוזלטר — אמונה וביטחון',
        name: name || '—',
        email,
        מקור: 'ניוזלטר באתר',
        _template: 'box',
        _captcha: 'false',
      }),
    });

    if (!formsubmitRes.ok) {
      console.error('FormSubmit error:', await formsubmitRes.text());
      return NextResponse.json(
        { ok: false, error: 'שגיאה בשליחת ההרשמה' },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json(
      { ok: false, error: 'שגיאה בשרת' },
      { status: 500 }
    );
  }
}
