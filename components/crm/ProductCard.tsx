'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ChevronRight, Pencil, Check, X, Loader2 } from 'lucide-react';
import { ImageManager } from './ImageManager';
import { QuickEditProduct } from './QuickEditProduct';

interface Row {
  sku: string; supplierCode: string | null; barcode: string | null; name: string; internalDescription: string | null; category: string;
  supplierName: string | null; brand: string | null; image?: string; warehouseLocation: string | null;
  quantityOnHand: number; quantityGood: number; quantityDamaged: number; minimumStock: number | null;
  lastPurchaseCost: number | null; landedCost: number | null; retailPrice: number | null; clubPrice: number | null;
  profitAmount: number | null; profitMarginPercent: number | null; markupPercent: number | null;
  inventoryValueAtCost: number | null; inventoryValueAtRetail: number | null;
  lastReceivedAt: string | null; lastSoldAt: string | null; status: string; inCatalog: boolean;
}
interface Movement { id: string; type: string; change: number; before: number; after: number; document: string | null; reason: string | null; unitCost: number | null; createdBy: string | null; createdAt: string }
interface ImgVer { id: string; imageUrl: string; isMain: boolean; source: string; createdAt: string }
interface Audit { id: string; action: string; userId: string | null; createdAt: string }
interface InvLine { id: string; supplierName: string | null; invoiceNumber: string | null; quantity: number; unitCost: number | null; createdAt: string }
export interface InvV2ItemClient { row: Row; notes: string | null; movements: Movement[]; imageVersions: ImgVer[]; audit: Audit[]; invoiceLines: InvLine[] }

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number | null) => (n != null ? `₪${nf(Math.round(n))}` : '—');
const dt = (s: string | null) => (s ? new Date(s).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');
const dataUrl = (s?: string) => !!s && s.startsWith('data:');

const MOVEMENT_LABELS: Record<string, string> = {
  OPENING_BALANCE_IN: 'מלאי פתיחה', PURCHASE_IN: 'קליטת סחורה', SALE_OUT: 'מכירה (קבלה)',
  CUSTOMER_RETURN_IN: 'החזרת לקוח', SUPPLIER_RETURN_OUT: 'החזרה לספק', DAMAGE_OUT: 'פגם/בלאי',
  MANUAL_ADJUSTMENT_IN: 'תיקון ידני (+)', MANUAL_ADJUSTMENT_OUT: 'תיקון ידני (−)',
  STOCK_COUNT_CORRECTION_IN: 'תיקון ספירה (+)', STOCK_COUNT_CORRECTION_OUT: 'תיקון ספירה (−)',
  SYSTEM_RESET_TO_ZERO: 'איפוס מערכת', CREDIT_NOTE_RETURN_IN: 'זיכוי',
};

const TABS = [
  'סקירה כללית', 'מלאי', 'תמונות', 'מחירים ורווחיות', 'ספקים ורכש', 'חשבוניות ספק',
  'מכירות וקבלות', 'החזרות וזיכויים', 'ספירות מלאי', 'תנועות מלאי', 'מסמכים', 'הערות', 'Audit Log',
];

function Field({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-[11px] text-cream/45">{label}</div>
      <div className={`mt-1 text-sm font-semibold ${tone ?? 'text-cream'}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

function Soon({ phase }: { phase: string }) {
  return <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-cream/40">מודול זה מתמלא בנתונים אמיתיים ב{phase}. עד אז אין כאן נתונים.</div>;
}

export function ProductCard({ item }: { item: InvV2ItemClient }) {
  const r = item.row;
  const [tab, setTab] = useState(0);
  const [notes, setNotes] = useState(item.notes ?? '');
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesMsg, setNotesMsg] = useState<string | null>(null);
  const [edit, setEdit] = useState(false);
  const [form, setForm] = useState({
    name: r.name, brand: r.brand ?? '', barcode: r.barcode ?? '', warehouseLocation: r.warehouseLocation ?? '',
    minimumStock: r.minimumStock ?? '', additionalUnitCost: '', retailPriceOverride: '', clubPriceOverride: '',
  });
  const [saving, setSaving] = useState(false);

  const post = async (body: object) => {
    const res = await fetch(`/api/crm/inventory-v2/${encodeURIComponent(r.sku)}`, {
      method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
    });
    return res.json();
  };

  const saveFields = async () => {
    setSaving(true);
    const fields: Record<string, unknown> = { name: form.name, brand: form.brand, barcode: form.barcode, warehouseLocation: form.warehouseLocation, minimumStock: form.minimumStock };
    if (form.additionalUnitCost !== '') fields.additionalUnitCost = form.additionalUnitCost;
    if (form.retailPriceOverride !== '') fields.retailPriceOverride = form.retailPriceOverride;
    if (form.clubPriceOverride !== '') fields.clubPriceOverride = form.clubPriceOverride;
    const data = await post({ action: 'updateFields', fields });
    setSaving(false);
    if (data.ok) { setEdit(false); location.reload(); }
  };

  const saveNotes = async () => {
    setNotesSaving(true); setNotesMsg(null);
    const data = await post({ action: 'saveNotes', notes });
    setNotesSaving(false);
    setNotesMsg(data.ok ? 'נשמר ✓' : (data.error || 'נכשל'));
  };

  const input = 'w-full rounded-lg border border-gold/20 bg-[#0B132B] px-3 py-2 text-sm text-cream outline-none focus:border-gold/60';

  return (
    <div className="space-y-5">
      <Link href="/crm/inventory-v2" className="inline-flex items-center gap-1 text-sm text-cream/50 hover:text-gold">
        <ChevronRight className="h-4 w-4" /> חזרה למרכז ניהול המלאי
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-5 rounded-2xl border border-gold/15 bg-white/5 p-5 sm:flex-row">
        <span className="relative h-28 w-28 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white">
          {r.image ? <Image src={r.image} alt={r.name} fill className="object-contain p-1" sizes="112px" unoptimized={dataUrl(r.image)} /> : <span className="flex h-full items-center justify-center text-3xl">🎁</span>}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <h1 className="font-display text-xl font-bold text-cream">{r.name}</h1>
            <QuickEditProduct sku={r.sku} name={r.name} description={r.internalDescription} retailPrice={r.retailPrice} image={r.image} />
          </div>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream/50">
            <span>קוד ספק: <span className="font-mono text-cream/70" dir="ltr">{r.supplierCode ?? '—'}</span></span>
            <span>SKU: <span className="font-mono text-cream/70" dir="ltr">{r.sku}</span></span>
            <span>קטגוריה: {r.category}</span>
            {!r.inCatalog && <span className="rounded-full bg-amber-400/15 px-2 py-0.5 text-amber-300">לא בקטלוג</span>}
          </div>
          <div className="mt-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-cream/70">מלאי פיזי: <b className={r.quantityOnHand < 0 ? 'text-red-300' : r.quantityOnHand === 0 ? 'text-cream/50' : 'text-emerald-300'}>{nf(r.quantityOnHand)}</b></span>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-cream/70">עלות: <b className="text-cream">{money(r.landedCost)}</b></span>
            <span className="rounded-lg bg-white/5 px-2.5 py-1 text-cream/70">מכירה: <b className="text-cream">{money(r.retailPrice)}</b></span>
            <span className="rounded-lg bg-emerald-400/10 px-2.5 py-1 text-emerald-300/90">רווח: <b>{money(r.profitAmount)}{r.profitMarginPercent != null ? ` · ${r.profitMarginPercent}%` : ''}</b></span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-1.5 border-b border-white/10 pb-2">
        {TABS.map((t, i) => (
          <button key={t} onClick={() => setTab(i)} className={'rounded-lg px-3 py-1.5 text-xs transition-colors ' + (tab === i ? 'bg-gold/15 font-bold text-gold' : 'text-cream/60 hover:bg-white/5')}>{t}</button>
        ))}
      </div>

      {/* Tab content */}
      <div>
        {tab === 0 && (
          <div className="space-y-4">
            <div className="flex justify-end">
              {!edit ? <button onClick={() => setEdit(true)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cream/80 hover:bg-white/5"><Pencil className="h-3.5 w-3.5" /> עריכה</button>
                : <div className="flex gap-2">
                    <button onClick={saveFields} disabled={saving} className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-3 py-1.5 text-xs font-bold text-navy disabled:opacity-60">{saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} שמור</button>
                    <button onClick={() => setEdit(false)} className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 text-xs text-cream/70"><X className="h-3.5 w-3.5" /> ביטול</button>
                  </div>}
            </div>
            {!edit ? (
              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
                <Field label="שם מוצר" value={r.name} />
                <Field label="מותג" value={r.brand ?? '—'} />
                <Field label="ברקוד" value={r.barcode ?? '—'} />
                <Field label="ספק" value={r.supplierName ?? '—'} />
                <Field label="קטגוריה" value={r.category} />
                <Field label="מיקום במחסן" value={r.warehouseLocation ?? '—'} />
                <Field label="מלאי מינימום" value={r.minimumStock != null ? nf(r.minimumStock) : '—'} />
                <Field label="כניסה אחרונה" value={dt(r.lastReceivedAt)} />
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {([['name', 'שם מוצר'], ['brand', 'מותג'], ['barcode', 'ברקוד'], ['warehouseLocation', 'מיקום במחסן'], ['minimumStock', 'מלאי מינימום']] as const).map(([k, l]) => (
                  <label key={k} className="block text-xs text-cream/50">{l}
                    <input className={input + ' mt-1'} value={String(form[k as keyof typeof form])} onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))} dir={k === 'barcode' ? 'ltr' : 'auto'} />
                  </label>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 1 && (
          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-5">
            <Field label="מלאי פיזי" value={nf(r.quantityOnHand)} tone={r.quantityOnHand < 0 ? 'text-red-300' : 'text-cream'} />
            <Field label="תקין" value={nf(r.quantityGood)} tone="text-emerald-300" />
            <Field label="פגום" value={nf(r.quantityDamaged)} tone={r.quantityDamaged > 0 ? 'text-red-300' : 'text-cream/50'} />
            <Field label="מלאי מינימום" value={r.minimumStock != null ? nf(r.minimumStock) : '—'} />
            <Field label="שווי מלאי (עלות)" value={money(r.inventoryValueAtCost)} tone="text-gold" />
          </div>
        )}

        {tab === 2 && <ImageManager sku={r.sku} initialMain={r.image} initialVersions={item.imageVersions} />}

        {tab === 3 && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-4">
              <Field label="עלות אחרונה" value={money(r.lastPurchaseCost)} />
              <Field label="עלות (כולל מע״מ 18%)" value={money(r.landedCost)} tone="text-cream" />
              <Field label="מחיר לצרכן" value={money(r.retailPrice)} />
              <Field label="מחיר חבר מועדון" value={r.clubPrice != null ? money(r.clubPrice) : 'לא הוגדר'} />
              <Field label="רווח ליחידה" value={money(r.profitAmount)} tone="text-emerald-300" />
              <Field label="אחוז רווח" value={r.profitMarginPercent != null ? `${r.profitMarginPercent}%` : '—'} tone="text-emerald-300" />
              <Field label="Markup" value={r.markupPercent != null ? `${r.markupPercent}%` : '—'} />
              <Field label="שווי מלאי (מכירה)" value={money(r.inventoryValueAtRetail)} tone="text-gold" />
            </div>
            <p className="text-[11px] text-cream/40">עלות אמיתית = עלות רכישה (כולל מע״מ) + עלות נוספת ליחידה. מחיר לצרכן ומחיר חבר נקראים מהאתר (read-only); ניתן להגדיר override פנימי בעריכה.</p>
          </div>
        )}

        {tab === 4 && (
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="ספק" value={r.supplierName ?? '—'} />
            <Field label="מלאי מינימום" value={r.minimumStock != null ? nf(r.minimumStock) : '—'} />
            <Field label="מלאי נוכחי" value={nf(r.quantityOnHand)} />
          </div>
        )}

        {tab === 5 && (
          item.invoiceLines.length === 0 ? <Soon phase="קליטת חשבונית ספק (שלב 3)" /> : (
            <div className="overflow-x-auto rounded-2xl border border-gold/15">
              <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead><tr className="text-right text-xs text-cream/40"><th className="px-4 py-2.5">ספק</th><th className="px-4 py-2.5">חשבונית</th><th className="px-4 py-2.5">כמות</th><th className="px-4 py-2.5">עלות יח׳</th><th className="px-4 py-2.5">תאריך</th></tr></thead>
                <tbody>{item.invoiceLines.map((l) => (
                  <tr key={l.id} className="border-t border-white/5"><td className="px-4 py-2.5 text-cream/80">{l.supplierName ?? '—'}</td><td className="px-4 py-2.5 font-mono text-xs text-cream/60" dir="ltr">{l.invoiceNumber ?? '—'}</td><td className="px-4 py-2.5">{nf(l.quantity)}</td><td className="px-4 py-2.5">{money(l.unitCost)}</td><td className="px-4 py-2.5 text-xs text-cream/50">{dt(l.createdAt)}</td></tr>
                ))}</tbody>
              </table>
            </div>
          )
        )}

        {tab === 6 && <Soon phase="חיבור מכירות וקבלות (שלב 4)" />}
        {tab === 7 && <Soon phase="זיכויים והחזרות (שלב 4)" />}
        {tab === 8 && <Soon phase="ספירות מלאי (שלב 5)" />}

        {tab === 9 && (
          item.movements.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-cream/40">אין עדיין תנועות מלאי למוצר זה.</div> : (
            <div className="overflow-x-auto rounded-2xl border border-gold/15">
              <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
                <thead><tr className="text-right text-xs text-cream/40"><th className="px-4 py-2.5">תאריך</th><th className="px-4 py-2.5">סוג</th><th className="px-4 py-2.5">שינוי</th><th className="px-4 py-2.5">לפני</th><th className="px-4 py-2.5">אחרי</th><th className="px-4 py-2.5">מסמך</th><th className="px-4 py-2.5">סיבה/ע״י</th></tr></thead>
                <tbody>{item.movements.map((m) => (
                  <tr key={m.id} className="border-t border-white/5">
                    <td className="px-4 py-2.5 text-xs text-cream/50">{dt(m.createdAt)}</td>
                    <td className="px-4 py-2.5 text-cream/80">{MOVEMENT_LABELS[m.type] ?? m.type}</td>
                    <td className={'px-4 py-2.5 font-bold ' + (m.change >= 0 ? 'text-emerald-300' : 'text-red-300')}>{m.change >= 0 ? '+' : ''}{nf(m.change)}</td>
                    <td className="px-4 py-2.5 text-cream/50">{nf(m.before)}</td>
                    <td className="px-4 py-2.5 text-cream/80">{nf(m.after)}</td>
                    <td className="px-4 py-2.5 text-xs text-cream/40" dir="ltr">{m.document ?? '—'}</td>
                    <td className="px-4 py-2.5 text-xs text-cream/50">{m.reason ?? '—'}{m.createdBy ? ` · ${m.createdBy}` : ''}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          )
        )}

        {tab === 10 && <Soon phase="ניהול מסמכים (שלב 3)" />}

        {tab === 11 && (
          <div className="space-y-2">
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={6} placeholder="הערות פנימיות על המוצר…" className={input} />
            <div className="flex items-center gap-3">
              <button onClick={saveNotes} disabled={notesSaving} className="inline-flex items-center gap-1.5 rounded-lg bg-gold px-4 py-2 text-sm font-bold text-navy disabled:opacity-60">{notesSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} שמור הערות</button>
              {notesMsg && <span className="text-xs text-gold">{notesMsg}</span>}
            </div>
          </div>
        )}

        {tab === 12 && (
          item.audit.length === 0 ? <div className="rounded-2xl border border-dashed border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-cream/40">אין עדיין רישומי audit למוצר זה.</div> : (
            <div className="overflow-hidden rounded-2xl border border-gold/15">
              <table className="w-full text-sm"><thead><tr className="text-right text-xs text-cream/40"><th className="px-4 py-2.5">פעולה</th><th className="px-4 py-2.5">משתמש</th><th className="px-4 py-2.5">תאריך</th></tr></thead>
                <tbody>{item.audit.map((a) => (<tr key={a.id} className="border-t border-white/5"><td className="px-4 py-2.5 text-cream/80">{a.action}</td><td className="px-4 py-2.5 text-cream/60">{a.userId ?? '—'}</td><td className="px-4 py-2.5 text-xs text-cream/50">{dt(a.createdAt)}</td></tr>))}</tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
