'use client';

import { useState, type FormEvent } from 'react';
import { Gift, Loader2, Lock } from 'lucide-react';

export default function CrmLogin() {
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading'>('idle');
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!password || status === 'loading') return;
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch('/api/crm/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setError(j?.error ?? 'שגיאה בהתחברות');
        setStatus('idle');
        return;
      }
      const params = new URLSearchParams(window.location.search);
      window.location.href = params.get('next') || '/crm';
    } catch {
      setError('שגיאת רשת — נסו שוב');
      setStatus('idle');
    }
  };

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4">
      <form
        onSubmit={submit}
        className="w-full max-w-sm rounded-2xl border border-gold/20 bg-white/5 p-8 text-center backdrop-blur"
      >
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gold/25 bg-navy">
          <Gift className="h-6 w-6 text-gold" />
        </span>
        <h1 className="font-display text-2xl font-bold text-cream">מרכז השליטה</h1>
        <p className="mt-1 text-sm text-cream/50">גישה מאובטחת — אמונה וביטחון</p>

        <div className="relative mt-6">
          <Lock className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
          <input
            type="password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="סיסמת גישה"
            className="w-full rounded-full border border-gold/25 bg-white/10 px-4 py-3 pe-10 text-center text-cream outline-none placeholder:text-cream/40 focus:border-gold"
          />
        </div>

        {error && <p className="mt-3 text-sm text-red-300">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft py-3 font-bold text-navy shadow-gold transition-transform hover:scale-[1.02] disabled:opacity-60"
        >
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'כניסה'}
        </button>
      </form>
    </div>
  );
}
