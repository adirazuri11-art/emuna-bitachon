'use client';
import { useState } from 'react';
import { Zap, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export function MetaConnectBox() {
  const [token, setToken] = useState('');
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<null | { ok: boolean; msg: string }>(null);

  async function connect() {
    if (token.trim().length < 40) { setResult({ ok: false, msg: 'הדבק טוקן תקין (מתחיל ב-EAA...)' }); return; }
    setBusy(true); setResult(null);
    try {
      const r = await fetch('/api/crm/meta/connect', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: token.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        const bits = [
          d.page ? `עמוד: ${d.page}` : null,
          d.canReadInsights ? 'נתונים ✓' : 'חסר pages_read_engagement',
          d.canPost ? 'פרסום FB ✓' : null,
          d.igConnected ? 'אינסטגרם מקושר ✓' : 'אינסטגרם לא מקושר',
        ].filter(Boolean).join(' · ');
        setResult({ ok: true, msg: `חובר! ${bits}. רענן את הדף.` });
        setToken('');
      } else {
        setResult({ ok: false, msg: d.error || 'החיבור נכשל' });
      }
    } catch {
      setResult({ ok: false, msg: 'שגיאת רשת' });
    } finally { setBusy(false); }
  }

  return (
    <div className="rounded-xl border border-gold/20 bg-navy/40 p-5 text-sm leading-relaxed text-cream/70">
      <div className="mb-2 flex items-center gap-2 font-bold text-gold">
        <Zap className="h-4 w-4" /> חיבור נתונים חיים — הדבק טוקן Meta כאן
      </div>
      <p className="mb-3 text-cream/55">
        הפק טוקן ב-Graph API Explorer (בחר עמוד → צור אסימון), והדבק אותו כאן. הטוקן נשמר מוצפן בשרת ולא עובר בשום מקום אחר.
      </p>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          type="password"
          dir="ltr"
          value={token}
          onChange={(e) => setToken(e.target.value)}
          placeholder="EAA..."
          className="flex-1 rounded-lg border border-white/15 bg-navy/60 px-3 py-2.5 text-cream placeholder:text-cream/30 focus:border-gold/50 focus:outline-none"
        />
        <button
          onClick={connect}
          disabled={busy}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-l from-gold to-gold-soft px-5 py-2.5 font-bold text-navy disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} חבר
        </button>
      </div>
      {result && (
        <div className={`mt-3 flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${result.ok ? 'bg-emerald-400/15 text-emerald-300' : 'bg-red-400/15 text-red-300'}`}>
          {result.ok ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />} {result.msg}
        </div>
      )}
    </div>
  );
}
