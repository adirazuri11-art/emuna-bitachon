import { NextRequest, NextResponse } from 'next/server';
import { getSocialData, getTokenHealth, loadMetaConfig } from '@/lib/crm/meta';

export const dynamic = 'force-dynamic';

const GRAPH = 'https://graph.facebook.com/v21.0';

// בדיקת חיבור Meta — מוגן ב-MIGRATE_SECRET. מחזיר סיכום לא-סודי + אבחון גולמי.
export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!secret || key !== secret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  // ---- אבחון גולמי ----
  const cfg = await loadMetaConfig();
  const diag: Record<string, unknown> = {};
  if (cfg.token && cfg.pageId) {
    const call = async (path: string, params: Record<string, string>) => {
      try {
        const url = `${GRAPH}/${path}?${new URLSearchParams({ ...params, access_token: cfg.token! })}`;
        const r = await fetch(url, { cache: 'no-store' });
        return await r.json();
      } catch (e) {
        return { error: e instanceof Error ? e.message : 'fetch error' };
      }
    };
    diag.igLink = await call(cfg.pageId, { fields: 'name,instagram_business_account{id,username}' });
    // הרשאות הטוקן בפועל (self-inspect)
    const dbg = (await call('debug_token', { input_token: cfg.token })) as { data?: { scopes?: string[]; type?: string } };
    diag.tokenType = dbg?.data?.type;
    diag.actualScopes = dbg?.data?.scopes;
  }

  const d = await getSocialData();
  const health = await getTokenHealth();
  return NextResponse.json({
    configured: d.configured,
    instagram: d.instagram
      ? { username: d.instagram.username, followers: d.instagram.followers, media: d.instagram.mediaCount, recentPosts: d.instagram.recentPosts.length, engagementRate: d.instagram.engagementRate }
      : null,
    facebook: d.facebook ? { name: d.facebook.name, fans: d.facebook.fans, followers: d.facebook.followers, reachWeek: d.facebook.reachWeek } : null,
    insightsPoints: {
      igReach: d.insights.igReach.length,
      igFollowerGrowth: d.insights.igFollowerGrowth.length,
      fbImpressions: d.insights.fbImpressions.length,
      fbEngagement: d.insights.fbEngagement.length,
    },
    tokenDaysLeft: health.daysLeft,
    tokenScopes: health.scopes,
    diag,
  });
}
