'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Gift, RotateCcw, Sparkles } from 'lucide-react';
import {
  PRODUCTS,
  OCCASIONS,
  AUDIENCE_LABELS,
  type Audience,
  type CatalogProduct,
} from '@/lib/catalog';
import { ProductCard } from '@/components/products/ProductCard';
import { trackEvent } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const BUDGETS = [
  { id: 'b100', label: 'עד ₪100', max: 100 },
  { id: 'b250', label: 'עד ₪250', max: 250 },
  { id: 'b600', label: 'עד ₪600', max: 600 },
  { id: 'lux', label: 'יוקרתי — בלי הגבלה', max: Infinity },
];

const priceOf = (p: CatalogProduct) => p.discountPrice ?? p.basePrice;

export default function GiftFinderPage() {
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [budget, setBudget] = useState<(typeof BUDGETS)[number] | null>(null);
  const [wantCustom, setWantCustom] = useState<boolean | null>(null);
  const [showResults, setShowResults] = useState(false);

  const results = useMemo(() => {
    if (!showResults) return [];

    // סינון בסיסי
    let candidates = PRODUCTS.filter((p) => p.priceType !== 'quote' && (!budget || priceOf(p) <= budget.max));

    // ניקוד חכם עם משקלים
    const scored = candidates.map((p) => {
      let score = 0;
      let match = 0;

      // נמען
      if (audience && p.audience?.includes(audience)) {
        score += 50;
        match++;
      }

      // אירוע
      if (occasion && p.occasions?.includes(occasion)) {
        score += 40;
        match++;
      } else if (occasion && p.tags.some((t) => t.toLowerCase().includes(occasion.toLowerCase()))) {
        score += 20;
        match++;
      }

      // התאמה אישית
      if (wantCustom && p.isCustomizable) {
        score += 30;
        match++;
      }

      // דירוג חנות
      if (p.badges.includes('bestseller')) score += 15;
      if (p.badges.includes('recommended')) score += 10;
      

      // מחיר טוב (שווי כסף)
      if (priceOf(p) < 200) score += 5;

      return { p, score, match };
    });

    // סינון חוכם
    let filtered = scored;
    if (audience || occasion || wantCustom) {
      // אם יש העדפות — דורשים לפחות התאמה משמעותית
      filtered = scored.filter(({ score }) => score >= 20);
    }

    // אם אין תוצאות — חזור ללא דרישות
    if (filtered.length === 0 && (audience || occasion || wantCustom)) {
      filtered = scored.filter(({ score }) => score >= 8);
    }

    // מיון ותהדוק
    return filtered
      .sort((a, b) => {
        // ראשית לפי ניקוד, ואחר כך לפי מחיר עולה
        if (b.score !== a.score) return b.score - a.score;
        return priceOf(a.p) - priceOf(b.p);
      })
      .slice(0, 12)
      .map(({ p }) => p);
  }, [showResults, audience, occasion, budget, wantCustom]);

  const finish = () => {
    trackEvent('gift_finder', {
      query: [audience, occasion, budget?.label, wantCustom ? 'התאמה' : ''].filter(Boolean).join(' | '),
      
    });
    setShowResults(true);
  };

  const reset = () => {
    setStep(0);
    setAudience(null);
    setOccasion(null);
    setBudget(null);
    setWantCustom(null);
    setShowResults(false);
  };

  const chip = (active: boolean) =>
    cn(
      'rounded-full border px-5 py-2.5 text-sm transition-all',
      active
        ? 'border-gold bg-navy font-bold text-gold shadow-gold'
        : 'border-navy/15 text-navy/70 hover:border-gold/60'
    );

  const steps = [
    {
      title: 'למי המתנה?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
            <button
              key={a}
              onClick={() => {
                setAudience(audience === a ? null : a);
              }}
              className={chip(audience === a)}
            >
              {AUDIENCE_LABELS[a]}
            </button>
          ))}
          <button onClick={() => setAudience(null)} className={chip(audience === null)}>
            לא משנה
          </button>
        </div>
      ),
    },
    {
      title: 'לאיזה אירוע?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {OCCASIONS.map((o) => (
            <button
              key={o}
              onClick={() => setOccasion(occasion === o ? null : o)}
              className={chip(occasion === o)}
            >
              {o}
            </button>
          ))}
          <button onClick={() => setOccasion(null)} className={chip(occasion === null)}>
            סתם לפנק
          </button>
        </div>
      ),
    },
    {
      title: 'מה התקציב?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {BUDGETS.map((b) => (
            <button
              key={b.id}
              onClick={() => setBudget(budget?.id === b.id ? null : b)}
              className={chip(budget?.id === b.id)}
            >
              {b.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'רוצים התאמה אישית?',
      description: 'כגון הקדשה, שם או אתחול',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          <button onClick={() => setWantCustom(true)} className={chip(wantCustom === true)}>
            כן, שיהיה אישי ✨
          </button>
          <button onClick={() => setWantCustom(null)} className={chip(wantCustom === null)}>
            לא משנה
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy">
          <Gift className="h-6 w-6 text-gold" />
        </span>
        <h1 className="font-display text-4xl font-bold text-navy">מאתר המתנה המושלמת</h1>
        <p className="mt-2 text-navy/60">
          ארבע שאלות — ותמצאו בדיוק את המתנה שתרצו לתת
        </p>
      </div>

      {!showResults ? (
        <div className="mx-auto mt-10 max-w-2xl rounded-2xl border border-gold/25 bg-white p-8 shadow-card">
          {/* מד התקדמות */}
          <div className="mb-8 flex gap-1.5">
            {steps.map((_, i) => (
              <div
                key={i}
                className={cn('h-2 flex-1 rounded-full transition-colors', i <= step ? 'bg-gold' : 'bg-navy/10')}
              />
            ))}
          </div>

          <div>
            <h2 className="mb-1 text-center font-display text-2xl font-bold text-navy">{steps[step].title}</h2>
            {steps[step].description && (
              <p className="text-center text-sm text-navy/60">{steps[step].description}</p>
            )}
          </div>

          <div className="mt-7">{steps[step].content}</div>

          <div className="mt-8 flex justify-between">
            <button
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
              className="text-sm text-navy/50 hover:text-navy disabled:invisible"
            >
              ← חזרה
            </button>
            {step < steps.length - 1 ? (
              <button
                onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-cream hover:bg-gold hover:text-navy transition-colors"
              >
                המשך <ArrowRight className="h-4 w-4 -scale-x-100" />
              </button>
            ) : (
              <button
                onClick={finish}
                className="flex items-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft px-6 py-2.5 text-sm font-bold text-navy shadow-gold hover:scale-[1.02] transition-transform"
              >
                <Sparkles className="h-4 w-4" /> מצאו לי מתנה
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <div className="mb-8 flex items-center justify-between">
            <div>
              <p className="text-sm text-navy/60">
                {results.length > 0 ? `${results.length} מתנות שנבחרו במיוחד עבורכם:` : ''}
              </p>
            </div>
            <button
              onClick={reset}
              className="flex items-center gap-1.5 text-sm text-gold hover:text-navy transition-colors"
            >
              <RotateCcw className="h-4 w-4" /> חיפוש חדש
            </button>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-gold/20 bg-white p-12 text-center shadow-card">
              <p className="font-display text-xl font-bold text-navy">אנחנו לא מצאנו התאמה מדויקת</p>
              <p className="mt-3 text-sm text-navy/60">
                הרחיבו את התקציב או בואו נמצא את המתנה ביחד — צרו קשר בוואטסאפ או לחצו לכל הקטלוג
              </p>
              <div className="mt-6 flex gap-3 justify-center">
                <Link
                  href="https://wa.me/972503096969"
                  target="_blank"
                  className="inline-block rounded-full bg-green-600 px-6 py-2.5 text-sm font-bold text-white hover:bg-green-700"
                >
                  וואטסאפ
                </Link>
                <Link
                  href="/search"
                  className="inline-block rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-cream hover:bg-gold hover:text-navy"
                >
                  לכל הקטלוג
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
