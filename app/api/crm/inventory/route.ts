// ============================================================
// CRM — API ניהול מלאי פנימי. מוגן ב-isCrmAuthed. ⚠️ אפס כתיבה לאתר.
//   GET  ?search=&filter= → פריטים + סטטיסטיקות
//   POST { action:'adjust', sku, delta, type, reason } → תיקון ידני (יוצר תנועה+audit)
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { listInventory, getInventoryStats, adjustStock, type InvFilter, type MovementType } from '@/lib/crm/inventory';

export const dynamic = 'force-dynamic';

const VALID_MOVE: MovementType[] = ['MANUAL_ADJUSTMENT_IN', 'MANUAL_ADJUSTMENT_OUT', 'DAMAGE_OUT', 'CUSTOMER_RETURN_IN', 'SUPPLIER_RETURN_OUT'];

export async function GET(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const search = url.searchParams.get('search') ?? '';
  const filter = (url.searchParams.get('filter') as InvFilter) ?? 'all';
  const [items, stats] = await Promise.all([listInventory(search, filter, 400), getInventoryStats()]);
  return NextResponse.json({ ok: true, items, stats });
}

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }

  if (body.action === 'adjust') {
    const sku = String(body.sku ?? '');
    const delta = Number(body.delta ?? 0);
    const type = (VALID_MOVE.includes(body.type as MovementType) ? body.type : (delta >= 0 ? 'MANUAL_ADJUSTMENT_IN' : 'MANUAL_ADJUSTMENT_OUT')) as MovementType;
    const reason = String(body.reason ?? '');
    const res = await adjustStock(sku, delta, type, reason);
    return NextResponse.json(res, { status: res.ok ? 200 : 400 });
  }
  return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 });
}
