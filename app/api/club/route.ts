// ============================================================
// מועדון לקוחות — API בצד-שרת (אכיפה אמיתית, לא בדפדפן).
//   action: 'join'     → יוצר קוד אישי ייחודי לכל נרשם, שומר ב-DB
//   action: 'validate' → בודק קוד בקופה (קיים / לא נוצל / בתוקף)
//   action: 'redeem'   → מסמן נוצל אטומית (מימוש פעם אחת בלבד לכל אדם)
//   action: 'member'   → האם הקוד/המייל שייך לחבר מועדון (למחירי-חבר)
// דורש DB מחובר (DATABASE_URL). רץ רק בפריסת Vercel (לא בבילד סטטי).
// ============================================================

import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const COUPON_PCT = 10; // אחוז הנחת הצטרפות חברים חדשים
const VALID_DAYS = 7; // תוקף הקוד האישי

// Rate limiting — In-memory, 10 הצטרפויות חדשות דקה ל-IP
const joinLimits = new Map<string, { count: number; resetAt: number }>();

function getRateLimitKey(req: NextRequest): string {
  return req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
}

function checkJoinRateLimit(req: NextRequest): boolean {
  const key = getRateLimitKey(req);
  const now = Date.now();
  const limit = joinLimits.get(key);

  if (!limit || now > limit.resetAt) {
    joinLimits.set(key, { count: 1, resetAt: now + 60000 });
    return true;
  }

  if (limit.count >= 10) return false;
  limit.count++;
  return true;
}

// קוד נקי וממותג: "אמונה-" + 5 ספרות (בלי אותיות אנגלית הזויות)
const genCode = () => `אמונה-${Math.floor(10000 + Math.random() * 90000)}`;

const isEmail = (s: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s);

export async function POST(req: NextRequest) {
  const { prisma } = await import('@/lib/prisma');

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'בקשה לא תקינה' }, { status: 400 });
  }
  const action = String(body.action ?? '');

  // ---- הצטרפות: קוד ייחודי לכל אדם ----
  if (action === 'join') {
    // Rate limiting
    if (!checkJoinRateLimit(req)) {
      return NextResponse.json(
        { ok: false, error: 'יותר מדי בקשות — אנא חכו דקה' },
        { status: 429 }
      );
    }

    const email = String(body.email ?? '').trim().toLowerCase();
    if (!isEmail(email)) return NextResponse.json({ ok: false, error: 'אימייל לא תקין' }, { status: 400 });

    // אידמפוטנטי: אם כבר נרשם — מחזירים את הקוד הקיים שלו (לא יוצרים חדש)
    const existing = await prisma.clubMember.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({
        ok: true, already: true, used: existing.couponUsed,
        code: existing.couponCode, expires: existing.couponExpires.getTime(), pct: COUPON_PCT,
      });
    }

    const couponExpires = new Date(Date.now() + VALID_DAYS * 24 * 3600 * 1000);
    for (let attempt = 0; attempt < 6; attempt++) {
      try {
        const m = await prisma.clubMember.create({
          data: { email, couponCode: genCode(), couponExpires },
        });
        return NextResponse.json({
          ok: true, code: m.couponCode, expires: m.couponExpires.getTime(), pct: COUPON_PCT,
        });
      } catch (e) {
        // התנגשות קוד ייחודי — מנסים קוד אחר
        if ((e as { code?: string }).code === 'P2002') continue;
        throw e;
      }
    }
    return NextResponse.json({ ok: false, error: 'שגיאה זמנית, נסו שוב' }, { status: 500 });
  }

  // ---- אימות קוד בסל ----
  if (action === 'validate') {
    const code = String(body.code ?? '').trim();
    const subtotal = Number(body.subtotal) || 0;
    const m = await prisma.clubMember.findUnique({ where: { couponCode: code } });
    if (!m) return NextResponse.json({ ok: false, error: 'קוד קופון לא תקין' });
    if (m.couponUsed) return NextResponse.json({ ok: false, error: 'הקופון כבר נוצל' });
    if (m.couponExpires.getTime() < Date.now()) return NextResponse.json({ ok: false, error: 'תוקף הקופון פג' });
    const discount = Math.round((subtotal * COUPON_PCT) / 100);
    return NextResponse.json({ ok: true, discount, pct: COUPON_PCT, label: `הטבת מועדון — ${COUPON_PCT}% הנחה` });
  }

  // ---- מימוש (סיום הזמנה) — אטומי, פעם אחת בלבד ----
  if (action === 'redeem') {
    const code = String(body.code ?? '').trim();
    // updateMany עם תנאי couponUsed:false → race-safe. אם 0 שורות — כבר נוצל/פג.
    const r = await prisma.clubMember.updateMany({
      where: { couponCode: code, couponUsed: false, couponExpires: { gt: new Date() } },
      data: { couponUsed: true, couponUsedAt: new Date() },
    });
    if (r.count === 0) return NextResponse.json({ ok: false, error: 'הקופון כבר נוצל או פג' });
    return NextResponse.json({ ok: true });
  }

  // ---- בדיקת חברוּת (למחירי-חבר, מתמשך גם אחרי מימוש הקופון) ----
  if (action === 'member') {
    const code = String(body.code ?? '').trim();
    const email = String(body.email ?? '').trim().toLowerCase();
    const m = code
      ? await prisma.clubMember.findUnique({ where: { couponCode: code } })
      : email && isEmail(email)
        ? await prisma.clubMember.findUnique({ where: { email } })
        : null;
    return NextResponse.json({ ok: true, isMember: Boolean(m) });
  }

  // ---- ייצוא רשימת חברים (מוגן במפתח סודי) — לשיווק ודיוור ----
  if (action === 'list') {
    const key = String(body.key ?? '');
    if (!process.env.CLUB_ADMIN_KEY || key !== process.env.CLUB_ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'לא מורשה' }, { status: 401 });
    }
    const members = await prisma.clubMember.findMany({
      orderBy: { createdAt: 'desc' },
      select: { email: true, couponCode: true, couponUsed: true, createdAt: true },
    });
    return NextResponse.json({ ok: true, count: members.length, members });
  }

  // ---- ניקוי חבר בדיקה (מוגן) — למחיקת רשומות QA/דמו ----
  if (action === 'delete') {
    const key = String(body.key ?? '');
    if (!process.env.CLUB_ADMIN_KEY || key !== process.env.CLUB_ADMIN_KEY) {
      return NextResponse.json({ ok: false, error: 'לא מורשה' }, { status: 401 });
    }
    const email = String(body.email ?? '').trim().toLowerCase();
    const r = await prisma.clubMember.deleteMany({ where: { email } });
    return NextResponse.json({ ok: true, deleted: r.count });
  }

  return NextResponse.json({ ok: false, error: 'פעולה לא מוכרת' }, { status: 400 });
}
