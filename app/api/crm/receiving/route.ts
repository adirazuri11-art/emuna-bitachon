// ============================================================
// CRM — API קליטת סחורה מחשבונית ספק. מוגן ב-isCrmAuthed. ⚠️ אפס כתיבה לאתר.
//   GET  ?code=UK49849 → חיפוש מוצר לפי קוד ספק (live)
//   GET                → רשימת חשבוניות אחרונות
//   POST { action:'approve', invoiceNumber, invoiceDate?, vat?, lines:[...] } → קליטה + עדכון מלאי
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { isCrmAuthed } from '@/lib/crm/auth';
import { lookupSupplierCode, approveIntake, listInvoices, type IntakeLineInput } from '@/lib/crm/receiving';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  const code = new URL(req.url).searchParams.get('code');
  if (code) return NextResponse.json({ ok: true, lookup: await lookupSupplierCode(code) });
  return NextResponse.json({ ok: true, invoices: await listInvoices(50) });
}

export async function POST(req: NextRequest) {
  if (!isCrmAuthed(req)) return NextResponse.json({ ok: false, error: 'unauthorized' }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'bad request' }, { status: 400 }); }
  if (body.action !== 'approve') return NextResponse.json({ ok: false, error: 'unknown action' }, { status: 400 });

  const lines: IntakeLineInput[] = Array.isArray(body.lines)
    ? (body.lines as unknown[]).map((l) => {
        const o = l as Record<string, unknown>;
        return { supplierCode: String(o.supplierCode ?? ''), quantity: Number(o.quantity ?? 0), unitCost: Number(o.unitCost ?? 0), rawName: o.rawName ? String(o.rawName) : undefined };
      })
    : [];

  const res = await approveIntake({
    supplierName: body.supplierName ? String(body.supplierName) : undefined,
    invoiceNumber: String(body.invoiceNumber ?? ''),
    invoiceDate: body.invoiceDate ? String(body.invoiceDate) : null,
    vat: body.vat != null ? Number(body.vat) : null,
    fileHash: body.fileHash ? String(body.fileHash) : null,
    lines,
  });
  return NextResponse.json(res, { status: res.ok ? 200 : (res.duplicate ? 409 : 400) });
}
