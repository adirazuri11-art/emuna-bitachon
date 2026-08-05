// CRM — סריקת חשבונית ספק (AI ראייה). מוגן ב-isCrmAuthed + rate-limit + ולידציית קובץ.
import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { parseInvoiceImage } from '@/lib/crm/invoice-ocr';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf'];
const MAX_BYTES = 12 * 1024 * 1024; // ~12MB

// rate-limit פשוט בזיכרון (אדמין יחיד) — עד 20 סריקות בדקה.
let bucket: { t: number; n: number } = { t: 0, n: 0 };
function rateLimited(): boolean {
  const now = Date.now();
  if (now - bucket.t > 60_000) bucket = { t: now, n: 0 };
  bucket.n++;
  return bucket.n > 20;
}

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  if (rateLimited()) return NextResponse.json({ ok: false, error: 'יותר מדי סריקות — נסה עוד רגע' }, { status: 429 });

  let body: { image?: string; mimeType?: string };
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  const image = String(body.image ?? '');
  const mimeType = String(body.mimeType ?? '');
  if (!image) return NextResponse.json({ ok: false, error: 'לא התקבל קובץ' }, { status: 400 });
  if (!ALLOWED.includes(mimeType)) return NextResponse.json({ ok: false, error: 'סוג קובץ לא נתמך (תמונה או PDF בלבד)' }, { status: 400 });
  if (image.length * 0.75 > MAX_BYTES) return NextResponse.json({ ok: false, error: 'הקובץ גדול מדי (עד 12MB)' }, { status: 413 });

  const parsed = await parseInvoiceImage(image, mimeType);
  return NextResponse.json(parsed, { status: parsed.ok ? 200 : (parsed.needsKey ? 503 : 400) });
}
