'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Plus, Trash2, Loader2, Check, PackagePlus, AlertTriangle, ClipboardPaste, ScanLine, UploadCloud } from 'lucide-react';

interface Line {
  code: string;
  qty: string;
  cost: string;
  status: 'idle' | 'checking' | 'found' | 'notfound';
  title?: string;
  image?: string;
  currentStock?: number;
}

const emptyLine = (): Line => ({ code: '', qty: '', cost: '', status: 'idle' });
const nf = (n: number) => n.toLocaleString('he-IL');
const field = 'w-full rounded-lg border border-gold/20 bg-[#0B132B] px-3 py-2 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-gold/60';

export function ReceivingForm() {
  const router = useRouter();
  const [supplier, setSupplier] = useState('ART Judaica (israel-judaica.com)');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [lines, setLines] = useState<Line[]>([emptyLine()]);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; text: string } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanMsg, setScanMsg] = useState<{ t: 'ok' | 'err'; text: string } | null>(null);

  const setLine = (i: number, patch: Partial<Line>) => setLines((ls) => ls.map((l, idx) => (idx === i ? { ...l, ...patch } : l)));
  const addLine = () => setLines((ls) => [...ls, emptyLine()]);
  const removeLine = (i: number) => setLines((ls) => (ls.length > 1 ? ls.filter((_, idx) => idx !== i) : ls));

  const lookupCode = useCallback(async (i: number, code: string) => {
    const c = code.trim();
    if (!c) { setLine(i, { status: 'idle', title: undefined, currentStock: undefined }); return; }
    setLine(i, { status: 'checking' });
    try {
      const res = await fetch(`/api/crm/receiving?code=${encodeURIComponent(c)}`);
      const data = await res.json();
      if (data.ok && data.lookup.found) setLine(i, { status: 'found', title: data.lookup.title, image: data.lookup.image, currentStock: data.lookup.currentStock });
      else setLine(i, { status: 'notfound', title: undefined });
    } catch { setLine(i, { status: 'idle' }); }
  }, []);

  async function onScanFile(file: File | undefined) {
    if (!file || scanning) return;
    setScanning(true); setScanMsg(null); setMsg(null);
    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const r = new FileReader();
        r.onload = () => resolve(String(r.result).split(',')[1] ?? '');
        r.onerror = reject;
        r.readAsDataURL(file);
      });
      const res = await fetch('/api/crm/receiving/scan', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64, mimeType: file.type }),
      });
      const data = await res.json();
      if (!data.ok) {
        setScanMsg({ t: 'err', text: data.needsKey ? '⚙️ סריקה חכמה עדיין לא מופעלת — צריך מפתח Gemini חינמי (בקש מקלוד להדריך).' : (data.error || 'הסריקה נכשלה') });
        return;
      }
      if (data.invoiceNumber) setInvoiceNumber(String(data.invoiceNumber));
      if (data.invoiceDate) setInvoiceDate(String(data.invoiceDate));
      const newLines: Line[] = (data.lines || []).map((l: { supplierCode: string; quantity: number; unitCost?: number }) => ({
        ...emptyLine(), code: l.supplierCode, qty: String(l.quantity ?? ''), cost: l.unitCost != null ? String(l.unitCost) : '',
      }));
      if (newLines.length === 0) { setScanMsg({ t: 'err', text: 'לא זוהו שורות מוצרים — נסה תמונה ברורה יותר, או הזן ידנית.' }); return; }
      setLines(newLines);
      newLines.forEach((l, i) => lookupCode(i, l.code));
      setScanMsg({ t: 'ok', text: `✅ זוהו ${newLines.length} שורות — בדוק, תקן אם צריך, ואשר למטה.` });
    } catch {
      setScanMsg({ t: 'err', text: 'שגיאה בקריאת הקובץ' });
    } finally { setScanning(false); }
  }

  const applyPaste = () => {
    // תמיכה בשורות "קוד,כמות,עלות" או מופרד ברווח/טאב
    const parsed: Line[] = pasteText.split(/\r?\n/).map((r) => r.trim()).filter(Boolean).map((r) => {
      const parts = r.split(/[,\t;]+|\s{2,}/).map((p) => p.trim()).filter(Boolean);
      return { ...emptyLine(), code: parts[0] ?? '', qty: parts[1] ?? '', cost: parts[2] ?? '' };
    }).filter((l) => l.code);
    if (parsed.length) {
      setLines(parsed);
      setPasteOpen(false); setPasteText('');
      parsed.forEach((l, i) => lookupCode(i, l.code));
    }
  };

  const valid = lines.filter((l) => l.code.trim() && Number(l.qty) > 0);
  const matched = valid.filter((l) => l.status === 'found').length;
  const unmatched = valid.filter((l) => l.status === 'notfound').length;
  const unitsTotal = valid.reduce((s, l) => s + Math.round(Number(l.qty) || 0), 0);
  const costTotal = valid.reduce((s, l) => s + (Number(l.cost) || 0) * (Math.round(Number(l.qty)) || 0), 0);

  async function approve() {
    if (busy) return;
    if (!invoiceNumber.trim()) { setMsg({ t: 'err', text: 'חסר מספר חשבונית' }); return; }
    if (valid.length === 0) { setMsg({ t: 'err', text: 'אין שורות תקינות (קוד + כמות)' }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/crm/receiving', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'approve', supplierName: supplier, invoiceNumber: invoiceNumber.trim(), invoiceDate: invoiceDate || null,
          lines: valid.map((l) => ({ supplierCode: l.code.trim(), quantity: Math.round(Number(l.qty)), unitCost: Number(l.cost) || 0, rawName: l.title })),
        }),
      });
      const data = await res.json();
      if (!data.ok) { setMsg({ t: 'err', text: data.duplicate ? '⚠️ חשבונית זו כבר נקלטה בעבר' : (data.error || 'שגיאה') }); return; }
      setMsg({ t: 'ok', text: `✅ נקלטו ${data.unitsTotal} יחידות · ${data.matched} מוצרים${data.unmatched ? ` · ${data.unmatched} לא הותאמו` : ''}` });
      setInvoiceNumber(''); setInvoiceDate(''); setLines([emptyLine()]);
      router.refresh();
    } catch { setMsg({ t: 'err', text: 'שגיאת רשת' }); } finally { setBusy(false); }
  }

  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cream/70"><PackagePlus className="h-4 w-4 text-gold" /> קליטת סחורה חדשה</div>

      {/* ⭐ סריקה חכמה — צלם/העלה חשבונית וה-AI ימלא את השורות */}
      <label className={'mb-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-gold/30 bg-gold/[0.04] px-4 py-6 text-center transition-colors hover:border-gold/60 hover:bg-gold/[0.08] ' + (scanning ? 'pointer-events-none opacity-70' : '')}>
        <input type="file" accept="image/*,application/pdf" capture="environment" className="hidden" onChange={(e) => onScanFile(e.target.files?.[0])} disabled={scanning} />
        {scanning ? (
          <><Loader2 className="h-7 w-7 animate-spin text-gold" /><span className="text-sm font-medium text-cream/80">סורק את החשבונית…</span></>
        ) : (
          <>
            <span className="flex items-center gap-2 text-gold"><ScanLine className="h-6 w-6" /><UploadCloud className="h-6 w-6" /></span>
            <span className="text-sm font-bold text-cream">צלם או העלה חשבונית ספק — וה-AI ימלא הכל</span>
            <span className="text-xs text-cream/40">תמונה או PDF · הזיהוי אוטומטי, ואתה רק מאשר</span>
          </>
        )}
        {scanMsg && <span className={'mt-1 text-xs ' + (scanMsg.t === 'ok' ? 'text-emerald-300' : 'text-amber-300')}>{scanMsg.text}</span>}
      </label>

      {/* כותרת החשבונית */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div><label className="mb-1 block text-xs text-cream/50">ספק</label><input value={supplier} onChange={(e) => setSupplier(e.target.value)} className={field} dir="auto" /></div>
        <div><label className="mb-1 block text-xs text-cream/50">מספר חשבונית *</label><input value={invoiceNumber} onChange={(e) => setInvoiceNumber(e.target.value)} placeholder="למשל: 100234" className={field} dir="auto" /></div>
        <div><label className="mb-1 block text-xs text-cream/50">תאריך חשבונית</label><input value={invoiceDate} onChange={(e) => setInvoiceDate(e.target.value)} type="date" className={field} /></div>
      </div>

      {/* שורות */}
      <div className="mt-5 flex items-center justify-between">
        <div className="text-xs font-medium text-cream/60">שורות ({valid.length})</div>
        <button onClick={() => setPasteOpen((v) => !v)} className="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs text-cream/60 hover:bg-white/5"><ClipboardPaste className="h-3.5 w-3.5" /> הדבקת שורות</button>
      </div>

      {pasteOpen && (
        <div className="mt-2 rounded-xl border border-gold/20 bg-[#0B132B] p-3">
          <div className="mb-1 text-[11px] text-cream/40">הדבק שורות בפורמט: קוד ספק, כמות, עלות ליחידה (שורה לכל מוצר)</div>
          <textarea value={pasteText} onChange={(e) => setPasteText(e.target.value)} rows={4} placeholder={'UK49849, 12, 8.5\nUK67651, 6, 21'} className={field + ' font-mono'} dir="ltr" />
          <button onClick={applyPaste} className="mt-2 rounded-lg bg-gold/20 px-3 py-1.5 text-xs font-bold text-gold hover:bg-gold/30">פרסר והוסף</button>
        </div>
      )}

      <div className="mt-3 space-y-2">
        {lines.map((l, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-xl border border-white/10 bg-white/[0.03] p-2.5 sm:flex-row sm:items-center">
            <span className="relative h-9 w-9 shrink-0 overflow-hidden rounded-md border border-white/10 bg-white">
              {l.image ? <Image src={l.image} alt="" fill className="object-contain p-0.5" sizes="36px" /> : <span className="flex h-full items-center justify-center text-sm">🎁</span>}
            </span>
            <input value={l.code} onChange={(e) => setLine(i, { code: e.target.value })} onBlur={(e) => lookupCode(i, e.target.value)} placeholder="קוד ספק" className={field + ' sm:w-32'} dir="ltr" />
            <input value={l.qty} onChange={(e) => setLine(i, { qty: e.target.value })} type="number" min={1} placeholder="כמות" className={field + ' sm:w-24'} />
            <input value={l.cost} onChange={(e) => setLine(i, { cost: e.target.value })} type="number" min={0} step="0.01" placeholder="עלות ₪" className={field + ' sm:w-24'} />
            <div className="min-w-0 flex-1 text-xs">
              {l.status === 'checking' && <span className="text-cream/40">מחפש…</span>}
              {l.status === 'found' && <span className="text-emerald-300">✓ {l.title} · במלאי כעת: {nf(l.currentStock ?? 0)}{l.qty ? ` → ${nf((l.currentStock ?? 0) + Math.round(Number(l.qty) || 0))}` : ''}</span>}
              {l.status === 'notfound' && <span className="text-red-300">✗ קוד לא נמצא בקטלוג — לא יעודכן מלאי</span>}
            </div>
            <button onClick={() => removeLine(i)} className="shrink-0 rounded-lg p-1.5 text-red-300/70 hover:bg-red-400/10"><Trash2 className="h-4 w-4" /></button>
          </div>
        ))}
      </div>

      <button onClick={addLine} className="mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs text-cream/60 hover:bg-white/5"><Plus className="h-3.5 w-3.5" /> הוסף שורה</button>

      {/* סיכום + אישור */}
      <div className="mt-5 flex flex-col gap-3 border-t border-white/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-cream/60">
          <span>{nf(unitsTotal)} יחידות</span>
          <span className="text-emerald-300">{matched} מותאמים</span>
          {unmatched > 0 && <span className="text-red-300"><AlertTriangle className="mb-0.5 me-1 inline h-3.5 w-3.5" />{unmatched} לא מותאמים</span>}
          <span className="text-cream/40">עלות: ₪{nf(Math.round(costTotal))}</span>
        </div>
        <div className="flex items-center gap-3">
          {msg && <span className={'text-sm ' + (msg.t === 'ok' ? 'text-emerald-300' : 'text-red-300')}>{msg.text}</span>}
          <button onClick={approve} disabled={busy || valid.length === 0} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy transition-transform hover:scale-[1.02] disabled:opacity-50">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} קלוט סחורה ועדכן מלאי
          </button>
        </div>
      </div>
    </div>
  );
}
