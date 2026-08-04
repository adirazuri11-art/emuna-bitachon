import { NextRequest, NextResponse } from 'next/server';
import { publishNext, getQueueStats } from '@/lib/social/post';
import { isCrmAuthed } from '@/lib/crm/auth';

export const dynamic = 'force-dynamic';

// נקרא ע"י Vercel Cron (3 פעמים/יום). מפרסם פוסט אחד בכל הפעלה, דילוג בשבת.
// Auth: Bearer CRON_SECRET (Vercel Cron) / session CRM / ?key=MIGRATE_SECRET (בדיקה ידנית).
function authorized(req: NextRequest): boolean {
  const cron = process.env.CRON_SECRET;
  if (cron && req.headers.get('authorization') === `Bearer ${cron}`) return true;
  const mig = process.env.MIGRATE_SECRET;
  if (mig && req.nextUrl.searchParams.get('key') === mig) return true;
  return isCrmAuthed(req);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const dry = req.nextUrl.searchParams.get('dry') === '1';
  const result = await publishNext({ dryRun: dry });
  const stats = await getQueueStats();
  return NextResponse.json({ ok: true, result, stats, at: new Date().toISOString() });
}
