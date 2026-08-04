// ============================================================
// פרסום אוטומטי לפייסבוק + אינסטגרם מתוך תור בנק התוכן (public.social_queue).
// שלושה פוסטים ביום, דילוג בשבת (שישי אחרי הדלקת נרות → מוצ"ש). server-only.
// ============================================================
import 'server-only';
import { prisma } from '@/lib/prisma';
import { loadMetaConfig } from '@/lib/crm/meta';
import { getShabbatTimes } from '@/lib/hebcal';

const GRAPH = 'https://graph.facebook.com/v21.0';

export interface QueueRow { idx: number; image_url: string; caption: string; category: string | null; status: string; }

// ---- גיזור שבת: אין פרסום מכניסת שבת (שישי) ועד מוצ"ש (שבת כל היום) ----
export async function isShabbatWindow(now = new Date()): Promise<{ block: boolean; reason: string }> {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Jerusalem', weekday: 'short', hour: '2-digit', minute: '2-digit', hour12: false }).formatToParts(now);
  const wd = parts.find((p) => p.type === 'weekday')?.value ?? '';
  const hh = Number(parts.find((p) => p.type === 'hour')?.value ?? '0');
  const mm = Number(parts.find((p) => p.type === 'minute')?.value ?? '0');
  const mins = hh * 60 + mm;
  if (wd === 'Sat') return { block: true, reason: 'שבת' };
  if (wd === 'Fri') {
    let cl = 18 * 60; // ברירת מחדל בטוחה אם Hebcal לא זמין
    try { const st = await getShabbatTimes(); if (st?.candleLighting) { const [h, m] = st.candleLighting.split(':').map(Number); cl = h * 60 + m - 5; } } catch { /* fallback */ }
    if (mins >= cl) return { block: true, reason: 'שישי אחרי כניסת שבת' };
  }
  return { block: false, reason: '' };
}

async function graphPost(path: string, body: Record<string, string>): Promise<{ ok: boolean; id?: string; error?: string }> {
  try {
    const res = await fetch(`${GRAPH}/${path}`, { method: 'POST', headers: { 'content-type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(body), cache: 'no-store' });
    const d = await res.json();
    if (d.error) return { ok: false, error: `${d.error.message} (code ${d.error.code})` };
    return { ok: true, id: d.id ?? d.post_id };
  } catch (e) { return { ok: false, error: e instanceof Error ? e.message : 'fetch' }; }
}

export async function postToFacebook(pageId: string, token: string, imageUrl: string, caption: string) {
  return graphPost(`${pageId}/photos`, { url: imageUrl, caption, access_token: token });
}

// אינסטגרם: 1) יצירת container 2) פרסום
export async function postToInstagram(igId: string, token: string, imageUrl: string, caption: string) {
  const c = await graphPost(`${igId}/media`, { image_url: imageUrl, caption, access_token: token });
  if (!c.ok || !c.id) return { ok: false, error: `container: ${c.error}` };
  return graphPost(`${igId}/media_publish`, { creation_id: c.id, access_token: token });
}

export async function getQueueStats() {
  const rows = (await prisma.$queryRawUnsafe(`select status, count(*)::int as n from public.social_queue group by status`)) as Array<{ status: string; n: number }>;
  const by: Record<string, number> = {}; for (const r of rows) by[r.status] = r.n;
  const next = (await prisma.$queryRawUnsafe(`select idx, category from public.social_queue where status='pending' order by idx limit 1`)) as Array<{ idx: number; category: string }>;
  return { pending: by.pending ?? 0, published: by.published ?? 0, failed: by.failed ?? 0, next: next[0] ?? null };
}

// פרסום הפוסט הבא בתור (idx נמוך). מחזיר תוצאה מפורטת.
export async function publishNext(opts: { dryRun?: boolean } = {}) {
  const shab = await isShabbatWindow();
  if (shab.block) return { skipped: true, reason: shab.reason };

  const rows = (await prisma.$queryRawUnsafe(`select idx, image_url, caption, category, status from public.social_queue where status='pending' order by idx limit 1`)) as QueueRow[];
  if (!rows.length) return { done: true, reason: 'התור ריק — כל הפוסטים פורסמו' };
  const post = rows[0];

  const cfg = await loadMetaConfig();
  const pageId = cfg.pageId; const token = cfg.token;
  if (!token || !pageId) return { error: 'Meta token/page missing', idx: post.idx };

  // resolve IG id
  let igId = cfg.igId;
  if (!igId) {
    try { const r = await fetch(`${GRAPH}/${pageId}?fields=instagram_business_account&access_token=${encodeURIComponent(token)}`, { cache: 'no-store' }); const d = await r.json(); igId = d?.instagram_business_account?.id; } catch { /* */ }
  }

  if (opts.dryRun) return { dryRun: true, wouldPublish: { idx: post.idx, category: post.category, image: post.image_url }, igResolved: !!igId, shabbat: shab };

  const fb = await postToFacebook(pageId, token, post.image_url, post.caption);
  const ig = igId ? await postToInstagram(igId, token, post.image_url, post.caption) : { ok: false, error: 'no IG id' };

  const ok = fb.ok || ig.ok;
  if (ok) {
    await prisma.$executeRawUnsafe(`update public.social_queue set status='published', fb_post_id=$2, ig_post_id=$3, published_at=now(), error=$4 where idx=$1`,
      post.idx, fb.id ?? null, ig.id ?? null, (fb.ok && ig.ok) ? null : `fb:${fb.error ?? 'ok'} | ig:${ig.error ?? 'ok'}`);
  } else {
    await prisma.$executeRawUnsafe(`update public.social_queue set status='failed', error=$2 where idx=$1`, post.idx, `fb:${fb.error} | ig:${ig.error}`);
  }
  return { published: ok, idx: post.idx, facebook: fb, instagram: ig };
}
