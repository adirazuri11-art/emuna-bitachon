// ============================================================
// GET /api/google-merchant/status — דוח ניטור לפיד ה-Merchant Center.
// מזין את מסך הניטור ב-CRM. ללא Secrets. מוגן: CRM auth או MIGRATE_SECRET.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { PRODUCTS } from '@/lib/catalog';
import { buildFeedItems, isEligible, validateFeed, SITE_URL, FEED_PATH } from '@/lib/google-merchant/feed';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const key = req.nextUrl.searchParams.get('key');
  if (!isCrmAuthed(req) && key !== process.env.MIGRATE_SECRET) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }

  const total = PRODUCTS.length;
  const excluded = PRODUCTS.filter((p) => !isEligible(p));
  const items = buildFeedItems();
  const { issues, duplicates } = validateFeed(items);

  const availability = items.reduce<Record<string, number>>((a, it) => {
    a[it.availability] = (a[it.availability] ?? 0) + 1;
    return a;
  }, {});

  const byCategory = items.reduce<Record<string, number>>((a, it) => {
    a[it.productType] = (a[it.productType] ?? 0) + 1;
    return a;
  }, {});

  const withSale = items.filter((it) => it.salePrice).length;
  const remoteImages = items.filter((it) => /^https?:\/\/(www\.)?israel-judaica\.com/.test(it.imageLink)).length;

  return NextResponse.json({
    ok: true,
    feedUrl: `${SITE_URL}${FEED_PATH}`,
    generatedAt: new Date().toISOString(),
    products: {
      totalInCatalog: total,
      inFeed: items.length,
      excluded: excluded.length,
      excludedIds: excluded.slice(0, 50).map((p) => p.id),
    },
    availability,
    withSalePrice: withSale,
    remoteImages,
    integrity: {
      duplicates: duplicates.length,
      duplicateIds: duplicates.slice(0, 20),
      issueCount: issues.length,
      issues: issues.slice(0, 50),
    },
    byProductType: byCategory,
  });
}
