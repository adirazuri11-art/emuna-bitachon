// ⚠️ בדיקה זמנית — MIGRATE_SECRET. מאמת cost/margin/image מול ה-DB האמיתי. יימחק.
import { NextRequest, NextResponse } from 'next/server';
import { getInventoryItem } from '@/lib/crm/inventory';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (new URL(req.url).searchParams.get('key') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }
  const skus = ['UK83140', 'UK46232', 'UK81668'];
  const out: Record<string, unknown> = {};
  for (const s of skus) {
    const it = await getInventoryItem(s);
    out[s] = it && {
      title: it.title,
      inCatalog: it.inCatalog,
      cost: it.lastPurchasePrice,
      salePrice: it.salePrice,
      margin: it.margin,
      marginPct: it.marginPct,
      imageStartsWith: it.image?.slice(0, 48),
    };
  }
  return NextResponse.json({ ok: true, items: out });
}
