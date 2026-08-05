// ============================================================
// POST /api/crm/meta/connect — חיבור Meta מתוך תיבת החיבור ב-CRM.
// מקבל טוקן, מאמת מול Graph API, מזהה עמוד + IG, ושומר ל-Neon (meta_config).
// מוגן ב-isCrmAuthed. הטוקן לעולם לא מוחזר ללקוח.
// ============================================================
import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { saveMetaConfig } from '@/lib/crm/meta';

export const dynamic = 'force-dynamic';
const GRAPH = 'https://graph.facebook.com/v21.0';

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const body = await req.json().catch(() => null);
  const token = typeof body?.token === 'string' ? body.token.trim() : '';
  if (!token || token.length < 40) return NextResponse.json({ ok: false, error: 'טוקן לא תקין' }, { status: 400 });

  const t = encodeURIComponent(token);
  async function g(path: string) {
    try { const r = await fetch(`${GRAPH}/${path}${path.includes('?') ? '&' : '?'}access_token=${t}`, { cache: 'no-store' }); return await r.json(); } catch { return null; }
  }

  // אימות: מי אני + הרשאות
  const me = await g('me?fields=id,name');
  if (!me || me.error) {
    return NextResponse.json({ ok: false, error: me?.error?.message ?? 'הטוקן נדחה ע"י Meta (אולי פג תוקף)' }, { status: 400 });
  }
  const perms = await g('me/permissions');
  const granted: string[] = Array.isArray(perms?.data) ? perms.data.filter((p: { status: string }) => p.status === 'granted').map((p: { permission: string }) => p.permission) : [];

  // זיהוי עמוד ה-FB + חשבון IG המקושר
  let pageId: string | undefined;
  let igId: string | undefined;
  const pages = await g('me/accounts?fields=id,name,instagram_business_account');
  if (Array.isArray(pages?.data) && pages.data.length) {
    const page = pages.data[0];
    pageId = page.id;
    igId = page.instagram_business_account?.id;
  } else if (me.id) {
    // אולי הטוקן כבר של עמוד
    pageId = me.id;
    const link = await g(`${me.id}?fields=instagram_business_account`);
    igId = link?.instagram_business_account?.id;
  }

  const saved = await saveMetaConfig(token, igId, pageId);
  if (!saved) return NextResponse.json({ ok: false, error: 'שמירה נכשלה' }, { status: 500 });

  return NextResponse.json({
    ok: true,
    page: me.name ?? null,
    pageId: pageId ?? null,
    igConnected: !!igId,
    canReadInsights: granted.includes('pages_read_engagement'),
    canPost: granted.includes('pages_manage_posts'),
    canPostInstagram: granted.includes('instagram_content_publish') && !!igId,
    permissions: granted,
  });
}
