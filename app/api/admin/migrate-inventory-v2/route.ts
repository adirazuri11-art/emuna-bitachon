// מיגרציה למודול המלאי החדש — MIGRATE_SECRET. additive בלבד (if not exists), הפיך, בטוח.
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { INVENTORY_V2_STATEMENTS } from '@/lib/crm/inventory-v2/schema';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (req.nextUrl.searchParams.get('key') !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const applied: number[] = [];
  try {
    for (let i = 0; i < INVENTORY_V2_STATEMENTS.length; i++) {
      await prisma.$executeRawUnsafe(INVENTORY_V2_STATEMENTS[i]);
      applied.push(i);
    }
    // אימות: קריאת עמודות חדשות מרכזיות מוכיחה שהסכימה עודכנה.
    const cols = (await prisma.$queryRawUnsafe(
      `select column_name from information_schema.columns
       where table_schema='public' and table_name='inventory_items'
         and column_name in ('landed_cost','quantity_good','quantity_damaged','image_gallery','tags')`,
    )) as Array<{ column_name: string }>;
    return NextResponse.json({ ok: true, statements: INVENTORY_V2_STATEMENTS.length, newColsVerified: cols.length });
  } catch (e) {
    return NextResponse.json(
      { ok: false, appliedCount: applied.length, failedAt: applied.length, error: e instanceof Error ? e.message : 'migration failed' },
      { status: 500 },
    );
  }
}
