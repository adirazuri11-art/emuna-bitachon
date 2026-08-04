import { NextRequest, NextResponse } from 'next/server';
import { getSocialData, getTokenHealth } from '@/lib/crm/meta';

export const dynamic = 'force-dynamic';

// בדיקת חיבור Meta — מוגן ב-MIGRATE_SECRET. מחזיר סיכום לא-סודי.
export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!secret || key !== secret) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

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
  });
}
