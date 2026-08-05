'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Ticket, Plus, Percent, Coins, Copy, Check, Power, Trash2, Loader2, Calendar, Hash } from 'lucide-react';

export interface PromoRowClient {
  code: string;
  type: 'pct' | 'fixed';
  value: number;
  label: string;
  expiresAt: string | null;
  maxRedemptions: number | null;
  active: boolean;
  redemptions: number;
  revenue: number;
  discountGiven: number;
  expired: boolean;
}

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number) => `₪${nf(Math.round(n))}`;
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');

const field = 'w-full rounded-xl border border-gold/20 bg-[#0B132B] px-3.5 py-2.5 text-sm text-cream placeholder:text-cream/30 outline-none transition-colors focus:border-gold/60';

export function PromoManager({ initial }: { initial: PromoRowClient[] }) {
  const router = useRouter();
  const [type, setType] = useState<'pct' | 'fixed'>('pct');
  const [code, setCode] = useState('');
  const [value, setValue] = useState('');
  const [label, setLabel] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [maxRedemptions, setMaxRedemptions] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ t: 'ok' | 'err'; text: string } | null>(null);
  const [copied, setCopied] = useState('');
  const [rowBusy, setRowBusy] = useState('');

  async function create(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch('/api/crm/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: code.trim(),
          type,
          value: Number(value),
          label: label.trim() || undefined,
          expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : null,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) { setMsg({ t: 'err', text: data.error || 'שגיאה ביצירת הקופון' }); return; }
      setMsg({ t: 'ok', text: `הקופון "${code.trim()}" נוצר ופעיל 🎉` });
      setCode(''); setValue(''); setLabel(''); setExpiresAt(''); setMaxRedemptions('');
      router.refresh();
    } catch {
      setMsg({ t: 'err', text: 'שגיאת רשת. נסו שוב.' });
    } finally {
      setBusy(false);
    }
  }

  async function toggle(c: PromoRowClient) {
    setRowBusy(c.code);
    await fetch('/api/crm/coupons', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c.code, active: !c.active }) });
    router.refresh(); setRowBusy('');
  }
  async function remove(c: PromoRowClient) {
    if (!confirm(`למחוק את הקופון "${c.code}"? פעולה זו אינה הפיכה.`)) return;
    setRowBusy(c.code);
    await fetch('/api/crm/coupons', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code: c.code }) });
    router.refresh(); setRowBusy('');
  }
  function copy(code: string) {
    navigator.clipboard?.writeText(code).then(() => { setCopied(code); setTimeout(() => setCopied(''), 1500); }).catch(() => {});
  }

  const discountText = (c: PromoRowClient) => (c.type === 'pct' ? `${c.value}%` : money(c.value));

  return (
    <div className="space-y-6">
      {/* ===== טופס יצירה ===== */}
      <form onSubmit={create} className="rounded-2xl border border-gold/15 bg-white/5 p-5">
        <div className="mb-4 flex items-center gap-2 text-sm font-medium text-cream/70"><Plus className="h-4 w-4 text-gold" /> יצירת קופון חדש</div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* קוד */}
          <div>
            <label className="mb-1.5 block text-xs text-cream/50">קוד הקופון</label>
            <div className="relative">
              <Ticket className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/50" />
              <input value={code} onChange={(e) => setCode(e.target.value)} required placeholder="למשל: פסח2026" className={field + ' pe-9'} dir="auto" />
            </div>
          </div>

          {/* סוג הנחה */}
          <div>
            <label className="mb-1.5 block text-xs text-cream/50">סוג הנחה</label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setType('pct')} className={'flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ' + (type === 'pct' ? 'border-gold/60 bg-gold/15 font-bold text-gold' : 'border-gold/20 text-cream/60 hover:bg-white/5')}>
                <Percent className="h-4 w-4" /> אחוז
              </button>
              <button type="button" onClick={() => setType('fixed')} className={'flex flex-1 items-center justify-center gap-1.5 rounded-xl border px-3 py-2.5 text-sm transition-colors ' + (type === 'fixed' ? 'border-gold/60 bg-gold/15 font-bold text-gold' : 'border-gold/20 text-cream/60 hover:bg-white/5')}>
                <Coins className="h-4 w-4" /> סכום קבוע
              </button>
            </div>
          </div>

          {/* ערך */}
          <div>
            <label className="mb-1.5 block text-xs text-cream/50">{type === 'pct' ? 'אחוז הנחה (1–90)' : 'סכום הנחה בש״ח'}</label>
            <input value={value} onChange={(e) => setValue(e.target.value)} required inputMode="numeric" type="number" min={1} max={type === 'pct' ? 90 : 10000} placeholder={type === 'pct' ? '15' : '50'} className={field} />
          </div>

          {/* תוקף */}
          <div>
            <label className="mb-1.5 block text-xs text-cream/50"><Calendar className="mb-0.5 me-1 inline h-3.5 w-3.5" />תוקף עד (לא חובה)</label>
            <input value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} type="date" className={field} />
          </div>

          {/* מגבלת מימושים */}
          <div>
            <label className="mb-1.5 block text-xs text-cream/50"><Hash className="mb-0.5 me-1 inline h-3.5 w-3.5" />מקסימום מימושים (לא חובה)</label>
            <input value={maxRedemptions} onChange={(e) => setMaxRedemptions(e.target.value)} inputMode="numeric" type="number" min={1} placeholder="ללא הגבלה" className={field} />
          </div>

          {/* תווית */}
          <div>
            <label className="mb-1.5 block text-xs text-cream/50">תיאור לתצוגה (לא חובה)</label>
            <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="מבצע פסח" className={field} dir="auto" />
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <button type="submit" disabled={busy} className="inline-flex items-center gap-2 rounded-full bg-gold px-6 py-2.5 text-sm font-bold text-navy transition-transform hover:scale-[1.02] disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} יצירת קופון
          </button>
          {msg && <span className={'text-sm ' + (msg.t === 'ok' ? 'text-emerald-300' : 'text-red-300')}>{msg.text}</span>}
        </div>
      </form>

      {/* ===== טבלת קופונים + ביצועים ===== */}
      <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
        <div className="border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70">קופונים פעילים וביצועים</div>
        {initial.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-cream/40">עדיין לא נוצרו קופונים. צרו את הראשון למעלה ☝️</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-cream/40">
                  <th className="px-5 py-2.5 font-medium">קוד</th>
                  <th className="px-3 py-2.5 font-medium">הנחה</th>
                  <th className="px-3 py-2.5 font-medium">מימושים</th>
                  <th className="px-3 py-2.5 font-medium">הכנסה</th>
                  <th className="px-3 py-2.5 font-medium">הנחה שניתנה</th>
                  <th className="px-3 py-2.5 font-medium">תוקף</th>
                  <th className="px-3 py-2.5 font-medium">סטטוס</th>
                  <th className="px-5 py-2.5 font-medium text-left">פעולות</th>
                </tr>
              </thead>
              <tbody style={{ fontVariantNumeric: 'tabular-nums' }}>
                {initial.map((c) => (
                  <tr key={c.code} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3">
                      <button onClick={() => copy(c.code)} className="inline-flex items-center gap-1.5 font-bold text-cream hover:text-gold" title="העתקה">
                        {c.code}
                        {copied === c.code ? <Check className="h-3.5 w-3.5 text-emerald-300" /> : <Copy className="h-3.5 w-3.5 opacity-40" />}
                      </button>
                      {c.label && <div className="text-xs text-cream/40">{c.label}</div>}
                    </td>
                    <td className="px-3 py-3 font-medium text-gold">{discountText(c)}</td>
                    <td className="px-3 py-3 text-cream/80">{nf(c.redemptions)}{c.maxRedemptions ? <span className="text-cream/30">/{c.maxRedemptions}</span> : ''}</td>
                    <td className="px-3 py-3 text-emerald-300">{c.revenue ? money(c.revenue) : '—'}</td>
                    <td className="px-3 py-3 text-cream/60">{c.discountGiven ? money(c.discountGiven) : '—'}</td>
                    <td className="px-3 py-3 text-xs text-cream/50">{fmtDate(c.expiresAt)}</td>
                    <td className="px-3 py-3">
                      {c.expired ? (
                        <span className="rounded-full bg-red-400/15 px-2.5 py-0.5 text-xs font-medium text-red-300">פג תוקף</span>
                      ) : c.active ? (
                        <span className="rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300">פעיל</span>
                      ) : (
                        <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-xs font-medium text-cream/50">מושבת</span>
                      )}
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-start gap-1.5">
                        <button onClick={() => toggle(c)} disabled={rowBusy === c.code || c.expired} title={c.active ? 'השבתה' : 'הפעלה'}
                          className={'rounded-lg p-1.5 transition-colors disabled:opacity-30 ' + (c.active ? 'text-amber-300 hover:bg-amber-400/10' : 'text-emerald-300 hover:bg-emerald-400/10')}>
                          {rowBusy === c.code ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        </button>
                        <button onClick={() => remove(c)} disabled={rowBusy === c.code} title="מחיקה" className="rounded-lg p-1.5 text-red-300 transition-colors hover:bg-red-400/10 disabled:opacity-30">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
