// ⚠️ תיקון מוצר ידני מהיר — MIGRATE_SECRET. יימחק. מגדיר שם למוצר מלאי לפי קוד.
import { NextRequest, NextResponse } from 'next/server';
import { updateProduct } from '@/lib/crm/inventory';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const u = new URL(req.url);
  if (u.searchParams.get('key') !== process.env.MIGRATE_SECRET) return NextResponse.json({ ok: false }, { status: 401 });
  const sku = u.searchParams.get('sku') || '';
  const name = u.searchParams.get('name') || '';
  const res = await updateProduct(sku, { name });
  return NextResponse.json(res);
}
