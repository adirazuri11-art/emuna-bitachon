import { NextRequest, NextResponse } from 'next/server';
import { verifyCardcomTransaction } from '@/lib/payments';
import { markOrderPaid, markOrderFailed } from '@/lib/orders';

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
  // TODO(after first paid order verified): שליחת מייל אישור + purchase event — פעם אחת, על result==='ok' בלבד.
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
