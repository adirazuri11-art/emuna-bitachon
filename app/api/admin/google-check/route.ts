import { NextRequest, NextResponse } from 'next/server';
import { getGoogleData, googleDiagnostic } from '@/lib/crm/google';

export const dynamic = 'force-dynamic';

// בדיקת חיבור Google — מוגן ב-MIGRATE_SECRET. מחזיר סיכום לא-סודי.
export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!secret || key !== secret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const env = {
    hasEmail: !!process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    hasKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY,
    hasGa4Property: !!process.env.GA4_PROPERTY_ID,
    hasGscSite: !!process.env.GSC_SITE_URL,
  };
  const diag = await googleDiagnostic();
  const d = await getGoogleData();
  return NextResponse.json({
    env,
    diag,
    configured: d.configured,
    ga4: d.ga4 ? { users30d: d.ga4.users30d, sessions30d: d.ga4.sessions30d, conversions30d: d.ga4.conversions30d } : null,
    gsc: d.gsc ? { clicks: d.gsc.clicks, impressions: d.gsc.impressions, ctr: d.gsc.ctr, position: d.gsc.position, topQueries: d.gsc.topQueries.slice(0, 3) } : null,
  });
}
