import { NextRequest, NextResponse } from 'next/server';
import { refreshLongLivedToken, getTokenHealth } from '@/lib/crm/meta';
import { isCrmAuthed } from '@/lib/crm/auth';

export const dynamic = 'force-dynamic';

// Called by Vercel Cron (daily) or manually from the CRM.
// Auth: Vercel Cron secret (Bearer CRON_SECRET) OR an authenticated CRM session.
function authorized(req: NextRequest): boolean {
  const secret = process.env.CRON_SECRET;
  const bearer = req.headers.get('authorization');
  if (secret && bearer === `Bearer ${secret}`) return true;
  return isCrmAuthed(req);
}

export async function GET(req: NextRequest) {
  if (!authorized(req)) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const result = await refreshLongLivedToken();
  const health = await getTokenHealth();
  return NextResponse.json({ ...result, health }, { status: result.ok ? 200 : 400 });
}
