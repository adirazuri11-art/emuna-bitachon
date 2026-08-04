import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

const BANK = 'https://emuna-content.surge.sh';

// טעינת תור הפוסטים מבנק התוכן (queue.json ב-Surge) → public.social_queue.
// מוגן ב-MIGRATE_SECRET. idempotent: on conflict מעדכן תמונה/קופי אך שומר status.
// &reset=1 → אתחול סטטוסים חזרה ל-pending.
export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  if (!secret || req.nextUrl.searchParams.get('key') !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  let queue: Array<{ idx: number; image: string; caption: string; category: string }>;
  try {
    const r = await fetch(`${BANK}/queue.json`, { cache: 'no-store' });
    queue = await r.json();
  } catch (e) {
    return NextResponse.json({ ok: false, error: 'failed to fetch queue.json: ' + (e instanceof Error ? e.message : '') }, { status: 502 });
  }
  if (!Array.isArray(queue) || !queue.length) return NextResponse.json({ ok: false, error: 'empty queue' }, { status: 400 });

  const reset = req.nextUrl.searchParams.get('reset') === '1';
  let n = 0;
  for (const q of queue) {
    const url = `${BANK}/png/${q.image}`;
    await prisma.$executeRawUnsafe(
      `insert into public.social_queue (idx, image_url, caption, category, status)
       values ($1,$2,$3,$4,'pending')
       on conflict (idx) do update set image_url=excluded.image_url, caption=excluded.caption, category=excluded.category${reset ? ", status='pending', error=null, published_at=null, fb_post_id=null, ig_post_id=null" : ''}`,
      q.idx, url, q.caption, q.category,
    );
    n++;
  }
  const stats = (await prisma.$queryRawUnsafe(`select status, count(*)::int as n from public.social_queue group by status`)) as Array<{ status: string; n: number }>;
  return NextResponse.json({ ok: true, seeded: n, stats });
}
