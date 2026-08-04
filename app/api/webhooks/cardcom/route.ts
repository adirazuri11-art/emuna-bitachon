import { NextRequest, NextResponse } from 'next/server';
import { verifyCardcomTransaction, createReceiptForTransaction, buildReceiptLines, isInvoiceEnabled } from '@/lib/payments';
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

        // הפקת קבלה — אחרי אישור התשלום, דרך אותו API מוכח (מקושר לעסקה). best-effort:
        // כשל כאן לא מבטל תשלום שכבר אושר; אפשר להפיק ידנית דרך /api/admin/issue-receipt.
        let receiptUrl: string | undefined;
        if (isInvoiceEnabled() && verified.transactionId) {
          try {
            const receipt = await createReceiptForTransaction({
              transactionId: verified.transactionId,
              customer: { name: order.customer.name, email: order.customer.email, phone: order.customer.phone, city: order.customer.city },
              lines: buildReceiptLines(order),
              sendByEmail: false, // אנחנו שולחים את הקבלה במייל (בלי מספר בטקסט)
            });
            if (receipt.ok && receipt.documentNumber != null) {
              receiptUrl = (receipt.raw as { DocumentUrl?: string } | undefined)?.DocumentUrl || undefined;
              await saveReceipt(verified.orderNumber, String(receipt.documentNumber), receiptUrl || '');
            } else {
              console.error(`[cardcom-webhook] receipt failed order=${verified.orderNumber} desc=${receipt.description}`);
            }
          } catch (e) {
            console.error(`[cardcom-webhook] receipt error order=${verified.orderNumber}`, e instanceof Error ? e.message : e);
          }
        }

        await sendOrderEmails(order, receiptUrl);
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
