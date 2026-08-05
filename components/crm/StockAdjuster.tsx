'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Check, Plus, Minus } from 'lucide-react';

// כל תיקון יוצר תנועת מלאי + audit. סוג התנועה קובע כיוון (+/−).
const TYPES: { key: string; label: string; dir: 1 | -1 }[] = [
  { key: 'MANUAL_ADJUSTMENT_IN', label: 'תיקון ידני — הוספה', dir: 1 },
  { key: 'CUSTOMER_RETURN_IN', label: 'החזרת לקוח', dir: 1 },
  { key: 'MANUAL_ADJUSTMENT_OUT', label: 'תיקון ידני — הפחתה', dir: -1 },
  { key: 'DAMAGE_OUT', label: 'פגם / בלאי', dir: -1 },
  { key: 'SUPPLIER_RETURN_OUT', label: 'החזרה לספק', dir: -1 },
];

const field = 'w-full rounded-xl border border-gold/20 bg-[#0B132B] px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-gold/60';

export function StockAdjuster({ sku }: { sku: string }) {
  const router = useRouter();
  const [type, setType] = useState(TYPES[0].key);
  const [qty, setQty] = useState('');
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; text: string } | null>(null);

  const dir = TYPES.find((t) => t.key === type)?.dir ?? 1;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const q = Math.abs(Math.round(Number(qty)));
    if (!q) { setMsg({ t: 'err', text: 'הזינו כמות' }); return; }
    if (!reason.trim()) { setMsg({ t: 'err', text: 'חובה לציין סיבה' }); return; }
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/crm/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'adjust', sku, delta: q * dir, type, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setMsg({ t: 'err', text: data.error || 'שגיאה' }); return; }
      setMsg({ t: 'ok', text: `עודכן — מלאי חדש: ${data.after}` });
      setQty(''); setReason('');
      router.refresh();
    } catch {
      setMsg({ t: 'err', text: 'שגיאת רשת' });
    } finally { setBusy(false); }
  }

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cream/70">
        {dir > 0 ? <Plus className="h-4 w-4 text-emerald-300" /> : <Minus className="h-4 w-4 text-amber-300" />} תיקון מלאי ידני
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-xs text-cream/50">סוג תנועה</label>
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            {TYPES.map((t) => <option key={t.key} value={t.key} className="bg-[#0B132B]">{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-cream/50">כמות</label>
          <input value={qty} onChange={(e) => setQty(e.target.value)} type="number" min={1} inputMode="numeric" placeholder="0" className={field} />
        </div>
        <div>
          <label className="mb-1.5 block text-xs text-cream/50">סיבה (חובה)</label>
          <input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="למשל: ספירת מלאי" className={field} dir="auto" />
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3">
        <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gold px-5 py-2.5 text-sm font-bold text-navy transition-transform hover:scale-[1.02] disabled:opacity-60">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} עדכן מלאי
        </button>
        {msg && <span className={'text-sm ' + (msg.t === 'ok' ? 'text-emerald-300' : 'text-red-300')}>{msg.text}</span>}
      </div>
    </form>
  );
}
