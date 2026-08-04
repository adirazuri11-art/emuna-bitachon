import { NextRequest, NextResponse } from 'next/server';
import { loadMetaConfig } from '@/lib/crm/meta';

export const dynamic = 'force-dynamic';
const GRAPH = 'https://graph.facebook.com/v21.0';

// בדיקת יכולת פרסום ל-Meta — מוגן ב-MIGRATE_SECRET.
// מחזיר: זהות העמוד, ההרשאות שניתנו, מזהה IG, והאם יש הרשאות פרסום.
export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  if (!secret || req.nextUrl.searchParams.get('key') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const cfg = await loadMetaConfig();
  if (!cfg.token) return NextResponse.json({ ok: false, error: 'no META_PAGE_ACCESS_TOKEN' }, { status: 400 });
  const t = encodeURIComponent(cfg.token);

  async function g(pathq: string) {
    try {
      const r = await fetch(`${GRAPH}/${pathq}${pathq.includes('?') ? '&' : '?'}access_token=${t}`, { cache: 'no-store' });
      return await r.json();
    } catch (e) { return { error: e instanceof Error ? e.message : 'fetch' }; }
  }

  const me = await g('me?fields=id,name,category');
  const perms = await g('me/permissions');
  const igLink = cfg.pageId ? await g(`${cfg.pageId}?fields=instagram_business_account{id,username,followers_count}`) : { note: 'no pageId' };

  const granted = Array.isArray(perms?.data) ? perms.data.filter((p: any) => p.status === 'granted').map((p: any) => p.permission) : [];
  const need = ['pages_manage_posts', 'pages_read_engagement', 'instagram_basic', 'instagram_content_publish', 'business_management'];
  const missing = need.filter((p) => !granted.includes(p));
  const igId = igLink?.instagram_business_account?.id ?? cfg.igId ?? null;

  return NextResponse.json({
    ok: true,
    page: me,
    pageId: cfg.pageId,
    tokenSource: cfg.source,
    instagram: igLink?.instagram_business_account ?? null,
    igId,
    grantedPermissions: granted,
    missingForPosting: missing,
    canPostFacebook: granted.includes('pages_manage_posts'),
    canPostInstagram: granted.includes('instagram_content_publish') && granted.includes('instagram_basic') && !!igId,
  });
}
