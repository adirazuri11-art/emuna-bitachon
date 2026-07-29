import { createHmac, timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';

/**
 * מנוע סנכרון ספקים B2B — נקודת קצה ל-webhooks של ספקים
 * ("משכן התכלת", "חדד כלי כסף", "חלבין" וכו').
 *
 * אירועים נתמכים:
 * - stock.updated        → עדכון מלאי בזמן אמת לפי SKU
 * - price.updated        → עדכון מחיר סיטונאי
 * - certificate.updated  → תעודת כשרות חדשה/מחודשת נכנסת לתור אימות (PENDING)
 *
 * אבטחה: חתימת HMAC-SHA256 על גוף הבקשה בכותרת x-supplier-signature.
 */

interface SupplierEvent {
  type: 'stock.updated' | 'price.updated' | 'certificate.updated';
  supplierId: string;
  sku: string;
  data: Record<string, unknown>;
}

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.SUPPLIER_WEBHOOK_SECRET;
  if (!secret || !signature) return false;

  const expected = createHmac('sha256', secret).update(rawBody).digest('hex');
  const a = Buffer.from(expected, 'hex');
  const b = Buffer.from(signature, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: Request) {
  const rawBody = await req.text();

  if (!verifySignature(rawBody, req.headers.get('x-supplier-signature'))) {
    return NextResponse.json({ error: 'invalid signature' }, { status: 401 });
  }

  let event: SupplierEvent;
  try {
    event = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  try {
    // Prisma מיובא דינמית כדי שהראוט יעבוד גם לפני `prisma generate`
    const { prisma } = await import('@/lib/prisma');

    switch (event.type) {
      case 'stock.updated': {
        await prisma.product.update({
          where: { sku: event.sku },
          data: { stock: Number(event.data.stock ?? 0) },
        });
        break;
      }

      case 'price.updated': {
        await prisma.product.update({
          where: { sku: event.sku },
          data: { basePrice: Number(event.data.basePrice) },
        });
        break;
      }

      case 'certificate.updated': {
        // תעודה חדשה נכנסת כ-PENDING; cron/queue מאמת מול גוף הכשרות
        const product = await prisma.product.findUnique({ where: { sku: event.sku } });
        if (product) {
          await prisma.kashrutCertificate.create({
            data: {
              productId: product.id,
              supplierId: event.supplierId,
              organization: String(event.data.organization ?? 'לא ידוע'),
              issuedAt: new Date(String(event.data.issuedAt)),
              expiresAt: new Date(String(event.data.expiresAt)),
              documentUrl: String(event.data.documentUrl ?? ''),
              status: 'PENDING',
            },
          });
        }
        break;
      }

      default:
        return NextResponse.json({ error: 'unknown event type' }, { status: 422 });
    }
  } catch (err) {
    console.error('[supplier-webhook] DB error:', err);
    return NextResponse.json({ error: 'processing failed' }, { status: 500 });
  }

  return NextResponse.json({ received: true, type: event.type, sku: event.sku });
}
