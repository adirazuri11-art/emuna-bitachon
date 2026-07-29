'use client';

// ספירה לאחור חיה לכניסת השבת — שולף את זמן הדלקת הנרות מ-Hebcal
// ומתקתק בזמן אמת. חוויה תמטית שמזכירה ללקוח להספיק להזמין לפני שבת.

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Flame, Truck } from 'lucide-react';

interface HebcalItem { category: string; date: string; hebrew?: string }

function useCandleTime() {
  const [target, setTarget] = useState<Date | null>(null);
  const [parsha, setParsha] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    fetch('https://www.hebcal.com/shabbat?cfg=json&geonameid=281184&M=on')
      .then((r) => r.json())
      .then((d: { items: HebcalItem[] }) => {
        if (!alive) return;
        const candle = d.items?.find((i) => i.category === 'candles');
        const par = d.items?.find((i) => i.category === 'parashat');
        if (candle) setTarget(new Date(candle.date));
        if (par) setParsha(par.hebrew ?? null);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, []);
  return { target, parsha };
}

function pad(n: number) { return String(n).padStart(2, '0'); }

export function ShabbatCountdown() {
  const { target, parsha } = useCandleTime();
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  if (!target) return null;

  const diff = target.getTime() - now;
  const isShabbat = diff <= 0 && diff > -25 * 3600 * 1000; // חלון שבת ~25 שעות

  const d = Math.max(0, Math.floor(diff / 86400000));
  const h = Math.max(0, Math.floor((diff % 86400000) / 3600000));
  const m = Math.max(0, Math.floor((diff % 3600000) / 60000));
  const s = Math.max(0, Math.floor((diff % 60000) / 1000));

  const units = [
    { v: d, label: 'ימים' },
    { v: h, label: 'שעות' },
    { v: m, label: 'דקות' },
    { v: s, label: 'שניות' },
  ];

  return (
    <section className="mx-auto max-w-5xl px-4 py-10">
      <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-navy via-navy-deep to-navy-light p-8 text-center">
        <div className="pointer-events-none absolute -top-16 start-1/3 h-56 w-56 rounded-full bg-gold/15 blur-[80px]" />
        <div className="relative">
          <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <Flame className="h-5 w-5 text-gold" />
          </span>

          {isShabbat ? (
            <>
              <h2 className="font-display text-3xl font-bold text-cream">שבת שלום ומבורך 🕯️</h2>
              <p className="mt-2 text-cream/60">
                {parsha ? `שבת ${parsha}` : 'שבת קודש'} — נתראה במוצאי שבת
              </p>
            </>
          ) : (
            <>
              <h2 className="font-display text-2xl font-bold text-cream md:text-3xl">
                {parsha ? `הדלקת נרות לשבת ${parsha}` : 'הדלקת נרות'} בעוד
              </h2>
              <div className="mt-5 flex justify-center gap-3" dir="ltr">
                {units.map((u) => (
                  <div key={u.label} className="min-w-[64px] rounded-2xl border border-gold/20 bg-white/5 px-3 py-3 backdrop-blur-sm">
                    <motion.div
                      key={u.label === 'שניות' ? s : u.v}
                      initial={{ y: -8, opacity: 0.5 }} animate={{ y: 0, opacity: 1 }}
                      className="font-display text-3xl font-bold text-gold"
                    >
                      {pad(u.v)}
                    </motion.div>
                    <div className="mt-1 text-[11px] text-cream/50">{u.label}</div>
                  </div>
                ))}
              </div>
              <p className="mt-5 flex items-center justify-center gap-2 text-sm text-cream/60">
                <Truck className="h-4 w-4 text-gold" />
                הזמינו עד חמישי 14:00 — ויגיע לשולחן השבת שלכם
              </p>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
