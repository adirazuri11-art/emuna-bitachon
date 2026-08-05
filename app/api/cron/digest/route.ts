// ============================================================
// דייג'סט יומי לעסק — סיכום מכירות/רווח של 24 השעות האחרונות + קופות נטושות.
// נשלח ע"י Vercel Cron (ראה vercel.json). auth: Bearer CRON_SECRET / ?key=MIGRATE_SECRET.
// לא נשלח כשאין הזמנות (מונע ספאם של "0 מכירות").
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { getProfitOverview } from '@/lib/crm/profit';
import { getAbandonedCheckouts } from '@/lib/crm/abandoned';
import { sendDailyDigest } from '@/lib/order-email';

export const dynamic = 'force-dynamic';

function authed(req: NextRequest): boolean {
  const cron = process.env.CRON_SECRET;
  if (cron && req.headers.get('authorization') === `Bearer ${cron}`) return true;
  const key = new URL(req.url).searchParams.get('key');
  if (key && process.env.MIGRATE_SECRET && key === process.env.MIGRATE_SECRET) return true;
  return false;
}

export async function GET(req: NextRequest) {
  if (!authed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });

  const [profit, abandoned] = await Promise.all([
    getProfitOverview(1), // 24 שעות אחרונות
    getAbandonedCheckouts(30, 100),
  ]);

  if (!profit.ok || profit.ordersCount === 0) {
    return NextResponse.json({ ok: true, skipped: 'no orders in last 24h' });
  }

  const dateLabel = new Date(Date.now() - 86400000).toLocaleDateString('he-IL', {
    timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'long',
  });

  const res = await sendDailyDigest({
    dateLabel,
    revenue: profit.revenue,
    orders: profit.ordersCount,
    grossProfit: profit.grossProfit,
    aov: profit.ordersCount ? Math.round(profit.revenue / profit.ordersCount) : 0,
    abandoned: abandoned.stats.count,
    topCategory: profit.byCategory[0]?.label,
  });

  return NextResponse.json({ ok: res.ok, sent: res.ok, detail: res.detail });
}
