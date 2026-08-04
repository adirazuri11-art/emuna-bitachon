import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Webhook של קארדקום — נקרא אחרי ניסיון תשלום.
// ResponseCode === 0 => התשלום הצליח. ReturnValue = מספר ההזמנה שלנו.
// (אימות מלא + סימון ההזמנה כשולמה יתווסף עם טבלת ההזמנות; כרגע קליטה + לוג בטוח.)
export async function POST(req: NextRequest) {
  let payload: Record<string, unknown> = {};
  try {
    payload = await req.json();
  } catch {
    try {
      const form = await req.formData();
      payload = Object.fromEntries(form.entries());
    } catch {
      /* ignore */
    }
  }

  const code = Number(payload.ResponseCode ?? payload.responsecode ?? -1);
  const orderNumber = String(payload.ReturnValue ?? payload.returnvalue ?? '');
  const paid = code === 0;

  // לוג בטוח בלבד — ללא פרטי כרטיס (קארדקום לא שולחת אותם).
  console.log(`[cardcom-webhook] order=${orderNumber} paid=${paid} code=${code}`);

  // תמיד להחזיר 200 כדי שקארדקום לא תנסה שוב ושוב.
  return NextResponse.json({ received: true });
}

export async function GET() {
  return NextResponse.json({ ok: true, endpoint: 'cardcom-webhook' });
}
