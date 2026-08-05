'use client';

// מאתר המתנה המושלמת — אשף 4 שלבים שמסנן את הקטלוג
// לפי נמען, אירוע, תקציב והתאמה אישית.

import { useEffect, useMemo, useRef, useState } from 'react';
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
  { id: 'b100', label: 'עד ₪100', min: 0, max: 100 },
  { id: 'b250', label: '₪100–250', min: 100, max: 250 },
  { id: 'b600', label: '₪250–600', min: 250, max: 600 },
  { id: 'lux', label: 'מעל ₪600', min: 600, max: Infinity },
];

const priceOf = (p: CatalogProduct) => p.discountPrice ?? p.basePrice;

// נירמול עברית להשוואת מילות מפתח (הסרת מרכאות/גרשיים)
const norm = (s: string) => (s || '').replace(/["'׳״׳״]/g, '').toLowerCase();

// מילות מפתח לכל אירוע — מזהות מוצר *באמת* רלוונטי (מותאם מול שם המוצר + תת-קטגוריה).
// זה מה שמבדיל בין מוצרים בתוך אותה קטגוריה, במקום ניקוד זהה לכולם.
const OCCASION_KW: Record<string, string[]> = {
  'חתונה': ['זוג', 'סט', 'קידוש', 'גביע', 'כוס', 'פמוט', 'ברכת הבית', 'מגן דוד', 'שרשרת', 'צמיד', 'חמסה'],
  'בר מצווה': ['תפילין', 'טלית', 'ציצית', 'כיפה', 'סידור', 'תהילים', 'שמע ישראל', 'מגן דוד'],
  'יולדת': ['תינוק', 'לידה', 'ברית', 'כרית', 'מזל טוב', 'חמסה', 'לרך הנולד'],
  'בית חדש': ['מזוזה', 'ברכת הבית', 'חמסה', 'ירושלים', 'כותל', 'פרנסה'],
  'שבת': ['פמוט', 'נרות', 'חלה', 'קידוש', 'גביע', 'מפית', 'פלטה', 'הבדלה', 'נטל', 'מלחי'],
  'חג': ['דבש', 'כוורת', 'שנה טובה', 'סדר', 'מגיל', 'חנוכי', 'סביבון', 'דריידל', 'אתרוג'],
};

// מילות מפתח לכל קהל יעד
const AUDIENCE_KW: Record<string, string[]> = {
  women: ['שרשרת', 'צמיד', 'עגיל', 'תכשיט', 'מטפחת', 'פמוט', 'אשת חיל', 'כרית'],
  men: ['תפילין', 'טלית', 'ציצית', 'כיפה', 'מפתחות', 'ארנק'],
  kids: ['ילד', 'תינוק', 'צבעוני', 'ראשית', 'סביבון'],
  family: [],
};

// Fire-and-forget CRM instrumentation. Never blocks or breaks the wizard:
// any failure (offline, misconfig, table missing) is silently ignored.
function sendGiftFinderEvent(payload: Record<string, unknown>) {
  try {
    fetch('/api/crm/gift-finder', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* no-op */
  }
}

export default function GiftFinderPage() {
  const [step, setStep] = useState(0);
  const [audience, setAudience] = useState<Audience | null>(null);
  const [occasion, setOccasion] = useState<string | null>(null);
  const [budget, setBudget] = useState<(typeof BUDGETS)[number] | null>(null);
  const [wantCustom, setWantCustom] = useState<boolean | null>(null);
  const [freeText, setFreeText] = useState('');
  const [showResults, setShowResults] = useState(false);
  // המלצות AI (Claude) — מגיעות אסינכרונית. אם נכשל/ריק — נופלים חזרה ל-rule-based.
  const [aiResult, setAiResult] = useState<{ intro?: string; recommendations: { id: string; reason: string }[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);

  const results = useMemo(() => {
    if (!showResults) return [];

    // Midpoint of the chosen budget band (for price-proximity tie-breaking)
    const bandMid = budget
      ? budget.max === Infinity
        ? budget.min * 1.5
        : (budget.min + budget.max) / 2
      : 0;

    const scored = PRODUCTS.filter(
      (p) => p.priceType !== 'quote' && p.stockStatus !== 'coming-soon',
    )
      .map((p) => {
        let score = 0;
        const price = priceOf(p);
        const hay = norm(`${p.titleHe} ${p.subcategory ?? ''} ${p.material ?? ''}`);

        // Category-level tags (coarse — same for every item in a category)
        const matchedAudience = Boolean(audience && p.audience?.includes(audience));
        const matchedOccasion = Boolean(occasion && p.occasions?.includes(occasion));
        const matchedCustom = Boolean(wantCustom && p.customization);

        // Per-product keyword relevance — THE differentiator within a category.
        // Counts how many occasion/audience keywords appear in this specific item.
        let occKw = 0;
        if (occasion) for (const kw of OCCASION_KW[occasion] ?? []) if (hay.includes(norm(kw))) occKw++;
        let audKw = 0;
        if (audience) for (const kw of AUDIENCE_KW[audience] ?? []) if (hay.includes(norm(kw))) audKw++;

        // Weights: keyword hits dominate so the most relevant items rise to the top.
        if (matchedAudience) score += 22;
        if (matchedOccasion) score += 18;
        score += Math.min(occKw, 3) * 16; // up to +48 — strongest signal
        score += Math.min(audKw, 2) * 10; // up to +20
        if (budget && price >= budget.min && price <= budget.max) score += 14;
        if (matchedCustom) score += 12;

        const quality = (p.badges.includes('recommended') ? 6 : 0) + (p.badges.includes('bestseller') ? 4 : 0);
        score += quality;

        // Genuine match = category tag OR a real keyword hit on this product
        const matchedAnyPref = matchedAudience || matchedOccasion || matchedCustom || occKw > 0 || audKw > 0;
        return { p, score, price, quality, matchedAnyPref };
      })
      .filter(({ price, matchedAnyPref }) => {
        if (budget && price > budget.max) return false; // hard budget ceiling
        const hasPrefs = audience || occasion || wantCustom;
        if (hasPrefs && !matchedAnyPref) return false; // require a genuine match
        return true;
      })
      .sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score;
        if (b.quality !== a.quality) return b.quality - a.quality; // quality before price
        if (budget) return Math.abs(a.price - bandMid) - Math.abs(b.price - bandMid);
        return b.price - a.price;
      });

    // Diversify: prefer distinct subcategories (max variety), cap 2 per category.
    const perCat: Record<string, number> = {};
    const perSub: Record<string, number> = {};
    const primary: typeof scored = [];
    const overflow: typeof scored = [];
    for (const item of scored) {
      const cat = item.p.category;
      const sub = item.p.subcategory ?? cat;
      if ((perSub[sub] ?? 0) < 1 && (perCat[cat] ?? 0) < 2) {
        perSub[sub] = 1;
        perCat[cat] = (perCat[cat] ?? 0) + 1;
        primary.push(item);
      } else {
        overflow.push(item);
      }
    }

    return [...primary, ...overflow].slice(0, 6).map(({ p }) => p);
  }, [showResults, audience, occasion, budget, wantCustom]);

  // One session id per run; used to correlate 'complete' + 'click' events.
  const sessionIdRef = useRef('');
  const postedRef = useRef(false);

  // Persist the completed session (answers + recommendations) exactly once,
  // when results are ready. Asynchronous and non-blocking.
  useEffect(() => {
    if (!showResults || postedRef.current) return;
    if (!sessionIdRef.current) {
      sessionIdRef.current =
        globalThis.crypto?.randomUUID?.() ?? `gf_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    }
    postedRef.current = true;
    sendGiftFinderEvent({
      action: 'complete',
      sessionId: sessionIdRef.current,
      audience,
      occasion,
      budgetId: budget?.id ?? null,
      budgetMax: budget && budget.max !== Infinity ? budget.max : null,
      wantCustom,
      resultsCount: results.length,
      recommendedProductIds: results.map((p) => p.id),
      recommendedCategories: Array.from(new Set(results.map((p) => p.category))),
    });
  }, [showResults, results, audience, occasion, budget, wantCustom]);

  const finish = async () => {
    trackEvent('gift_finder', {
      query: [audience, occasion, budget?.label, wantCustom ? 'התאמה' : ''].filter(Boolean).join(' | '),
    });
    setShowResults(true);
    // שכבת ה-AI: בקשה ליועץ החכם (Claude). ה-rule-based כבר מוכן כ-fallback.
    setAiResult(null);
    setAiLoading(true);
    try {
      const res = await fetch('/api/gift-finder/recommend', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          audience,
          occasion,
          budgetMin: budget?.min ?? 0,
          budgetMax: budget && budget.max !== Infinity ? budget.max : undefined,
          freeText: freeText.trim(),
        }),
      });
      const data = await res.json();
      if (data?.ok && Array.isArray(data.recommendations) && data.recommendations.length) {
        setAiResult({ intro: data.intro, recommendations: data.recommendations });
      }
    } catch {
      /* נופלים חזרה ל-rule-based */
    } finally {
      setAiLoading(false);
    }
  };

  // מיפוי המלצות ה-AI למוצרים מהקטלוג (עם הנימוק).
  const aiProducts = (aiResult?.recommendations ?? [])
    .map((r) => ({ product: PRODUCTS.find((p) => p.id === r.id), reason: r.reason }))
    .filter((x): x is { product: CatalogProduct; reason: string } => Boolean(x.product));

  const reset = () => {
    setStep(0); setAudience(null); setOccasion(null); setBudget(null); setWantCustom(null); setShowResults(false);
    setFreeText(''); setAiResult(null); setAiLoading(false);
    postedRef.current = false;
    sessionIdRef.current = '';
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
    {
      title: 'ספרו לנו קצת על מקבל/ת המתנה',
      content: (
        <div>
          <textarea
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            maxLength={400}
            rows={3}
            placeholder={'למשל: "לסבתא שאוהבת לארח בשבת ומעדיפה כסף", "לחתן דתי שמתחיל ללמוד בישיבה"...'}
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-3 text-sm leading-relaxed text-navy outline-none focus:border-gold"
          />
          <p className="mt-2 flex items-center justify-center gap-1.5 text-center text-xs text-navy/50">
            <Sparkles className="h-3.5 w-3.5 text-gold-soft" /> ככל שתפרטו יותר — היועץ החכם שלנו יתאים במדויק (לא חובה)
          </p>
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
          <div className="mb-6 flex items-start justify-between gap-4">
            <div>
              {aiLoading ? (
                <h2 className="flex items-center gap-2 font-display text-xl font-bold text-navy">
                  <Sparkles className="h-5 w-5 animate-pulse text-gold" /> היועץ החכם בוחר עבורכם…
                </h2>
              ) : aiProducts.length > 0 ? (
                <>
                  <h2 className="flex items-center gap-2 font-display text-xl font-bold text-navy">
                    <Sparkles className="h-5 w-5 text-gold" /> ההמלצות האישיות שלנו
                  </h2>
                  {aiResult?.intro && (
                    <p className="mt-1 max-w-2xl text-sm leading-relaxed text-navy/70">{aiResult.intro}</p>
                  )}
                </>
              ) : results.length > 0 ? (
                <>
                  <h2 className="font-display text-xl font-bold text-navy">מצאנו מתנות שיכולות להתאים לכם</h2>
                  <p className="mt-1 text-sm text-navy/60">ההמלצות מבוססות על מקבל המתנה, האירוע והתקציב שבחרתם.</p>
                </>
              ) : null}
            </div>
            <button onClick={reset} className="flex shrink-0 items-center gap-1.5 text-sm text-gold-soft hover:text-navy">
              <RotateCcw className="h-4 w-4" /> התחלה מחדש
            </button>
          </div>

          {aiLoading ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="aspect-[3/4] animate-pulse rounded-2xl bg-navy/5" />
              ))}
            </div>
          ) : aiProducts.length > 0 ? (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {aiProducts.map(({ product, reason }) => (
                <div
                  key={product.id}
                  onClick={() => sendGiftFinderEvent({ action: 'click', sessionId: sessionIdRef.current, productId: product.id })}
                >
                  <ProductCard product={product} />
                  {reason && (
                    <p className="mt-2 flex items-start gap-1.5 px-1 text-xs leading-snug text-navy/70">
                      <Sparkles className="mt-0.5 h-3 w-3 shrink-0 text-gold-soft" /> {reason}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="rounded-2xl border border-gold/20 bg-white p-10 text-center shadow-card">
              <p className="font-display text-xl font-bold text-navy">לא מצאנו כרגע מספיק מוצרים שעומדים בכל הבחירות שלכם</p>
              <p className="mt-2 text-sm text-navy/60">אפשר לשנות את התקציב או את האירוע כדי לקבל אפשרויות נוספות, או לדבר איתנו ונשמח לעזור.</p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button onClick={reset} className="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-cream hover:bg-gold hover:text-navy">
                  שינוי הבחירות
                </button>
                <Link href="/search" className="rounded-full border border-navy/15 px-6 py-2.5 text-sm font-bold text-navy hover:border-gold">
                  לכל הקטלוג
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-3">
              {results.map((p) => (
                <div
                  key={p.id}
                  onClick={() =>
                    sendGiftFinderEvent({ action: 'click', sessionId: sessionIdRef.current, productId: p.id })
                  }
                >
                  <ProductCard product={p} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
