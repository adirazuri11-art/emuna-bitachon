'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Upload, Loader2, Check, AlertTriangle, X, FileText } from 'lucide-react';

interface Line {
  supplierCode: string; rawCode: string; catalogName?: string; quantity: number;
  unitCost?: number; lineTotal?: number; catalogCost?: number; confidence: number;
  status: string; note?: string; suggestedUnitCost?: number;
}
interface ScanResult {
  ok: boolean; error?: string; needsKey?: boolean; method: string; passes?: number;
  invoiceNumber?: string; invoiceDate?: string; total?: number;
  lines: Line[]; warnings: string[];
  stats: { linesFound: number; confirmed: number; needsReview: number; sumLines: number };
}
interface Row extends Line { include: boolean }

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n?: number | null) => (n != null ? `₪${nf(Math.round(n * 100) / 100)}` : '—');
const artProxy = (sku: string) => `/api/crm/inventory/art-image/${encodeURIComponent(sku)}`;

const STATUS: Record<string, { label: string; cls: string }> = {
  confirmed: { label: 'ודאי', cls: 'bg-emerald-400/15 text-emerald-300' },
  price_changed: { label: 'מחיר שונה', cls: 'bg-amber-400/15 text-amber-300' },
  not_found: { label: 'לא בקטלוג', cls: 'bg-sky-400/15 text-sky-300' },
  review: { label: 'לבדיקה', cls: 'bg-amber-400/15 text-amber-300' },
  inconsistent: { label: 'לא עקבי', cls: 'bg-red-500/15 text-red-300' },
};

function fileToBase64(f: File): Promise<string> {
  return new Promise((res, rej) => { const r = new FileReader(); r.onload = () => res(String(r.result)); r.onerror = rej; r.readAsDataURL(f); });
}

export function InvoiceScanner() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [rows, setRows] = useState<Row[]>([]);
  const [fileName, setFileName] = useState('');
  const [approving, setApproving] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const onFile = async (f?: File | null) => {
    if (!f) return;
    setErr(null); setDone(null); setResult(null); setRows([]); setFileName(f.name); setBusy(true);
    try {
      const dataUrl = await fileToBase64(f);
      const res = await fetch('/api/crm/inventory-v2/scan', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ image: dataUrl, mimeType: f.type || 'application/octet-stream', fileName: f.name }),
      });
      const data: ScanResult = await res.json();
      if (!data.ok) { setErr(data.needsKey ? 'חסר מפתח AI תקין בהגדרות' : (data.error || 'הסריקה נכשלה')); setBusy(false); return; }
      setResult(data);
      setRows(data.lines.map((l) => ({ ...l, include: l.status !== 'inconsistent' })));
    } catch { setErr('שגיאת רשת/קובץ'); } finally { setBusy(false); }
  };

  const upd = (i: number, patch: Partial<Row>) => setRows((r) => r.map((x, j) => (j === i ? { ...x, ...patch } : x)));

  const approve = async () => {
    if (!result) return;
    setApproving(true); setErr(null);
    try {
      const lines = rows.filter((r) => r.include && r.quantity > 0).map((r) => ({ supplierCode: r.supplierCode, quantity: r.quantity, unitCost: r.unitCost, rawName: r.catalogName }));
      const res = await fetch('/api/crm/receiving', {
        method: 'POST', headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ action: 'approve', supplierName: 'ART Judaica', invoiceNumber: result.invoiceNumber, invoiceDate: result.invoiceDate, vat: 18, lines }),
      });
      const data = await res.json();
      if (data.ok) setDone(`נקלטו ${lines.length} שורות — המלאי עודכן ✓`);
      else setErr(data.error || 'הקליטה נכשלה');
    } catch { setErr('שגיאת רשת'); } finally { setApproving(false); }
  };

  const includedSum = rows.filter((r) => r.include).reduce((s, r) => s + (r.lineTotal ?? (r.unitCost ?? 0) * r.quantity), 0);
  const sumOk = result?.total ? Math.abs(includedSum - result.total) <= 1 : true;
  const input = 'w-20 rounded-lg border border-gold/20 bg-[#0B132B] px-2 py-1 text-sm text-cream outline-none focus:border-gold/60';

  return (
    <div className="space-y-5">
      {/* Upload */}
      {!result && (
        <label
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => { e.preventDefault(); onFile(e.dataTransfer.files?.[0]); }}
          className="flex min-h-[220px] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-gold/25 bg-white/5 p-8 text-center text-cream/60 hover:border-gold/50"
        >
          {busy ? <><Loader2 className="h-8 w-8 animate-spin text-gold" /><div className="text-sm">סורק את {fileName}… (טקסט־PDF / 3 מעברי AI + יישור לקטלוג)</div></>
            : <><Upload className="h-8 w-8 text-gold/70" /><div className="text-base font-medium text-cream/80">גרור חשבונית ספק לכאן, או לחץ לבחירה</div><div className="text-xs text-cream/40">PDF · JPG · PNG · HEIC (צילום מהאייפון) · עד 15MB</div></>}
          <input type="file" accept="application/pdf,image/*,.heic,.heif,.pdf" className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
        </label>
      )}

      {err && <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">{err}</div>}
      {done && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">{done}</div>}

      {result && !done && (
        <div className="space-y-4">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/15 bg-white/5 px-5 py-3.5">
            <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-sm">
              <span className="text-cream/50">חשבונית <b className="text-cream" dir="ltr">{result.invoiceNumber ?? '—'}</b></span>
              <span className="text-cream/50">תאריך <b className="text-cream">{result.invoiceDate ?? '—'}</b></span>
              <span className="text-cream/50">סכום מסמך <b className="text-cream">{money(result.total)}</b></span>
              <span className="text-cream/50">שיטה <b className="text-cream">{result.method === 'pdf-text' ? 'טקסט PDF' : `ראייה (${result.passes} מעברים)`}</b></span>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="rounded-full bg-emerald-400/15 px-2.5 py-1 text-emerald-300">{result.stats.confirmed} ודאי</span>
              <span className="rounded-full bg-amber-400/15 px-2.5 py-1 text-amber-300">{result.stats.needsReview} לבדיקה</span>
            </div>
          </div>

          {result.warnings.map((w, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-2.5 text-sm text-amber-200"><AlertTriangle className="h-4 w-4 shrink-0" />{w}</div>
          ))}

          {/* Lines */}
          <div className="overflow-x-auto rounded-2xl border border-gold/15 bg-white/5">
            <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr className="text-right text-xs text-cream/40">
                  <th className="px-3 py-2.5">קלוט</th><th className="px-3 py-2.5">מוצר</th><th className="px-3 py-2.5">קוד ספק</th>
                  <th className="px-3 py-2.5">כמות</th><th className="px-3 py-2.5">מחיר יח׳</th><th className="px-3 py-2.5">סה״כ</th>
                  <th className="px-3 py-2.5">סטטוס</th><th className="px-3 py-2.5">הערה</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => {
                  const st = STATUS[r.status] ?? STATUS.review;
                  return (
                    <tr key={i} className={'border-t border-white/5 ' + (r.include ? '' : 'opacity-40')}>
                      <td className="px-3 py-2.5"><input type="checkbox" checked={r.include} onChange={(e) => upd(i, { include: e.target.checked })} className="accent-gold" /></td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white">
                            <Image src={artProxy(r.supplierCode)} alt="" fill className="object-contain p-0.5" sizes="36px" />
                          </span>
                          <span className="line-clamp-2 max-w-[16rem] text-cream/90">{r.catalogName ?? <span className="text-sky-300">מוצר חדש</span>}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 font-mono text-xs text-cream/60" dir="ltr">{r.supplierCode}{r.rawCode !== r.supplierCode && <span className="text-amber-300/60"> ←{r.rawCode}</span>}</td>
                      <td className="px-3 py-2.5"><input className={input} type="number" value={r.quantity} onChange={(e) => upd(i, { quantity: Math.max(0, Number(e.target.value)) })} /></td>
                      <td className="px-3 py-2.5">
                        <input className={input} type="number" step="0.01" value={r.unitCost ?? ''} onChange={(e) => upd(i, { unitCost: Number(e.target.value) })} />
                        {r.suggestedUnitCost != null && r.suggestedUnitCost !== r.unitCost && <button onClick={() => upd(i, { unitCost: r.suggestedUnitCost })} className="mt-0.5 block text-[10px] text-gold hover:underline">קטלוג: {money(r.suggestedUnitCost)}</button>}
                      </td>
                      <td className="px-3 py-2.5 text-cream/70">{money(r.lineTotal ?? (r.unitCost ?? 0) * r.quantity)}</td>
                      <td className="px-3 py-2.5"><span className={`rounded-full px-2 py-0.5 text-[11px] ${st.cls}`}>{st.label}</span></td>
                      <td className="px-3 py-2.5 text-[11px] text-cream/50 max-w-[14rem]">{r.note ?? ''}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Summary + approve */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold/15 bg-white/5 px-5 py-3.5">
            <div className="text-sm">
              <span className="text-cream/50">סכום שורות לקליטה: </span>
              <b className={sumOk ? 'text-emerald-300' : 'text-amber-300'}>{money(includedSum)}</b>
              {!sumOk && <span className="text-amber-300/80"> (לא תואם לסכום המסמך {money(result.total)})</span>}
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setResult(null); setRows([]); }} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-4 py-2 text-sm text-cream/70 hover:bg-white/5"><X className="h-4 w-4" /> ביטול</button>
              <button onClick={approve} disabled={approving} className="inline-flex items-center gap-1.5 rounded-xl bg-gold px-5 py-2 text-sm font-bold text-navy disabled:opacity-60">
                {approving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} קלוט סחורה ועדכן מלאי
              </button>
            </div>
          </div>
        </div>
      )}

      {done && (
        <button onClick={() => { setResult(null); setRows([]); setDone(null); setFileName(''); }} className="inline-flex items-center gap-1.5 rounded-xl border border-gold/25 px-4 py-2 text-sm text-gold hover:bg-white/5"><FileText className="h-4 w-4" /> קליטת חשבונית נוספת</button>
      )}
    </div>
  );
}
