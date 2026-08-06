// CRM — סריקת מסמך ספק חכמה (v2). isCrmAuthed + rate-limit + ולידציה. ⚠️ רק חילוץ, לא מעדכן מלאי.
import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { parseInvoiceSmart } from '@/lib/crm/inventory-v2/doc-engine';

export const dynamic = 'force-dynamic';

const ALLOWED = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
const MAX = 15 * 1024 * 1024; // 15MB
const hits = new Map<string, number[]>();

function limited(ip: string): boolean {
  const now = Date.now();
  const arr = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  arr.push(now); hits.set(ip, arr);
  return arr.length > 20;
}

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? 'local';
  if (limited(ip)) return NextResponse.json({ ok: false, error: 'יותר מדי בקשות — נסה שוב בעוד דקה' }, { status: 429 });

  let body: { image?: string; mimeType?: string; fileName?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }

  const b64 = (body.image ?? '').replace(/^data:[^;]+;base64,/, '');
  const mimeType = body.mimeType ?? 'application/pdf';
  const fileName = body.fileName ?? '';
  if (!b64) return NextResponse.json({ ok: false, error: 'לא התקבל קובץ' }, { status: 400 });
  if (!ALLOWED.includes(mimeType) && !/\.(pdf|jpe?g|png|webp|heic|heif)$/i.test(fileName)) {
    return NextResponse.json({ ok: false, error: 'סוג קובץ לא נתמך' }, { status: 415 });
  }
  if (b64.length * 0.75 > MAX) return NextResponse.json({ ok: false, error: 'הקובץ גדול מדי (מקס׳ 15MB)' }, { status: 413 });

  const result = await parseInvoiceSmart(b64, mimeType, fileName);
  return NextResponse.json(result, { status: result.ok ? 200 : (result.needsKey ? 503 : 400) });
}
