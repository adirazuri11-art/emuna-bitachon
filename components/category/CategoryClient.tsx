'use client';

// עמוד קטגוריה: סינון, מיון, Quick View ו-Empty state — הכל בצד לקוח,
// על דאטה סטטי מהקטלוג (מהיר, בלי בקשות שרת).

import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { PackageSearch, SlidersHorizontal, X } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog';
import type { ProductCardData } from '@/types';
import { formatPrice, cn } from '@/lib/utils';
import { ProductCard } from '@/components/products/ProductCard';
import { QuickViewModal } from '@/components/products/QuickViewModal';

type SortKey = 'recommended' | 'new' | 'price-asc' | 'price-desc';

const SORTS: { id: SortKey; label: string }[] = [
  { id: 'recommended', label: 'מומלצים' },
  { id: 'new', label: 'חדשים' },
  { id: 'price-asc', label: 'מחיר: מהנמוך לגבוה' },
  { id: 'price-desc', label: 'מחיר: מהגבוה לנמוך' },
];

const priceOf = (p: CatalogProduct) => p.discountPrice ?? p.basePrice;

export function CategoryClient({
  products,
  subcategories = [],
}: {
  products: CatalogProduct[];
  subcategories?: string[];
}) {
  const searchParams = useSearchParams();
  const maxPrice = Math.max(...products.map(priceOf), 0);
  const [subFilter, setSubFilter] = useState<string | null>(searchParams.get('sub'));
  const [priceCap, setPriceCap] = useState(maxPrice);
  const [customizableOnly, setCustomizableOnly] = useState(false);
  const [inStockOnly, setInStockOnly] = useState(false);
  const [materialFilter, setMaterialFilter] = useState<string | null>(null);
  const [sort, setSort] = useState<SortKey>('recommended');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [quickView, setQuickView] = useState<CatalogProduct | null>(null);
  const [visibleCount, setVisibleCount] = useState(24);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // איפוס העימוד כשמשנים סינון/מיון
  useEffect(() => {
    setVisibleCount(24);
  }, [subFilter, priceCap, customizableOnly, inStockOnly, materialFilter, sort]);

  // חומרים ייחודיים לסינון — מהמילה הראשונה המשמעותית של כל חומר
  const materials = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => p.materials.forEach((m) => set.add(m.split(',')[0].trim())));
    return Array.from(set).slice(0, 6);
  }, [products]);

  const filtered = useMemo(() => {
    let list = products.filter((p) => priceOf(p) <= priceCap);
    if (subFilter) list = list.filter((p) => p.subcategory === subFilter);
    if (customizableOnly) list = list.filter((p) => p.isCustomizable);
    if (inStockOnly) list = list.filter((p) => p.stockStatus === 'in-stock');
    if (materialFilter) list = list.filter((p) => p.materials.some((m) => m.includes(materialFilter)));

    switch (sort) {
      case 'price-asc':
        return [...list].sort((a, b) => priceOf(a) - priceOf(b));
      case 'price-desc':
        return [...list].sort((a, b) => priceOf(b) - priceOf(a));
      case 'new':
        return [...list].sort((a, b) => Number(b.isNew ?? false) - Number(a.isNew ?? false));
      default:
        return [...list].sort((a, b) => b.badges.length - a.badges.length);
    }
  }, [products, priceCap, subFilter, customizableOnly, inStockOnly, materialFilter, sort]);

  // גלילה אינסופית — טוען עוד מוצרים אוטומטית כשמתקרבים לסוף (בלי כפתור)
  useEffect(() => {
    if (visibleCount >= filtered.length) return;
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      (entries) => { if (entries[0].isIntersecting) setVisibleCount((c) => c + 24); },
      { rootMargin: '800px' }, // טוען מבעוד מועד — המוצרים כבר שם כשמגיעים לסוף
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [visibleCount, filtered.length]);

  const resetFilters = () => {
    setPriceCap(maxPrice);
    setCustomizableOnly(false);
    setInStockOnly(false);
    setMaterialFilter(null);
    setSubFilter(null);
  };

  const activeFilters =
    Number(priceCap < maxPrice) + Number(customizableOnly) + Number(inStockOnly) + Number(Boolean(materialFilter));

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* תת-קטגוריות */}
      {subcategories.length > 1 && (
        <div className="mb-5 flex flex-wrap justify-center gap-2">
          <button onClick={() => setSubFilter(null)}
            className={cn('rounded-full border px-4 py-1.5 text-sm transition-colors',
              !subFilter ? 'border-gold bg-navy font-bold text-gold' : 'border-navy/15 text-navy/70 hover:border-gold/60')}>
            הכל
          </button>
          {subcategories.map((sub) => (
            <button key={sub} onClick={() => setSubFilter(subFilter === sub ? null : sub)}
              className={cn('rounded-full border px-4 py-1.5 text-sm transition-colors',
                subFilter === sub ? 'border-gold bg-navy font-bold text-gold' : 'border-navy/15 text-navy/70 hover:border-gold/60')}>
              {sub}
            </button>
          ))}
        </div>
      )}

      {/* פס סינון ומיון */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <button onClick={() => setFiltersOpen((v) => !v)}
          className="flex items-center gap-2 rounded-full border border-navy/15 px-4 py-2 text-sm font-medium text-navy hover:border-gold">
          <SlidersHorizontal className="h-4 w-4 text-gold-soft" />
          סינון {activeFilters > 0 && <span className="rounded-full bg-gold px-1.5 text-xs font-bold">{activeFilters}</span>}
        </button>

        <div className="flex items-center gap-2 text-sm">
          <label htmlFor="sort" className="text-navy/50">מיון:</label>
          <select id="sort" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-full border border-navy/15 bg-white px-3 py-2 text-sm outline-none focus:border-gold">
            {SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </select>
        </div>
      </div>

      {/* פאנל סינון */}
      {filtersOpen && (
        <div className="mb-6 grid gap-5 rounded-2xl border border-gold/20 bg-white p-5 shadow-card sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label htmlFor="price-cap" className="mb-1.5 flex justify-between text-sm font-medium text-navy">
              <span>מחיר עד</span><b>{formatPrice(priceCap)}</b>
            </label>
            <input id="price-cap" type="range" min={0} max={maxPrice} step={50} value={priceCap}
              onChange={(e) => setPriceCap(Number(e.target.value))}
              className="w-full accent-[#D4AF37]" />
          </div>

          <div>
            <span className="mb-1.5 block text-sm font-medium text-navy">חומר</span>
            <div className="flex flex-wrap gap-1.5">
              {materials.map((m) => (
                <button key={m} onClick={() => setMaterialFilter(materialFilter === m ? null : m)}
                  className={cn('rounded-full border px-2.5 py-1 text-xs transition-colors',
                    materialFilter === m ? 'border-gold bg-gold/15 font-bold text-navy' : 'border-navy/15 text-navy/60 hover:border-gold/50')}>
                  {m}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2 text-sm text-navy">
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={customizableOnly} onChange={(e) => setCustomizableOnly(e.target.checked)}
                className="h-4 w-4 accent-[#D4AF37]" />
              עם התאמה אישית
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input type="checkbox" checked={inStockOnly} onChange={(e) => setInStockOnly(e.target.checked)}
                className="h-4 w-4 accent-[#D4AF37]" />
              במלאי למשלוח מיידי
            </label>
          </div>

          <div className="flex items-end justify-end">
            <button onClick={resetFilters}
              className="flex items-center gap-1.5 text-sm text-navy/50 hover:text-red-500">
              <X className="h-4 w-4" /> ניקוי סינון
            </button>
          </div>
        </div>
      )}

      {/* תוצאות */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-20 text-center">
          <PackageSearch className="h-14 w-14 text-gold/50" strokeWidth={1.2} />
          <div>
            <p className="font-display text-xl font-bold text-navy">לא נמצאו מוצרים בסינון הזה</p>
            <p className="mt-1 text-sm text-navy/50">נסו להרחיב את טווח המחיר או לנקות חלק מהסינונים.</p>
          </div>
          <button onClick={resetFilters}
            className="rounded-full bg-navy px-6 py-2.5 text-sm font-bold text-cream hover:bg-gold hover:text-navy">
            ניקוי כל הסינונים
          </button>
        </div>
      ) : (
        <>
          <p className="mb-4 text-xs text-navy/40">{filtered.length} מוצרים</p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {filtered.slice(0, visibleCount).map((p) => (
              <ProductCard key={p.id} product={p}
                onQuickView={(prod: ProductCardData) => setQuickView(prod as CatalogProduct)} />
            ))}
          </div>
          {visibleCount < filtered.length && (
            <div ref={sentinelRef} className="mt-10 flex items-center justify-center gap-2 py-6 text-sm text-navy/40">
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-gold/30 border-t-gold" />
              טוען עוד מוצרים…
            </div>
          )}
        </>
      )}

      <QuickViewModal product={quickView} onClose={() => setQuickView(null)} />
    </div>
  );
}
