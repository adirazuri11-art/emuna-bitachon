// ============================================================
// CRM — נתוני הזמנות (מקור אמת: public.orders ב-Neon, דרך Prisma raw).
// server-only. הכל defensive: אם אין טבלה/DB — מחזיר אפסים/ריק.
// ============================================================

import 'server-only';
import { prisma } from '@/lib/prisma';

const num = (v: unknown) => Number(v ?? 0);

export type Fulfillment = 'in_progress' | 'shipping' | 'completed';
export const FULFILLMENT_LABELS: Record<Fulfillment, string> = {
  in_progress: 'בעבודה',
  shipping: 'במשלוח',
  completed: 'בוצעה בהצלחה',
};

export interface OrdersStats {
  ok: boolean;
  revenue: number; // סה"כ הכנסות (שולמו)
  paidCount: number;
  pendingCount: number;
  aov: number; // ממוצע להזמנה
  revenue7d: number;
  paid7d: number;
  revenueToday: number;
  inProgress: number;
  shipping: number;
  completed: number;
}

export async function getOrdersStats(): Promise<OrdersStats> {
  const empty: OrdersStats = { ok: false, revenue: 0, paidCount: 0, pendingCount: 0, aov: 0, revenue7d: 0, paid7d: 0, revenueToday: 0, inProgress: 0, shipping: 0, completed: 0 };
  try {
    const rows = (await prisma.$queryRawUnsafe(`
      select
        coalesce(sum(amount) filter (where status='paid'),0)                                    as revenue,
        count(*) filter (where status='paid')                                                   as paid_count,
        count(*) filter (where status='pending_payment')                                        as pending_count,
        coalesce(sum(amount) filter (where status='paid' and paid_at > now() - interval '7 days'),0) as revenue_7d,
        count(*) filter (where status='paid' and paid_at > now() - interval '7 days')            as paid_7d,
        coalesce(sum(amount) filter (where status='paid' and paid_at::date = now()::date),0)     as revenue_today,
        count(*) filter (where status='paid' and fulfillment_status='in_progress')               as in_progress,
        count(*) filter (where status='paid' and fulfillment_status='shipping')                  as shipping,
        count(*) filter (where status='paid' and fulfillment_status='completed')                 as completed
      from public.orders
    `)) as Array<Record<string, unknown>>;
    const r = rows[0] ?? {};
    const revenue = num(r.revenue);
    const paidCount = num(r.paid_count);
    return {
      ok: true,
      revenue,
      paidCount,
      pendingCount: num(r.pending_count),
      aov: paidCount ? Math.round(revenue / paidCount) : 0,
      revenue7d: num(r.revenue_7d),
      paid7d: num(r.paid_7d),
      revenueToday: num(r.revenue_today),
      inProgress: num(r.in_progress),
      shipping: num(r.shipping),
      completed: num(r.completed),
    };
  } catch {
    return empty;
  }
}

export interface OrderRow {
  orderNumber: string;
  status: string;
  fulfillment: Fulfillment;
  amount: number;
  customerName: string;
  customerPhone: string;
  city: string;
  itemCount: number;
  createdAt: string;
  paidAt: string | null;
}

export async function getRecentOrders(limit = 60, fulfillment?: Fulfillment): Promise<OrderRow[]> {
  try {
    const where = fulfillment ? `where status='paid' and fulfillment_status='${fulfillment}'` : '';
    const rows = (await prisma.$queryRawUnsafe(
      `select order_number, status, fulfillment_status, amount,
              customer->>'name' as name, customer->>'phone' as phone, customer->>'city' as city,
              jsonb_array_length(items) as item_count, created_at, paid_at
       from public.orders ${where} order by created_at desc limit ${Math.min(200, Math.max(1, limit))}`,
    )) as Array<Record<string, unknown>>;
    return rows.map((r) => ({
      orderNumber: String(r.order_number),
      status: String(r.status),
      fulfillment: (String(r.fulfillment_status ?? 'in_progress') as Fulfillment),
      amount: num(r.amount),
      customerName: String(r.name ?? '—'),
      customerPhone: String(r.phone ?? ''),
      city: String(r.city ?? ''),
      itemCount: num(r.item_count),
      createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : '',
      paidAt: r.paid_at ? new Date(r.paid_at as string).toISOString() : null,
    }));
  } catch {
    return [];
  }
}

// עדכון סטטוס טיפול — CRM. מחזיר true בהצלחה.
export async function updateOrderFulfillment(orderNumber: string, status: Fulfillment): Promise<boolean> {
  try {
    const n = await prisma.$executeRawUnsafe(
      `update public.orders set fulfillment_status=$2, updated_at=now() where order_number=$1 and status='paid'`,
      orderNumber,
      status,
    );
    return n > 0;
  } catch {
    return false;
  }
}

export interface OrderDetail {
  orderNumber: string;
  status: string;
  fulfillment: Fulfillment;
  amount: number;
  currency: string;
  items: Array<{ id: string; title?: string; quantity: number; unitPrice: number }>;
  customer: { name?: string; email?: string; phone?: string; street?: string; city?: string; zip?: string };
  giftWrap: number;
  giftMessage: string | null;
  couponCode: string | null;
  discount: number;
  shipping: number;
  transactionId: string | null;
  paidAt: string | null;
  createdAt: string;
}

export async function getOrderDetail(orderNumber: string): Promise<OrderDetail | null> {
  try {
    const rows = (await prisma.$queryRawUnsafe(
      `select * from public.orders where order_number=$1 limit 1`,
      orderNumber,
    )) as Array<Record<string, unknown>>;
    if (!rows || rows.length === 0) return null;
    const r = rows[0];
    return {
      orderNumber: String(r.order_number),
      status: String(r.status),
      fulfillment: (String(r.fulfillment_status ?? 'in_progress') as Fulfillment),
      amount: num(r.amount),
      currency: String(r.currency ?? 'ILS'),
      items: (r.items as OrderDetail['items']) ?? [],
      customer: (r.customer as OrderDetail['customer']) ?? {},
      giftWrap: num(r.gift_wrap),
      giftMessage: (r.gift_message as string) ?? null,
      couponCode: (r.coupon_code as string) ?? null,
      discount: num(r.discount),
      shipping: num(r.shipping),
      transactionId: (r.transaction_id as string) ?? null,
      paidAt: r.paid_at ? new Date(r.paid_at as string).toISOString() : null,
      createdAt: r.created_at ? new Date(r.created_at as string).toISOString() : '',
    };
  } catch {
    return null;
  }
}
