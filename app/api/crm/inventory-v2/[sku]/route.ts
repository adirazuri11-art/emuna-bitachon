// CRM — API כרטיס מוצר v2 (כתיבות). isCrmAuthed. ⚠️ CRM בלבד.
import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { getInvV2Item } from '@/lib/crm/inventory-v2/item';
import { saveProductImage, setMainImageVersion, saveNotes, updateProductFields } from '@/lib/crm/inventory-v2/mutations';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: { sku: string } }) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const item = await getInvV2Item(decodeURIComponent(params.sku));
  if (!item) return NextResponse.json({ ok: false, error: 'not found' }, { status: 404 });
  return NextResponse.json({ ok: true, item });
}

export async function POST(req: NextRequest, { params }: { params: { sku: string } }) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const sku = decodeURIComponent(params.sku);
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }

  switch (body.action) {
    case 'saveImage': {
      const res = await saveProductImage(sku, String(body.imageUrl ?? ''), body.setMain !== false);
      return NextResponse.json(res, { status: res.ok ? 200 : 400 });
    }
    case 'setMainImage': {
      const res = await setMainImageVersion(sku, String(body.versionId ?? ''));
      return NextResponse.json(res, { status: res.ok ? 200 : 400 });
    }
    case 'saveNotes': {
      const res = await saveNotes(sku, String(body.notes ?? ''));
      return NextResponse.json(res, { status: res.ok ? 200 : 400 });
    }
    case 'updateFields': {
      const res = await updateProductFields(sku, (body.fields as Record<string, unknown>) ?? {});
      return NextResponse.json(res, { status: res.ok ? 200 : 400 });
    }
    default:
      return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 });
  }
}
