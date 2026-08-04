// ============================================================
// שכבת הזמנות — מקור אמת לסטטוס תשלום (Neon/Postgres דרך Prisma raw, server-only).
// Idempotent: הזמנה מסומנת "שולם" פעם אחת בלבד, ורק אם הסכום המאושר תואם.
// טבלת public.orders נוצרת דרך /api/admin/migrate (DDL זהה ל-docs/crm/sql/003_orders.sql).
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';

export interface OrderInput {
  orderNumber: string;
  amount: number;
  items: Array<{ id: string; title?: string; quantity: number; unitPrice: number }>;
  customer: { name: string; email: string; phone: string; street?: string; city?: string; zip?: string };
  giftWrap: number;
  giftMessage: string;
  couponCode?: string;
  discount: number;
  shipping: number;
}

export async function createPendingOrder(o: OrderInput, providerRef?: string): Promise<boolean> {
  try {
    await prisma.$executeRawUnsafe(
      `insert into public.orders
        (order_number,status,amount,currency,items,customer,gift_wrap,gift_message,coupon_code,discount,shipping,provider,provider_ref)
       values ($1,'pending_payment',$2,'ILS',$3::jsonb,$4::jsonb,$5,$6,$7,$8,$9,'cardcom',$10)`,
      o.orderNumber,
      o.amount,
      JSON.stringify(o.items),
      JSON.stringify(o.customer),
      o.giftWrap,
      o.giftMessage || null,
      o.couponCode || null,
      o.discount,
      o.shipping,
      providerRef || null,
    );
    return true;
  } catch {
    return false;
  }
}

export async function attachProviderRef(orderNumber: string, providerRef: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `update public.orders set provider_ref=$2, updated_at=now() where order_number=$1`,
      orderNumber,
      providerRef,
    );
  } catch {
    /* noop */
  }
}

export async function getOrder(
  orderNumber: string,
): Promise<{ status: string; amount: number; paid: boolean } | null> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select status, amount from public.orders where order_number=$1 limit 1`,
      orderNumber,
    )) as Array<{ status: string; amount: unknown }>;
    if (!rows || rows.length === 0) return null;
    return { status: rows[0].status, amount: Number(rows[0].amount), paid: rows[0].status === 'paid' };
  } catch {
    return null;
  }
}

// Idempotent — מחזיר 'ok' | 'already' | 'not_found' | 'amount_mismatch' | 'error'.
export async function markOrderPaid(
  orderNumber: string,
  approvedAmount: number,
  transactionId: string,
): Promise<'ok' | 'already' | 'not_found' | 'amount_mismatch' | 'error'> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select status, amount from public.orders where order_number=$1 limit 1`,
      orderNumber,
    )) as Array<{ status: string; amount: unknown }>;
    if (!rows || rows.length === 0) return 'not_found';
    if (rows[0].status === 'paid') return 'already';
    if (Math.abs(Number(rows[0].amount) - approvedAmount) > 0.01) return 'amount_mismatch';

    // עדכון מותנה בסטטוס pending => מונע כפילות webhook/מירוץ.
    const affected = await prisma.$executeRawUnsafe(
      `update public.orders set status='paid', transaction_id=$2, paid_at=now(), updated_at=now()
       where order_number=$1 and status='pending_payment'`,
      orderNumber,
      transactionId,
    );
    return affected === 1 ? 'ok' : 'already';
  } catch {
    return 'error';
  }
}

export interface FulfillmentOrder {
  orderNumber: string;
  amount: number;
  items: Array<{ id: string; title?: string; quantity: number; unitPrice: number }>;
  customer: { name?: string; email?: string; phone?: string; street?: string; city?: string; zip?: string };
  giftWrap: number;
  giftMessage: string | null;
  couponCode: string | null;
  discount: number;
  shipping: number;
}

export async function getOrderForFulfillment(orderNumber: string): Promise<FulfillmentOrder | null> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select order_number, amount, items, customer, gift_wrap, gift_message, coupon_code, discount, shipping
       from public.orders where order_number=$1 limit 1`,
      orderNumber,
    )) as Array<Record<string, unknown>>;
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      orderNumber: String(r.order_number),
      amount: Number(r.amount),
      items: (r.items as FulfillmentOrder['items']) ?? [],
      customer: (r.customer as FulfillmentOrder['customer']) ?? {},
      giftWrap: Number(r.gift_wrap ?? 0),
      giftMessage: (r.gift_message as string) ?? null,
      couponCode: (r.coupon_code as string) ?? null,
      discount: Number(r.discount ?? 0),
      shipping: Number(r.shipping ?? 0),
    };
  } catch {
    return null;
  }
}

// סימון קופון/קוד מועדון כמומש — לאחר תשלום מאומת בלבד. Idempotent.
export async function redeemCouponForOrder(couponCode: string): Promise<void> {
  try {
    await prisma.clubMember.updateMany({
      where: { couponCode, couponUsed: false },
      data: { couponUsed: true, couponUsedAt: new Date() },
    });
  } catch {
    /* קוד לא של מועדון / עמודה שונה — לא חוסם */
  }
}

export async function markOrderFailed(orderNumber: string): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(
      `update public.orders set status='failed', updated_at=now() where order_number=$1 and status='pending_payment'`,
      orderNumber,
    );
  } catch {
    /* noop */
  }
}
