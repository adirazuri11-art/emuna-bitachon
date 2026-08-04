import { NextRequest, NextResponse } from 'next/server';
import { verifyCardcomTransaction } from '@/lib/payments';
import { markOrderPaid, markOrderFailed, getOrderForFulfillment, redeemCouponForOrder, saveReceipt } from '@/lib/orders';
import { sendOrderEmails } from '@/lib/order-email';

export const dynamic = 'force-dynamic';

// Webhook של קארדקום — נקרא אחרי ניסיון תשלום.
// לא סומכים על גוף הבקשה: מוציאים LowProfileId ומאמתים ישירות מול קארדקום (GetLpResult).
// Idempotent: markOrderPaid מסמן "שולם" פעם אחת בלבד, ורק אם הסכום המאושר תואם.
async function parse(req: NextRequest): Promise<Record<string, unknown>> {
  try {
    return (await req.json()) as Record<string, unknown>;
  } catch {
    try {
      const form = await req.formData();
      return Object.fromEntries(form.entries());
    } catch {
      return {};
    }
  }
}

async function handle(req: NextRequest, lowProfileFromQuery?: string) {
  const payload = await parse(req);
  const lowProfileId = String(
    lowProfileFromQuery ??
      payload.LowProfileId ??
      payload.lowprofileid ??
      payload.LowProfileCode ??
      '',
  );
  if (!lowProfileId) {
    return NextResponse.json({ received: true, note: 'no LowProfileId' });
  }

  const verified = await verifyCardcomTransaction(lowProfileId);
  if (!verified) {
    console.error(`[cardcom-webhook] verify failed lp=${lowProfileId}`);
    return NextResponse.json({ received: true }); // 200 כדי שלא ינסו שוב ללא סוף
  }

  if (!verified.ok || !verified.orderNumber) {
    await markOrderFailed(verified.orderNumber);
    console.log(`[cardcom-webhook] order=${verified.orderNumber} NOT paid`);
    return NextResponse.json({ received: true });
  }

  const result = await markOrderPaid(verified.orderNumber, verified.amount, verified.transactionId);
  console.log(`[cardcom-webhook] order=${verified.orderNumber} mark=${result} amount=${verified.amount}`);

  // רק במעבר האמיתי ל"שולם" (result==='ok') — פעם אחת: מימוש קופון + מיילים.
  // Best-effort: כשל בשירות משני לא מבטל את התשלום שכבר אושר.
  if (result === 'ok') {
    try {
      const order = await getOrderForFulfillment(verified.orderNumber);
      if (order) {
        if (order.couponCode) await redeemCouponForOrder(order.couponCode);
        // קבלה שנוצרה אוטומטית בחיוב — נשמרת ל-CRM ומצורפת למייל ללקוח (בלי מספר בטקסט)
        if (verified.receiptNumber) await saveReceipt(verified.orderNumber, verified.receiptNumber, verified.receiptUrl || '');
        await sendOrderEmails(order, verified.receiptUrl);
      }
    } catch (e) {
      console.error(`[cardcom-webhook] fulfillment error order=${verified.orderNumber}`, e instanceof Error ? e.message : e);
    }
  }
  return NextResponse.json({ received: true, result });
}

export async function POST(req: NextRequest) {
  const lp = req.nextUrl.searchParams.get('LowProfileId') ?? undefined;
  return handle(req, lp);
}

// קארדקום מפעילה לעיתים GET ל-webhook — תומכים בשניהם.
export async function GET(req: NextRequest) {
  const lp = req.nextUrl.searchParams.get('LowProfileId') ?? undefined;
  if (lp) return handle(req, lp);
  return NextResponse.json({ ok: true, endpoint: 'cardcom-webhook' });
}
