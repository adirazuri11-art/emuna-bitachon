import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// שליפת רשומות ה-DNS של הדומיין מ-Resend (ערכים מלאים) — מוגן ב-MIGRATE_SECRET.
export async function GET(req: NextRequest) {
  const secret = process.env.MIGRATE_SECRET;
  const key = req.nextUrl.searchParams.get('key');
  if (!secret || key !== secret) {
    return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  }
  const rk = process.env.RESEND_API_KEY;
  if (!rk) return NextResponse.json({ ok: false, error: 'no RESEND_API_KEY' }, { status: 500 });

  const h = { authorization: `Bearer ${rk}` };
  try {
    const list = (await (await fetch('https://api.resend.com/domains', { headers: h, cache: 'no-store' })).json()) as {
      data?: Array<{ id: string; name: string; status: string }>;
    };
    const domain = (list.data ?? []).find((d) => d.name === 'emunavebitachon.co.il') ?? list.data?.[0];
    if (!domain) return NextResponse.json({ ok: false, error: 'domain not found in Resend', list });
    const detail = (await (await fetch(`https://api.resend.com/domains/${domain.id}`, { headers: h, cache: 'no-store' })).json()) as {
      records?: unknown[];
      status?: string;
    };
    return NextResponse.json({ ok: true, id: domain.id, status: detail.status ?? domain.status, records: detail.records });
  } catch (e) {
    return NextResponse.json({ ok: false, error: e instanceof Error ? e.message : 'resend api error' }, { status: 502 });
  }
}
