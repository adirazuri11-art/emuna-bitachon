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
    return PRODUCTS.filter((p) => p.priceType !== 'quote')
      .map((p) => {
        let score = 0;
        if (audience && p.audience?.includes(audience)) score += 3;
        if (occasion && (p.occasions?.includes(occasion) || p.tags.some((t) => t.includes(occasion)))) score += 3;
        if (wantCustom && p.isCustomizable) score += 2;
        if (p.badges.includes('bestseller') || p.badges.includes('recommended')) score += 1;
        return { p, score };
      })
      .filter(({ p, score }) => {
        if (budget && priceOf(p) > budget.max) return false;
        // אם נבחרו העדפות — דורשים לפחות התאמה אחת
        const hasPrefs = audience || occasion || wantCustom;
        return hasPrefs ? score > 0 : true;
      })
      .sort((a, b) => b.score - a.score || priceOf(b.p) - priceOf(a.p))
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
      title: 'למי המתנה?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          {(Object.keys(AUDIENCE_LABELS) as Audience[]).map((a) => (
            <button key={a} onClick={() => { setAudience(audience === a ? null : a); }} className={chip(audience === a)}>
              {AUDIENCE_LABELS[a]}
            </button>
          ))}
          <button onClick={() => setAudience(null)} className={chip(audience === null)}>לא משנה</button>
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
          <button onClick={() => setOccasion(null)} className={chip(occasion === null)}>סתם לפנק</button>
        </div>
      ),
    },
    {
      title: 'מה התקציב?',
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
      title: 'רוצים התאמה אישית (שם / הקדשה)?',
      content: (
        <div className="flex flex-wrap justify-center gap-2.5">
          <button onClick={() => setWantCustom(true)} className={chip(wantCustom === true)}>כן, שיהיה אישי ✨</button>
          <button onClick={() => setWantCustom(null)} className={chip(wantCustom === null)}>לא משנה</button>
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
        <h1 className="font-display text-3xl font-bold text-navy">מאתר המתנה המושלמת</h1>
        <p className="mt-2 text-navy/60">ארבע שאלות קצרות — ואנחנו מציעים בדיוק את המתנות הנכונות.</p>
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
              → חזרה
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
              {results.length > 0 ? `${results.length} מתנות שנבחרו במיוחד עבורכם:` : ''}
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
