'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Check, ChevronLeft, FileText, Heart, MessageCircle, ShieldCheck, ShoppingBag, Truck } from 'lucide-react';
import { BADGE_LABELS, STOCK_LABELS } from '@/lib/catalog-constants';
import type { CatalogProduct } from '@/lib/catalog';
import { getLiteProduct, type LiteProduct } from '@/lib/catalog-lite';
import { computePrice } from '@/lib/pricing';
import { formatPrice, cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { useRecentlyViewedStore } from '@/store/recently-viewed';
import { useToastStore } from '@/store/toast';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductCustomizer } from '@/components/customizer/ProductCustomizer';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '972503096969';

const GENERIC_FAQ = [
  {
    q: 'כמה זמן לוקחת התאמה אישית?',
    a: 'זמן ההכנה המשוער מופיע בעמוד המוצר. מוצרים עם רקמה, אריגה או חריטה דורשים בדרך כלל מספר ימי עבודה נוספים. באירועים דחופים — כתבו לנו בוואטסאפ ונבדוק אפשרות לזירוז.',
  },
  {
    q: 'אפשר להחזיר מוצר בהתאמה אישית?',
    a: 'מוצר שנעשתה עליו התאמה אישית (שם, תאריך, לוגו) מיוצר במיוחד עבורך ולכן אינו ניתן להחזרה או החלפה, למעט מקרה של פגם בייצור — שאז נתקן או נחליף על חשבוננו.',
  },
  {
    q: 'איך מוודאים שהטקסט ייצא בדיוק כמו שכתבתי?',
    a: 'הטקסט נשמר בדיוק כפי שהוקלד, כולל ניקוד וגרשיים. לפני ייצור של הזמנות מותאמות אנחנו שולחים אישור סופי בוואטסאפ.',
  },
  {
    q: 'האם המוצרים מגיעים עם אישורי כשרות?',
    a: 'מוצרים הדורשים אישור הלכתי (סת"ם, ציציות, תפילין) מגיעים עם תעודה מהגורם המוסמך המצוין בעמוד המוצר.',
  },
];

function Accordion({ title, children, open }: { title: string; children: React.ReactNode; open?: boolean }) {
  return (
    <details open={open} className="group border-b border-navy/10 py-3">
      <summary className="flex cursor-pointer list-none items-center justify-between font-medium text-navy [&::-webkit-details-marker]:hidden">
        {title}
        <ChevronLeft className="h-4 w-4 text-gold-soft transition-transform group-open:-rotate-90" />
      </summary>
      <div className="pt-3 text-sm leading-relaxed text-navy/70">{children}</div>
    </details>
  );
}

export function ProductPageClient({
  product,
  related,
  categorySlug,
}: {
  product: CatalogProduct;
  related: CatalogProduct[];
  categorySlug?: string;
}) {
  const [activeView, setActiveView] = useState(0);
  const [zoomed, setZoomed] = useState(false);
  const [added, setAdded] = useState(false);
  // ברירת מחדל: האופציה הסטנדרטית (ללא תוספת מחיר), לא סתם הראשונה ברשימה
  const [variantSelections, setVariantSelections] = useState<Record<string, string>>(() =>
    Object.fromEntries(
      (product.variantGroups ?? []).map((g) => [
        g.id,
        (g.options.find((o) => o.priceDelta === 0) ?? g.options[0]).id,
      ])
    )
  );

  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) => s.slugs.includes(product.slug));
  const recentSlugs = useRecentlyViewedStore((s) => s.slugs);
  const addRecent = useRecentlyViewedStore((s) => s.add);
  const showToast = useToastStore((s) => s.show);
  const [mounted, setMounted] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [showSizeGuide, setShowSizeGuide] = useState(false);

  useEffect(() => {
    setMounted(true);
    addRecent(product.slug);
    trackEvent('view_item', {
      value: product.discountPrice ?? product.basePrice,
      items: [{ id: product.id, name: product.titleHe, price: product.discountPrice ?? product.basePrice }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.slug]);

  const price = computePrice({ product, variantSelections });
  // וריאנטי מידה (כיפות) — מחיר נגזר מהמידה הנבחרת; "החל מ־" עד לבחירה.
  const hasSizes = (product.sizeVariants?.length ?? 0) > 0;
  const selectedVariant = hasSizes ? product.sizeVariants!.find((v) => v.size === selectedSize) : undefined;
  const unitPrice = hasSizes ? (selectedVariant?.price ?? Math.min(...product.sizeVariants!.map((v) => v.price))) : price.unitPrice;
  const view = product.gallery[activeView] ?? product.gallery[0];

  const recentlyViewed = useMemo(
    () =>
      recentSlugs
        .filter((s) => s !== product.slug)
        .map(getLiteProduct)
        .filter((p): p is LiteProduct => Boolean(p))
        .slice(0, 4),
    [recentSlugs, product.slug]
  );

  const handleQuickAdd = () => {
    // כיפות עם מידות — חובה לבחור מידה לפני הוספה לסל (הודעה מעוצבת, לא alert).
    if (hasSizes && !selectedVariant) {
      showToast('יש לבחור מידה לפני ההוספה לסל', 'info');
      return;
    }
    const customization =
      product.variantGroups && product.variantGroups.length > 0
        ? Object.fromEntries(
            product.variantGroups.map((g) => [
              g.label,
              g.options.find((o) => o.id === variantSelections[g.id])?.label ?? '',
            ])
          )
        : undefined;
    const itemId = selectedVariant ? selectedVariant.slug : `${product.id}${customization ? `-${Object.values(customization).join('-')}` : ''}`;
    const itemTitle = selectedVariant ? `${product.titleHe} · מידה ${selectedVariant.size}` : product.titleHe;
    addItem({
      id: itemId,
      title: itemTitle,
      price: unitPrice,
      minQty: product.minOrderUnits,
      ...(selectedVariant ? { size: selectedVariant.size, sku: selectedVariant.code } : {}),
      customization,
    });
    trackEvent('add_to_cart', {
      value: unitPrice,
      items: [{ id: selectedVariant?.code ?? product.id, name: itemTitle, price: unitPrice }],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
    showToast('נוסף לסל ✓');
  };

  const handleWishlist = () => {
    const nowIn = toggleWishlist(product.slug);
    showToast(nowIn ? 'נשמר במועדפים ♥' : 'הוסר מהמועדפים', 'info');
  };

  const whatsappHref = `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
    `שלום, אשמח לייעוץ לגבי: ${product.titleHe} (מק"ט ${product.sku})`
  )}`;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 pb-28 lg:pb-8">
      {/* Breadcrumbs */}
      <nav aria-label="ניווט משנה" className="mb-6 flex flex-wrap items-center gap-1.5 text-xs text-navy/50">
        <Link href="/" className="hover:text-gold-soft">ראשי</Link>
        <span>/</span>
        {categorySlug && (
          <>
            <Link href={`/category/${categorySlug}`} className="hover:text-gold-soft">{product.category}</Link>
            <span>/</span>
          </>
        )}
        <span className="text-navy/80">{product.titleHe}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        {/* ===== גלריה ===== */}
        <div>
          <div
            className="relative cursor-zoom-in overflow-hidden rounded-2xl border border-gold/15 bg-gradient-to-b from-white to-cream"
            onClick={() => setZoomed((z) => !z)}
            role="button"
            aria-label={zoomed ? 'ביטול תקריב' : 'תקריב על התמונה'}
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && setZoomed((z) => !z)}
          >
            <Image
              src={view.src}
              alt={`${product.titleHe} — ${view.label}`}
              fill
              className="object-contain p-6 transition-transform duration-500"
              style={{ transform: `scale(${zoomed ? 1.8 : 1})` }}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 70vw, 50vw"
            />
            {view.src.startsWith('http') && (
              <span className="pointer-events-none absolute bottom-2 start-2 z-[1] flex items-center rounded-md bg-white/85 px-2 py-1 shadow-sm backdrop-blur-sm">
                <Image src="/brand/emuna-vebitachon-logo.png" alt="אמונה וביטחון" width={20} height={20} className="opacity-90" />
              </span>
            )}
            {product.isPlaceholderImage && (
              <span className="absolute bottom-2 start-2 rounded-full bg-navy/80 px-2.5 py-1 text-[10px] text-cream/70 backdrop-blur-sm">
                תמונת המחשה — צילומי המוצר בדרך
              </span>
            )}
          </div>
          <div className="mt-3 flex gap-2">
            {product.gallery.map((g, i) => (
              <button
                key={g.label}
                onClick={() => { setActiveView(i); setZoomed(false); }}
                className={cn(
                  'flex-1 overflow-hidden rounded-xl border-2 bg-white transition-colors',
                  i === activeView ? 'border-gold' : 'border-transparent opacity-60 hover:opacity-100'
                )}
                aria-label={g.label}
              >
                <div className="relative aspect-square w-full">
                  <Image src={g.src} alt={g.label} fill className="object-contain p-2" sizes="100px" />
                </div>
                <span className="block bg-white py-1 text-center text-[10px] text-navy/60">{g.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ===== פרטי מוצר ===== */}
        <div>
          <div className="mb-2 flex flex-wrap gap-1.5">
            {product.badges.map((b) => (
              <span key={b} className="rounded-full bg-gold/15 px-2.5 py-1 text-[11px] font-bold text-gold-soft">
                {BADGE_LABELS[b]}
              </span>
            ))}
            {product.certification && (
              <span className="flex items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-[11px] font-medium text-gold">
                <ShieldCheck className="h-3 w-3" /> {product.certification}
              </span>
            )}
          </div>

          <h1 className="font-display text-3xl font-bold leading-tight text-navy">{product.titleHe}</h1>
          <p className="mt-1 text-xs text-navy/40">מק"ט {product.sku}</p>
          <p className="mt-3 leading-relaxed text-navy/70">{product.shortDescription}</p>

          {/* מחיר דינמי */}
          <div className="mt-4 flex items-end gap-2">
            {product.priceType === 'quote' ? (
              <span className="font-display text-2xl font-bold text-navy">לקבלת הצעת מחיר</span>
            ) : (
              <>
                {product.priceType === 'from' && !selectedVariant && <span className="mb-1 text-sm font-medium text-navy/50">החל מ־</span>}
                {product.discountPrice && (
                  <span className="text-lg text-navy/40 line-through">{formatPrice(product.basePrice)}</span>
                )}
                <span className="font-display text-3xl font-bold text-navy">
                  {formatPrice(unitPrice)}
                  {product.minOrderUnits && <span className="text-sm font-medium text-navy/50"> ליחידה</span>}
                </span>
                {product.minOrderUnits && (
                  <span className="mt-1 text-sm font-semibold text-gold-soft">
                    מארז {product.minOrderUnits} יח' · {formatPrice(price.unitPrice * product.minOrderUnits)} · מינימום הזמנה {product.minOrderUnits}
                  </span>
                )}
              </>
            )}
          </div>

          {/* מלאי + אספקה */}
          <div className="mt-3 space-y-1 text-sm">
            <p className={cn('flex items-center gap-1.5 font-medium',
              product.stockStatus === 'in-stock' ? 'text-emerald-700' : 'text-gold-soft')}>
              <Check className="h-4 w-4" /> {STOCK_LABELS[product.stockStatus]}
              {product.stockLeft !== undefined && product.stockLeft <= 3 && (
                <span className="font-bold text-red-600">
                  · {product.stockLeft === 1 ? 'אחרון במלאי!' : `נשארו ${product.stockLeft}`}
                </span>
              )}
            </p>
            <p className="flex items-center gap-1.5 text-navy/60">
              <Truck className="h-4 w-4 text-gold-soft" />
              זמן הכנה: {product.prepTimeDays[0]}–{product.prepTimeDays[1]} ימי עסקים + משלוח
            </p>
          </div>

          {/* מדיניות ביטול / החזרה */}
          {product.customization ? (
            <p className="mt-3 rounded-lg border border-gold/25 bg-gold/5 p-3 text-xs leading-relaxed text-navy/70">
              מוצר זה מיוצר או מותאם במיוחד עבורכם. לאחר תחילת ההתאמה לא ניתן לבטל את ההזמנה עקב שינוי
              דעת, בכפוף להוראות הדין. במקרה של פגם או אי־התאמה להזמנה — נטפל ללא עלות נוספת.{' '}
              <Link href="/returns" className="text-gold-soft underline hover:text-navy">
                מדיניות מלאה
              </Link>
            </p>
          ) : (
            <p className="mt-3 text-xs text-navy/50">
              ניתן לבטל או להחזיר בהתאם ל
              <Link href="/returns" className="text-gold-soft underline hover:text-navy">
                מדיניות ההחזרות
              </Link>{' '}
              ולהוראות חוק הגנת הצרכן.
            </p>
          )}

          {/* בורר מידות (כיפות) */}
          {hasSizes && (
            <div className="mt-5">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm font-medium text-navy">
                  בחרו מידה{selectedVariant ? <span className="text-gold-soft"> · {selectedVariant.unit === 'cm' ? `${selectedVariant.size} ס״מ` : `גודל ${selectedVariant.size}${selectedVariant.diameterCm ? ` · ≈${selectedVariant.diameterCm} ס״מ` : ''}`}</span> : ''}
                </span>
                <button type="button" onClick={() => setShowSizeGuide(true)}
                  className="text-xs text-gold-soft underline underline-offset-2 hover:text-navy">
                  איך בוחרים מידה?
                </button>
              </div>
              {(() => {
                const all = product.sizeVariants!;
                const cm = all.filter((v) => (v.unit ?? 'cm') === 'cm').sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
                const gr = all.filter((v) => v.unit === 'grade').sort((a, b) => parseFloat(a.size) - parseFloat(b.size));
                const both = cm.length > 0 && gr.length > 0;
                const btn = (v: NonNullable<typeof product.sizeVariants>[number]) => (
                  <button key={v.code} type="button" onClick={() => setSelectedSize(v.size)}
                    aria-pressed={selectedSize === v.size}
                    aria-label={v.unit === 'cm' ? `מידה ${v.size} סנטימטר` : `גודל ${v.size}${v.diameterCm ? ` כ-${v.diameterCm} סנטימטר` : ''}`}
                    className={cn('flex min-h-[48px] min-w-[56px] flex-col items-center justify-center rounded-xl border px-3 py-1.5 transition-colors',
                      selectedSize === v.size ? 'border-gold bg-gold/15 text-navy shadow-sm' : 'border-navy/15 text-navy/70 hover:border-gold/60')}>
                    <span className="text-base font-bold leading-none">{v.size}</span>
                    <span className="mt-0.5 text-[10px] leading-none text-navy/45">{v.unit === 'cm' ? 'ס״מ' : v.diameterCm ? `≈${v.diameterCm} ס״מ` : 'גודל'}</span>
                  </button>
                );
                return (
                  <div className="space-y-3">
                    {cm.length > 0 && (
                      <div>
                        {both && <div className="mb-1.5 text-xs font-medium text-navy/45">מידה בסנטימטרים</div>}
                        <div className="flex flex-wrap gap-2">{cm.map(btn)}</div>
                      </div>
                    )}
                    {gr.length > 0 && (
                      <div>
                        {both && <div className="mb-1.5 text-xs font-medium text-navy/45">מידת גודל</div>}
                        <div className="flex flex-wrap gap-2">{gr.map(btn)}</div>
                      </div>
                    )}
                  </div>
                );
              })()}
              {!selectedVariant && <p className="mt-2 text-xs text-navy/45">בחרו מידה כדי להוסיף לסל</p>}
            </div>
          )}

          {/* וריאציות */}
          {(product.variantGroups ?? []).map((group) => (
            <div key={group.id} className="mt-5">
              <span className="mb-1.5 block text-sm font-medium text-navy">{group.label}</span>
              <div className="flex flex-wrap items-center gap-2">
                {group.options.map((o) =>
                  o.hex ? (
                    <button key={o.id} type="button" title={o.label} aria-label={o.label}
                      onClick={() => setVariantSelections((s) => ({ ...s, [group.id]: o.id }))}
                      className={cn('h-8 w-8 rounded-full border-2 transition-transform',
                        variantSelections[group.id] === o.id ? 'scale-110 border-navy' : 'border-navy/10 hover:scale-105')}
                      style={{ backgroundColor: o.hex }} />
                  ) : (
                    <button key={o.id} type="button"
                      onClick={() => setVariantSelections((s) => ({ ...s, [group.id]: o.id }))}
                      className={cn('rounded-full border px-3 py-1.5 text-xs transition-colors',
                        variantSelections[group.id] === o.id
                          ? 'border-gold bg-gold/15 font-bold text-navy'
                          : 'border-navy/15 text-navy/70 hover:border-gold/60')}>
                      {o.label}
                      {o.priceDelta !== 0 && (
                        <span className="ms-1 text-navy/40">
                          ({o.priceDelta > 0 ? '+' : ''}{formatPrice(o.priceDelta)})
                        </span>
                      )}
                    </button>
                  )
                )}
              </div>
            </div>
          ))}

          {/* פעולות */}
          <div className="mt-6 flex gap-2">
            {product.priceType === 'quote' ? (
              <Link href={`/quote?product=${encodeURIComponent(product.titleHe)}&sku=${product.sku}`}
                className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft py-3 font-bold text-navy shadow-gold transition-transform hover:scale-[1.01]">
                <FileText className="h-5 w-5" /> בקשת הצעת מחיר
              </Link>
            ) : (
              <button onClick={handleQuickAdd}
                className={cn('flex flex-1 items-center justify-center gap-2 rounded-full py-3 font-bold transition-all',
                  added ? 'bg-emerald-600 text-white' : 'bg-navy text-cream hover:bg-gold hover:text-navy')}>
                {added ? <><Check className="h-5 w-5" /> נוסף לסל</> : <><ShoppingBag className="h-5 w-5" /> הוספה לסל</>}
              </button>
            )}
            <button onClick={handleWishlist} aria-label="הוספה למועדפים" aria-pressed={mounted && inWishlist}
              className={cn('rounded-full border p-3 transition-colors',
                mounted && inWishlist ? 'border-red-300 bg-red-50 text-red-500' : 'border-navy/15 text-navy/60 hover:border-gold')}>
              <Heart className={cn('h-5 w-5', mounted && inWishlist && 'fill-red-500')} />
            </button>
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" aria-label="התייעצות בוואטסאפ"
              onClick={() => trackEvent('whatsapp_click')}
              className="rounded-full border border-navy/15 p-3 text-[#25D366] hover:border-[#25D366]">
              <MessageCircle className="h-5 w-5" />
            </a>
          </div>

          {product.customization && (
            <p className="mt-3 rounded-xl bg-gold/10 px-3 py-2 text-xs text-navy/70">
              ✨ למוצר זה יש התאמה אישית מלאה — גללו מטה לעיצוב שלכם עם תצוגה חיה.
            </p>
          )}

          {/* אקורדיונים */}
          <div className="mt-6">
            <Accordion title="על המוצר" open>
              {product.longDescription.map((p) => <p key={p.slice(0, 20)} className="mb-2">{p}</p>)}
            </Accordion>
            <Accordion title="חומרים ומידות">
              <ul className="list-inside list-disc space-y-1">
                {product.materials.map((m) => <li key={m}>{m}</li>)}
              </ul>
              {product.dimensions && <p className="mt-2"><b>מידות:</b> {product.dimensions}</p>}
              {product.colors && <p className="mt-1"><b>צבעים זמינים:</b> {product.colors.join(', ')}</p>}
            </Accordion>
            {product.careInstructions && (
              <Accordion title="טיפול ואחזקה">{product.careInstructions}</Accordion>
            )}
            <Accordion title="משלוח, החלפות והחזרות">
              <p>משלוח חינם בהזמנה מעל ₪399 · משלוח אקספרס 1–3 ימי עסקים לכל הארץ.</p>
              <p className="mt-1">
                מוצרים רגילים ניתנים להחזרה תוך 30 יום. <b>מוצרים בהתאמה אישית</b> (שם, תאריך, לוגו)
                מיוצרים במיוחד עבורך ואינם ניתנים להחזרה, למעט פגם בייצור.
              </p>
            </Accordion>
            <Accordion title="שאלות נפוצות">
              <dl className="space-y-3">
                {GENERIC_FAQ.map((f) => (
                  <div key={f.q}>
                    <dt className="font-medium text-navy">{f.q}</dt>
                    <dd className="mt-0.5">{f.a}</dd>
                  </div>
                ))}
              </dl>
            </Accordion>
            <Accordion title="ביקורות לקוחות">
              <p className="text-navy/60">
                עדיין אין ביקורות למוצר זה. רכשתם? נשמח שתהיו הראשונים לשתף בוואטסאפ.
              </p>
            </Accordion>
          </div>

          {/* תגיות */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {product.tags.map((t) => (
              <Link key={t} href={`/search?q=${encodeURIComponent(t)}`}
                className="rounded-full bg-navy/5 px-2.5 py-1 text-[11px] text-navy/60 hover:bg-gold/15 hover:text-navy">
                {t}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ===== קסטומייזר ===== */}
      {product.customization && (
        <div className="mt-12">
          <ProductCustomizer product={product} variantSelections={variantSelections} />
        </div>
      )}

      {/* ===== מוצרים משלימים ===== */}
      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-center font-display text-2xl font-bold text-navy">משלימים את המתנה</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
            {related.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ===== נצפו לאחרונה ===== */}
      {mounted && recentlyViewed.length > 0 && (
        <section className="mt-16">
          <h2 className="mb-6 text-center font-display text-2xl font-bold text-navy">צפית לאחרונה</h2>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            {recentlyViewed.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}

      {/* ===== מדריך מידות ===== */}
      {showSizeGuide && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center" onClick={() => setShowSizeGuide(false)}>
          <div onClick={(e) => e.stopPropagation()}
            className="w-full max-w-md rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl" dir="rtl">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-navy">איך בוחרים מידה?</h3>
              <button onClick={() => setShowSizeGuide(false)} aria-label="סגירה"
                className="rounded-lg p-1 text-navy/40 hover:bg-navy/5">✕</button>
            </div>
            <div className="space-y-3 text-sm leading-relaxed text-navy/75">
              <p>מידות הכיפות עשויות להשתנות מעט בין דגמים. הדרך הנוחה ביותר היא לקחת כיפה שכבר מתאימה לכם, למדוד אותה מצד לצד בנקודה הרחבה ביותר ולהשוות למידות המופיעות בדגם.</p>
              <p>כאשר קיים קוטר מדויק מטעם היצרן, הוא יוצג לצד המידה.</p>
              <p className="text-navy/60">מתלבטים בין שתי מידות? <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="text-gold-soft underline">צרו איתנו קשר</a> ונשמח לעזור.</p>
            </div>
          </div>
        </div>
      )}

      {/* ===== Sticky add-to-cart במובייל ===== */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-gold/20 bg-white/95 p-3 backdrop-blur-md lg:hidden">
        <div className="flex items-center gap-3">
          <div className="leading-tight">
            <span className="block text-[11px] text-navy/50">{product.titleHe.slice(0, 28)}…</span>
            <span className="font-bold text-navy">
              {product.priceType === 'quote' ? 'הצעת מחיר' : `${hasSizes && !selectedVariant ? 'החל מ־' : ''}${formatPrice(unitPrice)}`}
            </span>
            {hasSizes && !selectedVariant && <span className="block text-[10px] font-medium text-gold-soft">בחרו מידה</span>}
          </div>
          {product.priceType === 'quote' ? (
            <Link href={`/quote?product=${encodeURIComponent(product.titleHe)}&sku=${product.sku}`}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft py-2.5 text-sm font-bold text-navy shadow-gold">
              <FileText className="h-4 w-4" /> בקשת הצעת מחיר
            </Link>
          ) : (
            <button onClick={handleQuickAdd}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft py-2.5 text-sm font-bold text-navy shadow-gold">
              <ShoppingBag className="h-4 w-4" /> הוספה לסל
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
