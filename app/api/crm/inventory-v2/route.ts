// CRM — API מרכז ניהול המלאי (Phase 1). מוגן ב-isCrmAuthed. ⚠️ אפס כתיבה לאתר.
import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { listInventoryV2, getInvV2Kpis, type InvV2Filter } from '@/lib/crm/inventory-v2/model';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const url = new URL(req.url);
  const search = url.searchParams.get('search') ?? '';
  const filter = (url.searchParams.get('filter') as InvV2Filter) ?? 'all';
  const [rows, kpis] = await Promise.all([listInventoryV2(search, filter, 1500), getInvV2Kpis()]);
  return NextResponse.json({ ok: true, rows, kpis });
}
