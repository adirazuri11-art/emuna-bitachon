'use client';

import { Suspense, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Clock, Search, SearchX, TrendingUp } from 'lucide-react';
import { searchCatalog } from '@/lib/search';
import { LITE_PRODUCTS } from '@/lib/catalog-lite';
import type { CatalogProduct } from '@/lib/catalog';
import { ProductCard } from '@/components/products/ProductCard';
import { QuickViewModal } from '@/components/products/QuickViewModal';

const POPULAR_SEARCHES = [
  'מתנה לבית חדש',
  'כיפה לבר מצווה',
  'גביע עם חריטה',
  'מזוזה מודרנית',
  'מתנה עד 200',
  'טלית לחתן',
];

const HISTORY_KEY = 'emuna-search-history';

function SearchContent() {
  const params = useSearchParams();
  const initial = params.get('q') ?? '';
  const [query, setQuery] = useState(initial);
  const [history, setHistory] = useState<string[]>([]);
  const [quickView, setQuickView] = useState<CatalogProduct | null>(null);

  const results = useMemo(() => searchCatalog(query, 24), [query]);

  // היסטוריית חיפוש מקומית — נשמרת רק אצל המשתמש
  useEffect(() => {
    try {
      setHistory(JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (query.trim().length < 3 || results.length === 0) return;
    const t = setTimeout(() => {
      setHistory((prev) => {
        const next = [query.trim(), ...prev.filter((h) => h !== query.trim())].slice(0, 6);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }, 1500);
    return () => clearTimeout(t);
  }, [query, results.length]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-6 text-center font-display text-3xl font-bold text-navy">חיפוש בקטלוג</h1>

      <div className="relative mx-auto mb-10 max-w-xl">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          dir="rtl"
          autoFocus
          placeholder='למשל: "טלית לחתן עד 1,500"'
          aria-label="חיפוש מוצרים"
          className="gold-ring w-full rounded-full bg-white py-3 pe-12 ps-5 outline-none placeholder:text-navy/40"
        />
        <Search className="absolute end-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gold-soft" />
      </div>

      {query.trim() === '' ? (
        <>
          <div className="mx-auto mb-8 max-w-2xl">
            <div className="mb-2 flex items-center justify-center gap-1.5 text-xs font-medium text-navy/50">
              <TrendingUp className="h-3.5 w-3.5 text-gold-soft" /> חיפושים פופולריים
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              {POPULAR_SEARCHES.map((s) => (
                <button key={s} onClick={() => setQuery(s)}
                  className="rounded-full border border-navy/15 px-4 py-1.5 text-sm text-navy/70 transition-colors hover:border-gold hover:bg-gold/10">
                  {s}
                </button>
              ))}
            </div>
            {history.length > 0 && (
              <>
                <div className="mb-2 mt-4 flex items-center justify-center gap-1.5 text-xs font-medium text-navy/50">
                  <Clock className="h-3.5 w-3.5 text-gold-soft" /> החיפושים שלך
                </div>
                <div className="flex flex-wrap justify-center gap-2">
                  {history.map((s) => (
                    <button key={s} onClick={() => setQuery(s)}
                      className="rounded-full bg-navy/5 px-4 py-1.5 text-sm text-navy/60 transition-colors hover:bg-gold/15">
                      {s}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {LITE_PRODUCTS.slice(0, 8).map((p) => (
              <ProductCard key={p.id} product={p} onQuickView={(prod) => setQuickView(prod as CatalogProduct)} />
            ))}
          </div>
        </>
      ) : results.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <SearchX className="h-12 w-12 text-gold/50" strokeWidth={1.2} />
          <p className="font-display text-xl font-bold text-navy">לא מצאנו התאמה ל"{query}"</p>
          <p className="text-sm text-navy/50">
            נסו ניסוח אחר, או כתבו לנו בוואטסאפ — נשמח לעזור למצוא בדיוק את מה שחיפשתם.
          </p>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-navy/40">{results.length} תוצאות עבור "{query}"</p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {results.map(({ product }) => (
              <ProductCard key={product.id} product={product}
                onQuickView={(prod) => setQuickView(prod as CatalogProduct)} />
            ))}
          </div>
        </>
      )}

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<div className="skeleton mx-auto my-16 h-10 max-w-xl rounded-full" />}>
      <SearchContent />
    </Suspense>
  );
}
