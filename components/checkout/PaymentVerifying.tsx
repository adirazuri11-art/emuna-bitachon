'use client';

import { useEffect, useState } from 'react';
import { Loader2, CheckCircle2, Clock } from 'lucide-react';

// Polling מבוקר (ללא לולאה אינסופית) — עד ~30 שניות. האמת מגיעה מהשרת.
export function PaymentVerifying({ orderNumber }: { orderNumber: string }) {
  const [state, setState] = useState<'checking' | 'paid' | 'pending'>('checking');

  useEffect(() => {
    let tries = 0;
    let stop = false;
    const tick = async () => {
      tries++;
      try {
        const r = await fetch(`/api/checkout/status?order=${encodeURIComponent(orderNumber)}`, { cache: 'no-store' });
        const j = await r.json();
        if (!stop && j.paid) { setState('paid'); return; }
      } catch { /* retry */ }
      if (stop) return;
      if (tries >= 10) { setState('pending'); return; }
      setTimeout(tick, 3000);
    };
    tick();
    return () => { stop = true; };
  }, [orderNumber]);

  if (state === 'paid') {
    return (
      <div className="text-center">
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" strokeWidth={1.4} />
        <h1 className="mt-4 font-display text-3xl font-bold text-navy">ההזמנה התקבלה בהצלחה</h1>
        <p className="mt-2 text-navy/60">התשלום אומת. מספר הזמנה: <b dir="ltr">{orderNumber}</b></p>
        <p className="mx-auto mt-3 max-w-md rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-navy/70">
          שלחנו אישור למייל וההזמנה נכנסה לטיפול.
        </p>
      </div>
    );
  }

  if (state === 'pending') {
    return (
      <div className="text-center">
        <Clock className="mx-auto h-16 w-16 text-gold-soft" strokeWidth={1.4} />
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">אנחנו מאמתים את התשלום</h1>
        <p className="mx-auto mt-2 max-w-md text-navy/60">
          התהליך עשוי להימשך מספר רגעים. מספר הזמנה: <b dir="ltr">{orderNumber}</b>.
          אין צורך לשלם שוב — אם חויבת, ההזמנה תתעדכן אוטומטית.
        </p>
      </div>
    );
  }

  return (
    <div className="text-center">
      <Loader2 className="mx-auto h-14 w-14 animate-spin text-gold-soft" />
      <p className="mt-4 text-navy/70">מאמתים את התשלום…</p>
    </div>
  );
}
