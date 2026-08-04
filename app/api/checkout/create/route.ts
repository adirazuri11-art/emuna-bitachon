import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/catalog';
import { calcShipping, cardcom, isPaymentConfigured, isPaymentLive, validateCoupon } from '@/lib/payments';
import { giftWrapCharge, validateGiftMessage } from '@/lib/gift-wrap';
import { createPendingOrder } from '@/lib/orders';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// מפת מחירי אמת מהקטלוג (id → מחיר אפקטיבי).
const PRICE_BY_ID = new Map<string, number>(PRODUCTS.map((p) => [p.id, p.discountPrice ?? p.basePrice]));
const TITLE_BY_ID = new Map<string, string>(PRODUCTS.map((p) => [p.id, p.titleHe]));

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emunavebitachon.co.il';
const MEMBER_PCT = 10; // הנחת מועדון — תואם להתנהגות הקופה הקיימת

interface InItem { id?: string; quantity?: number; price?: number }

function unitPrice(item: InItem): number {
  const id = String(item.id ?? '');
  const fromCatalog = PRICE_BY_ID.get(id);
  if (fromCatalog != null) return fromCatalog;
  const client = Number(item.price);
  if (!Number.isFinite(client) || client <= 0) return 0;
  return Math.min(client, 10000); // פריט דינמי (שובר/התאמה) — בגבול בטוח
}

// אימות הנחה בצד השרת בלבד. מחזיר אחוז הנחה (0..100) ותווית.
async function serverDiscountPct(code: string): Promise<{ pct: number; code: string } | null> {
  const clean = code.trim();
  if (!clean) return null;
  // 1) קופון סטטי מוגדר בקוד
  const stat = validateCoupon(clean);
  if (stat) return { pct: stat.pct, code: clean };
  // 2) קוד מועדון — קיים ב-ClubMember ולא נוצל (דרך Prisma/Neon)
  try {
    const member = await prisma.clubMember.findFirst({ where: { couponCode: clean }, select: { couponUsed: true } });
    if (member && member.couponUsed === false) return { pct: MEMBER_PCT, code: clean };
  } catch {
    /* לא ניתן לאמת → לא מחילים הנחה לא מאומתת */
  }
  return null; // לעולם לא מפחיתים לפי טענת לקוח בלבד
}

export async function POST(req: NextRequest) {
  if (!isPaymentConfigured()) {
    return NextResponse.json({ ok: false, error: 'סליקה אינה מוגדרת' }, { status: 503 });
  }
  // גייט בטיחות: כל עוד CARDCOM_LIVE אינו true — לא יוצרים תשלום אמיתי.
  if (!isPaymentLive()) {
    return NextResponse.json({ ok: false, liveDisabled: true, error: 'סליקה בבדיקה — טרם הופעלה' }, { status: 200 });
  }

  let body: {
    items?: InItem[];
    giftWrap?: { selected?: boolean; message?: string };
    couponCode?: string;
    customer?: { name?: string; email?: string; phone?: string; street?: string; city?: string; zip?: string; floor?: string; apt?: string; entryCode?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'בקשה לא תקינה' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) return NextResponse.json({ ok: false, error: 'הסל ריק' }, { status: 400 });

  // ---- תמחור בשרת בלבד ----
  const lineItems = items.map((it) => {
    const id = String(it.id ?? '');
    const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
    const unit = unitPrice(it);
    return { id, title: TITLE_BY_ID.get(id) ?? String((it as { title?: string }).title ?? id), quantity: qty, unitPrice: unit };
  });
  const productsSubtotal = lineItems.reduce((s, l) => s + l.unitPrice * l.quantity, 0);
  if (productsSubtotal <= 0) return NextResponse.json({ ok: false, error: 'סכום לא תקין' }, { status: 400 });

  const shipping = calcShipping(productsSubtotal); // ספי משלוח לפי מוצרים בלבד

  // הנחה מאומתת (אריזת המתנה לעולם לא מקבלת הנחה)
  let discount = 0;
  let appliedCoupon: string | undefined;
  if (body.couponCode) {
    const d = await serverDiscountPct(body.couponCode);
    if (d) {
      discount = Math.round((productsSubtotal * d.pct) / 100);
      appliedCoupon = d.code;
    }
  }

  // אריזת מתנה — אימות בשרת, 10 ₪ פעם אחת
  let giftCharge = 0;
  let giftMessage = '';
  if (body.giftWrap?.selected === true) {
    const v = validateGiftMessage(body.giftWrap?.message ?? '');
    if (!v.ok) return NextResponse.json({ ok: false, error: v.error }, { status: 422 });
    giftCharge = giftWrapCharge(true, true);
    giftMessage = v.sanitized;
  }

  const amount = Math.round((productsSubtotal - discount + shipping + giftCharge) * 100) / 100;
  if (amount <= 0) return NextResponse.json({ ok: false, error: 'סכום לא תקין' }, { status: 400 });

  const orderNumber = `EB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const customer = {
    name: String(body.customer?.name ?? '').slice(0, 80) || 'לקוח',
    email: String(body.customer?.email ?? '').slice(0, 120),
    phone: String(body.customer?.phone ?? '').slice(0, 40),
    street: String(body.customer?.street ?? '').slice(0, 120),
    city: String(body.customer?.city ?? '').slice(0, 60),
    zip: String(body.customer?.zip ?? '').slice(0, 20),
    floor: String(body.customer?.floor ?? '').slice(0, 20),
    apt: String(body.customer?.apt ?? '').slice(0, 20),
    entryCode: String(body.customer?.entryCode ?? '').slice(0, 30),
  };

  // שמירת הזמנה pending לפני מעבר לסליקה (מקור אמת לאימות ה-webhook)
  const persisted = await createPendingOrder({
    orderNumber, amount, items: lineItems, customer,
    giftWrap: giftCharge, giftMessage, couponCode: appliedCoupon, discount, shipping,
  });
  if (!persisted) {
    return NextResponse.json({ ok: false, error: 'שמירת ההזמנה נכשלה — נסו שוב' }, { status: 500 });
  }

  // שורות לקבלה — סכומן חייב להיות בדיוק amount (מוצרים + משלוח + אריזה − הנחה)
  const documentLines = [
    ...lineItems.map((l) => ({ description: l.title, unitCost: l.unitPrice, quantity: l.quantity })),
    ...(shipping > 0 ? [{ description: 'משלוח', unitCost: shipping, quantity: 1 }] : []),
    ...(giftCharge > 0 ? [{ description: 'אריזת מתנה + כרטיס ברכה', unitCost: giftCharge, quantity: 1 }] : []),
    ...(discount > 0 ? [{ description: `הנחה${appliedCoupon ? ` (${appliedCoupon})` : ''}`, unitCost: -discount, quantity: 1 }] : []),
  ];

  try {
    const session = await cardcom.createPaymentPage({
      orderNumber, amount, customer,
      productName: `הזמנה ${orderNumber} — אמונה וביטחון`,
      successUrl: `${BASE_URL}/checkout/success?order=${encodeURIComponent(orderNumber)}`,
      failureUrl: `${BASE_URL}/checkout/failed?order=${encodeURIComponent(orderNumber)}`,
      webhookUrl: `${BASE_URL}/api/webhooks/cardcom`,
      documentLines,
    });
    return NextResponse.json({ ok: true, orderNumber, amount, redirectUrl: session.redirectUrl });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'שגיאת סליקה' }, { status: 502 });
  }
}
