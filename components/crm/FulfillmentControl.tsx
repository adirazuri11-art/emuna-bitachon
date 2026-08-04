'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Package, Truck, CheckCircle2 } from 'lucide-react';

type Fulfillment = 'in_progress' | 'shipping' | 'completed';

const STAGES: { key: Fulfillment; label: string; icon: any }[] = [
  { key: 'in_progress', label: 'בעבודה', icon: Package },
  { key: 'shipping', label: 'במשלוח', icon: Truck },
  { key: 'completed', label: 'בוצעה בהצלחה', icon: CheckCircle2 },
];

export function FulfillmentControl({ orderNumber, current }: { orderNumber: string; current: Fulfillment }) {
  const router = useRouter();
  const [status, setStatus] = useState<Fulfillment>(current);
  const [busy, setBusy] = useState(false);
  const currentIdx = STAGES.findIndex((s) => s.key === status);

  const setTo = async (next: Fulfillment) => {
    if (busy || next === status) return;
    setBusy(true);
    try {
      const res = await fetch('/api/crm/orders/fulfill', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ orderNumber, status: next }),
      });
      const j = await res.json();
      if (j.ok) {
        setStatus(next);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  };

  const nextStage = STAGES[currentIdx + 1];

  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-sm font-medium text-cream/60">סטטוס טיפול</h2>
        {busy && <Loader2 className="h-4 w-4 animate-spin text-gold" />}
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STAGES.map((s, i) => {
          const done = i < currentIdx;
          const active = i === currentIdx;
          return (
            <button
              key={s.key}
              onClick={() => setTo(s.key)}
              disabled={busy}
              className={
                'flex flex-1 flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-xs transition-colors disabled:opacity-60 ' +
                (active
                  ? 'border-gold/50 bg-gold/15 font-bold text-gold'
                  : done
                    ? 'border-emerald-400/30 bg-emerald-400/10 text-emerald-300'
                    : 'border-white/10 text-cream/45 hover:bg-white/5')
              }
            >
              <s.icon className="h-5 w-5" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* Advance button */}
      {nextStage ? (
        <button
          onClick={() => setTo(nextStage.key)}
          disabled={busy}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft py-2.5 text-sm font-bold text-navy transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          <nextStage.icon className="h-4 w-4" /> העבר ל{nextStage.label}
        </button>
      ) : (
        <p className="mt-4 text-center text-sm font-medium text-emerald-300">✓ ההזמנה הושלמה</p>
      )}
    </div>
  );
}
