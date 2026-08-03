// ============================================================
// בקשת ביטול / החזרה / החלפה — צד-שרת בלבד.
// מייצר מספר פנייה, שולח לשירות הלקוחות דרך FormSubmit, ומחזיר ticket.
// לא חושף פרטי אשראי, מבצע ולידציה ו-Rate Limiting, ולעולם לא מפיל את האתר.
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

const limits = new Map<string, { count: number; resetAt: number }>();
function rateLimit(key: string): boolean {
  const now = Date.now();
  const l = limits.get(key);
  if (!l || now > l.resetAt) {
    limits.set(key, { count: 1, resetAt: now + 60_000 });
    return true;
  }
  if (l.count >= 3) return false;
  l.count++;
  return true;
}

const clean = (v: unknown, max: number) => String(v ?? '').trim().slice(0, max);

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const name = clean(b.name, 80);
    const email = clean(b.email, 160);
    const phone = clean(b.phone, 40);
    const orderNumber = clean(b.orderNumber, 40);
    const type = clean(b.type, 48);
    const product = clean(b.product, 160);
    const description = clean(b.description, 2000);
    const preferred = clean(b.preferred, 48);

    if (!name || (!phone && !email)) {
      return NextResponse.json(
        { ok: false, error: 'נא למלא שם, ולפחות טלפון או דוא"ל.' },
        { status: 400 },
      );
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'כתובת דוא"ל אינה תקינה.' }, { status: 400 });
    }
    if (!type) {
      return NextResponse.json({ ok: false, error: 'נא לבחור את סוג הפנייה.' }, { status: 400 });
    }

    if (!rateLimit(email || phone || 'anon')) {
      return NextResponse.json(
        { ok: false, error: 'נשלחו מספר בקשות — נסו שוב בעוד דקה.' },
        { status: 429 },
      );
    }

    const ticket = `EB-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const target =
      process.env.RETURNS_EMAIL || process.env.NEXT_PUBLIC_NEWSLETTER_EMAIL || 'lalevmedia@gmail.com';

    // שליחה לשירות הלקוחות (FormSubmit) — best-effort, לא חוסם את התשובה ללקוח.
    await fetch(`https://formsubmit.co/ajax/${encodeURIComponent(target)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        _subject: `בקשת ביטול/החזרה/החלפה — ${ticket}`,
        מספר_פנייה: ticket,
        שם: name,
        טלפון: phone,
        אימייל: email,
        מספר_הזמנה: orderNumber || '(לא צוין)',
        סוג_פנייה: type,
        מוצר: product || '(לא צוין)',
        פתרון_מבוקש: preferred || '(לא צוין)',
        תיאור: description || '(ללא)',
      }),
    }).catch(() => {});

    return NextResponse.json({ ok: true, ticket });
  } catch {
    return NextResponse.json({ ok: false, error: 'שגיאה זמנית — נסו שוב עוד רגע.' }, { status: 200 });
  }
}
