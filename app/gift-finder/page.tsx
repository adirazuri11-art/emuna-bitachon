'use client';

// מאתר המתנה המושלמת — אשף 4 שלבים שמסנן את הקטלוג
// לפי נמען, אירוע, תקציב והתאמה אישית.

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
  { id: 'b250', label: '₪100–250', max: 250 },
  { id: 'b600', label: '₪250–600', max: 600 },
  { id: 'lux', label: 'מעל ₪600', max: Infinity },
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
    return PRODUCTS.filter((p) => p.priceType !== 'quote' && p.stockStatus !== 'coming-soon')
      .map((p) => {
        let score = 0;

        // Audience matching (hard signal: products are enriched with category-based audience)
        if (audience && p.audience?.includes(audience)) score += 40;

        // Occasion matching (hard signal: products are enriched with category-based occasions)
        if (occasion && p.occasions?.includes(occasion)) score += 35;

        // Customization bonus (soft signal: nice-to-have)
        if (wantCustom && p.customization) score += 15;

        // Popularity signal (soft signal: tie-breaker)
        if (p.badges.includes('recommended')) score += 5;
        if (p.badges.includes('bestseller')) score += 3;

        return { p, score };
      })
      .filter(({ p, score }) => {
        // Hard constraint: budget
        if (budget && priceOf(p) > budget.max) return false;

        // Hard constraint: if user selected preferences, require minimum score
        // (products should have at least one matching dimension)
        const hasPrefs = audience || occasion || wantCustom;
        if (hasPrefs && score < 5) return false;

        return true;
      })
      .sort((a, b) => {
        // Primary sort: score (descending)
        if (b.score !== a.score) return b.score - a.score;
        // Secondary sort: price (prefer mid-range over extremes)
        const priceA = priceOf(a.p);
        const priceB = priceOf(b.p);
        if (budget) {
          const midPrice = budget.max * 0.6;
          const distA = Math.abs(priceA - midPrice);
          const distB = Math.abs(priceB - midPrice);
          return distA - distB;
        }
        return priceB - priceA;
      })
      .slice(0, 8)
      .map(({ p }) => p);
  }, [showResults, audience, occasion, budget, wantCustom]);

  const finish = () => {
    trackEvent('gift_finder', {
      query: [audience, occasion, budget?.label, wantCustom ? 'התאמה' : ''].filter(Boolean).join(' | '),
    });
    setShowResults(true);
  };

  const reset = () => {
    setStep(0); setAudience(null); setOccasion(null); setBudget(null); setWantCustom(null); setShowResults(false);
  };

  const chip = (active: boolean) =>
    cn('rounded-full border px-5 py-2.5 text-sm transition-all',
      active ? 'border-gold bg-navy font-bold text-gold shadow-gold' : 'border-navy/15 text-navy/70 hover:border-gold/60');

  const steps = [
    {
      title: 'למי מיועדת המתנה?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
            <button key={a} onClick={() => { setAudience(audience === a ? null : a); }} className={chip(audience === a)}>
              {AUDIENCE_LABELS[a]}
            </button>
          ))}
          <button onClick={() => setAudience(null)} className={chip(audience === null)}>עדיין לא בטוח</button>
        </div>
      ),
    },
    {
      title: 'לאיזה אירוע?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {OCCASIONS.map((o) => (
            <button key={o} onClick={() => setOccasion(occasion === o ? null : o)} className={chip(occasion === o)}>
              {o}
            </button>
          ))}
          <button onClick={() => setOccasion(null)} className={chip(occasion === null)}>ללא אירוע מיוחד</button>
        </div>
      ),
    },
    {
      title: 'מה התקציב המתאים לכם?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {BUDGETS.map((b) => (
            <button key={b.id} onClick={() => setBudget(budget?.id === b.id ? null : b)} className={chip(budget?.id === b.id)}>
              {b.label}
            </button>
          ))}
        </div>
      ),
    },
    {
      title: 'האם תרצו אפשרות להקדשה או להתאמה אישית?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          <button onClick={() => setWantCustom(true)} className={chip(wantCustom === true)}>כן, חשוב לנו</button>
          <button onClick={() => setWantCustom(null)} className={chip(wantCustom === null)}>אפשרי, אבל לא חובה</button>
        </div>
      ),
    },
  ];

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy">
          <Gift className="h-6 w-6 text-gold" />
        </span>
        <h1 className="font-display text-3xl font-bold text-navy">מוצאים את המתנה המושלמת</h1>
        <p className="mt-2 text-navy/60">כמה שאלות קצרות, והמלצות מדויקות מתוך הקטלוג שלנו</p>
      </div>

      {!showResults ? (
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-gold/25 bg-white p-6 shadow-card">
          {/* מד התקדמות */}
          <div className="mb-6 flex gap-1.5">
            {steps.map((_, i) => (
              <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-colors', i <= step ? 'bg-gold' : 'bg-navy/10')} />
            ))}
          </div>

          <h2 className="mb-5 text-center font-display text-xl font-bold text-navy">{steps[step].title}</h2>
          {steps[step].content}

          <div className="mt-7 flex justify-between">
            <button onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}
              className="rounded-full px-4 py-2 text-sm text-navy/50 hover:text-navy disabled:invisible">
              חזרה
            </button>
            {step < steps.length - 1 ? (
              <button onClick={() => setStep((s) => s + 1)}
                className="flex items-center gap-2 rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-cream hover:bg-gold hover:text-navy">
                המשך <ArrowRight className="h-4 w-4 -scale-x-100" />
              </button>
            ) : (
              <button onClick={finish}
                className="flex items-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft px-6 py-2.5 text-sm font-bold text-navy shadow-gold hover:scale-[1.02]">
                <Sparkles className="h-4 w-4" /> מצאו לי מתנה
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-10">
          <div className="mb-6 flex items-center justify-between">
            <p className="text-sm text-navy/60">
              {results.length > 0 ? `${results.length} מתנות שיכולות להתאים לבחירות שלכם:` : ''}
            </p>
            <button onClick={reset} className="flex items-center gap-1.5 text-sm text-gold-soft hover:text-navy">
              <RotateCcw className="h-4 w-4" /> חיפוש חדש
            </button>
          </div>

          {results.length === 0 ? (
            <div className="rounded-2xl border border-gold/20 bg-white p-10 text-center shadow-card">
              <p className="font-display text-xl font-bold text-navy">לא מצאנו התאמה מדויקת לשילוב הזה</p>
              <p className="mt-2 text-sm text-navy/60">נסו להרחיב את התקציב, או דברו איתנו בוואטסאפ — נמצא יחד את המתנה.</p>
              <Link href="/search" className="mt-5 inline-block rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-cream hover:bg-gold hover:text-navy">
                לכל הקטלוג
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {results.map((p) => <ProductCard key={p.id} product={p} />)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
