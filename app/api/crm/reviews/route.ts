// CRM — ניהול ומודרציה של ביקורות. מוגן ב-isCrmAuthed.
import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { listReviews, setReviewStatus, type ReviewStatus } from '@/lib/reviews';

export const dynamic = 'force-dynamic';

const STATUSES: ReviewStatus[] = ['pending', 'approved', 'rejected'];

export async function GET(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const s = req.nextUrl.searchParams.get('status');
  const status = s && STATUSES.includes(s as ReviewStatus) ? (s as ReviewStatus) : undefined;
  const reviews = await listReviews(status);
  return NextResponse.json({ ok: true, reviews });
}

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = String(b.id ?? '');
  const status = b.status as ReviewStatus;
  if (!id || !STATUSES.includes(status)) return NextResponse.json({ ok: false, error: 'bad-input' }, { status: 400 });
  const ok = await setReviewStatus(id, status);
  return NextResponse.json({ ok });
}
