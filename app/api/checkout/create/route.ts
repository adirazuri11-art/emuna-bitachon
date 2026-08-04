import { NextRequest, NextResponse } from 'next/server';
import { PRODUCTS } from '@/lib/catalog';
import { calcShipping, cardcom, isPaymentConfigured } from '@/lib/payments';
import { giftWrapCharge, validateGiftMessage } from '@/lib/gift-wrap';

export const dynamic = 'force-dynamic';

// מפת מחירים אמת מהקטלוג (id → מחיר אפקטיבי). נבנית פעם אחת.
const PRICE_BY_ID = new Map<string, number>(
  PRODUCTS.map((p) => [p.id, p.discountPrice ?? p.basePrice]),
);

interface InItem { id?: string; quantity?: number; price?: number }

// מחיר יחידה אמין: מהקטלוג אם קיים; אחרת (שובר מתנה / התאמה אישית) — ערך הלקוח בגבולות שפויים.
function unitPrice(item: InItem): number {
  const id = String(item.id ?? '');
  const fromCatalog = PRICE_BY_ID.get(id);
  if (fromCatalog != null) return fromCatalog;
  const client = Number(item.price);
  if (!Number.isFinite(client) || client <= 0) return 0;
  return Math.min(client, 10000); // תקרת בטיחות לפריטים דינמיים
}

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emunavebitachon.co.il';

export async function POST(req: NextRequest) {
  if (!isPaymentConfigured()) {
    return NextResponse.json({ ok: false, error: 'סליקה אינה מוגדרת עדיין' }, { status: 503 });
  }

  let body: {
    items?: InItem[];
    giftWrap?: { selected?: boolean; message?: string };
    customer?: { name?: string; email?: string; phone?: string };
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'בקשה לא תקינה' }, { status: 400 });
  }

  const items = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ ok: false, error: 'הסל ריק' }, { status: 400 });
  }

  // ---- חישוב הסכום בשרת בלבד ----
  let productsSubtotal = 0;
  for (const it of items) {
    const qty = Math.max(1, Math.floor(Number(it.quantity) || 1));
    productsSubtotal += unitPrice(it) * qty;
  }
  if (productsSubtotal <= 0) {
    return NextResponse.json({ ok: false, error: 'סכום לא תקין' }, { status: 400 });
  }

  const shipping = calcShipping(productsSubtotal);

  // אריזת מתנה — אימות בשרת, 10 ₪ פעם אחת
  let giftCharge = 0;
  const giftSelected = body.giftWrap?.selected === true;
  if (giftSelected) {
    const v = validateGiftMessage(body.giftWrap?.message ?? '');
    if (!v.ok) {
      return NextResponse.json({ ok: false, error: v.error }, { status: 422 });
    }
    giftCharge = giftWrapCharge(true, true);
  }

  // הנחות/קופונים מחושבים בשרת בשלב הבא (טרם מחוברים לחיוב) — כרגע חיוב לפי מוצרים+משלוח+אריזה.
  const amount = Math.round((productsSubtotal + shipping + giftCharge) * 100) / 100;

  const orderNumber = `EB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
  const customer = {
    name: String(body.customer?.name ?? '').slice(0, 80) || 'לקוח',
    email: String(body.customer?.email ?? '').slice(0, 120),
    phone: String(body.customer?.phone ?? '').slice(0, 40),
  };

  try {
    const session = await cardcom.createPaymentPage({
      orderNumber,
      amount,
      customer,
      productName: `הזמנה ${orderNumber} — אמונה וביטחון`,
      successUrl: `${BASE_URL}/checkout/success?order=${encodeURIComponent(orderNumber)}`,
      failureUrl: `${BASE_URL}/checkout?failed=1`,
      webhookUrl: `${BASE_URL}/api/webhooks/cardcom`,
    });
    return NextResponse.json({
      ok: true,
      orderNumber,
      amount,
      redirectUrl: session.redirectUrl,
      providerRef: session.providerRef,
    });
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: e instanceof Error ? e.message : 'שגיאת סליקה' },
      { status: 502 },
    );
  }
}
