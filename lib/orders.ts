// ============================================================
// שכבת הזמנות — מקור אמת לסטטוס תשלום (Supabase, server-only).
// כל הכתיבה דרך service-role בלבד. Idempotent: הזמנה מסומנת "שולם" פעם אחת.
// ============================================================

import 'server-only';
import { createClient } from '@supabase/supabase-js';

function supa() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

export interface OrderInput {
  orderNumber: string;
  amount: number;
  items: Array<{ id: string; title?: string; quantity: number; unitPrice: number }>;
  customer: { name: string; email: string; phone: string };
  giftWrap: number;
  giftMessage: string;
  couponCode?: string;
  discount: number;
  shipping: number;
}

export interface OrderRecord extends OrderInput {
  status: 'pending_payment' | 'paid' | 'failed';
  providerRef?: string;
  transactionId?: string;
  paidAt?: string;
}

export async function createPendingOrder(o: OrderInput, providerRef?: string): Promise<boolean> {
  const sb = supa();
  if (!sb) return false;
  const { error } = await sb.from('orders').insert({
    order_number: o.orderNumber,
    status: 'pending_payment',
    amount: o.amount,
    currency: 'ILS',
    items: o.items,
    customer: o.customer,
    gift_wrap: o.giftWrap,
    gift_message: o.giftMessage || null,
    coupon_code: o.couponCode || null,
    discount: o.discount,
    shipping: o.shipping,
    provider: 'cardcom',
    provider_ref: providerRef || null,
  });
  return !error;
}

export async function attachProviderRef(orderNumber: string, providerRef: string): Promise<void> {
  const sb = supa();
  if (!sb) return;
  await sb.from('orders').update({ provider_ref: providerRef, updated_at: new Date().toISOString() }).eq('order_number', orderNumber);
}

export async function getOrder(orderNumber: string): Promise<{ status: string; amount: number; paid: boolean } | null> {
  const sb = supa();
  if (!sb) return null;
  const { data } = await sb.from('orders').select('status, amount').eq('order_number', orderNumber).maybeSingle();
  if (!data) return null;
  return { status: data.status, amount: Number(data.amount), paid: data.status === 'paid' };
}

// Idempotent: מסמן "שולם" רק אם ההזמנה קיימת, במצב pending, והסכום שאושר תואם.
// מחזיר 'ok' | 'already' | 'not_found' | 'amount_mismatch' | 'error'.
export async function markOrderPaid(
  orderNumber: string,
  approvedAmount: number,
  transactionId: string,
): Promise<'ok' | 'already' | 'not_found' | 'amount_mismatch' | 'error'> {
  const sb = supa();
  if (!sb) return 'error';
  const { data: existing } = await sb
    .from('orders')
    .select('status, amount')
    .eq('order_number', orderNumber)
    .maybeSingle();
  if (!existing) return 'not_found';
  if (existing.status === 'paid') return 'already';
  if (Math.abs(Number(existing.amount) - approvedAmount) > 0.01) return 'amount_mismatch';

  // עדכון מותנה בסטטוס pending_payment => מונע מירוץ/כפילות webhook.
  const { data: updated, error } = await sb
    .from('orders')
    .update({ status: 'paid', transaction_id: transactionId, paid_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq('order_number', orderNumber)
    .eq('status', 'pending_payment')
    .select('order_number');
  if (error) return 'error';
  if (!updated || updated.length === 0) return 'already'; // מישהו הקדים אותנו
  return 'ok';
}

export async function markOrderFailed(orderNumber: string): Promise<void> {
  const sb = supa();
  if (!sb) return;
  await sb
    .from('orders')
    .update({ status: 'failed', updated_at: new Date().toISOString() })
    .eq('order_number', orderNumber)
    .eq('status', 'pending_payment');
}
