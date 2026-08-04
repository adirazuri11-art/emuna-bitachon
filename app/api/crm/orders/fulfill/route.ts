import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { updateOrderFulfillment, type Fulfillment } from '@/lib/crm/orders';

export const dynamic = 'force-dynamic';

const VALID: Fulfillment[] = ['in_progress', 'shipping', 'completed'];

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let body: { orderNumber?: string; status?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 });
  }
  const orderNumber = String(body.orderNumber ?? '');
  const status = String(body.status ?? '') as Fulfillment;
  if (!orderNumber || !VALID.includes(status)) {
    return NextResponse.json({ ok: false, error: 'invalid params' }, { status: 400 });
  }
  const ok = await updateOrderFulfillment(orderNumber, status);
  return NextResponse.json({ ok });
}
