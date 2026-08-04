import { NextRequest, NextResponse } from 'next/server';
import { validateGiftMessage, GIFT_WRAP_PRICE } from '@/lib/gift-wrap';

export const dynamic = 'force-dynamic';

// מקור האמת של אריזת המתנה בצד השרת.
// ה-Client שולח רק { selected, message } — המחיר נקבע כאן (10 ₪) ולעולם לא מה-Client.
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'בקשה לא תקינה' }, { status: 400 });
  }

  const b = (body ?? {}) as { selected?: unknown; message?: unknown };
  const selected = b.selected === true;

  // לא נבחרה אריזת מתנה → אין תוספת, אין ברכה.
  if (!selected) {
    return NextResponse.json({ ok: true, selected: false, price: 0, wordCount: 0, sanitizedMessage: '' });
  }

  const message = typeof b.message === 'string' ? b.message : '';
  const v = validateGiftMessage(message);

  if (!v.ok) {
    return NextResponse.json(
      { ok: false, selected: true, price: GIFT_WRAP_PRICE, wordCount: v.wordCount, error: v.error },
      { status: 422 },
    );
  }

  // המחיר תמיד מהשרת — פעם אחת בלבד.
  return NextResponse.json({
    ok: true,
    selected: true,
    price: GIFT_WRAP_PRICE,
    wordCount: v.wordCount,
    sanitizedMessage: v.sanitized,
  });
}
