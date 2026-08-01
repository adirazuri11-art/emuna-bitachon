'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Check, Eye, Flame, Gem, Gift, Heart, PenLine, Scroll, ShieldCheck, ShoppingBag, Shirt, Sparkle, Wine,
} from 'lucide-react';
import type { ProductCardData, ProductIconKey } from '@/types';
import { BADGE_LABELS, type CatalogProduct } from '@/lib/catalog';
import { useCartStore } from '@/store/cart';
import { useWishlistStore } from '@/store/wishlist';
import { useToastStore } from '@/store/toast';
import { formatPrice, cn } from '@/lib/utils';
import { trackEvent } from '@/lib/analytics';

// אייקונים כ-fallback כשאין תמונה
const ICON_MAP: Record<ProductIconKey, typeof Wine> = {
  kiddush: Wine,
  candles: Flame,
  tallit: Shirt,
  mezuzah: Scroll,
  kippah: Sparkle,
  textile: Gem,
  gift: Gift,
};

type CardProduct = ProductCardData &
  Partial<Pick<CatalogProduct, 'badges' | 'prepTimeDays' | 'priceType' | 'variantGroups'>>;

interface Props {
  product: CardProduct;
  onQuickView?: (product: ProductCardData) => void;
}

export function ProductCard({ product, onQuickView }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleWishlist = useWishlistStore((s) => s.toggle);
  const inWishlist = useWishlistStore((s) => s.slugs.includes(product.slug));
  const showToast = useToastStore((s) => s.show);
  const [added, setAdded] = useState(false);
  const [mounted, setMounted] = useState(false);

  // מונע hydration mismatch של לב המועדפים (persist מ-localStorage)
  useEffect(() => setMounted(true), []);

  const price = product.discountPrice ?? product.basePrice;
  const discountPct = product.discountPrice
    ? Math.round((1 - product.discountPrice / product.basePrice) * 100)
    : null;
  const Icon = ICON_MAP[product.iconKey];
  const href = `/product/${product.slug}`;
  // תמונה מרוחקת (hotlink מהספק) → לוגו כשכבה, כדי שיתאים לצילומים עם לוגו צרוב
  const isRemote = product.imageUrl?.startsWith('http') ?? false;

  const handleAdd = () => {
    addItem({ id: product.id, title: product.titleHe, price, minQty: product.minOrderUnits });
    trackEvent('add_to_cart', { value: price, items: [{ id: product.id, name: product.titleHe, price }] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  const handleWishlist = () => {
    const nowIn = toggleWishlist(product.slug);
    showToast(nowIn ? 'נשמר במועדפים ♥' : 'הוסר מהמועדפים', 'info');
  };

  return (
    <motion.article
      whileHover={{ y: -6 }}
      transition={{ type: 'spring', stiffness: 300, damping: 22 }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-navy/5 bg-white shadow-card transition-shadow hover:shadow-gold"
    >
      {/* אזור תמונה — צילום מוצר מלא על רקע בהיר (סימן המים צרוב בקובץ) */}
      <div className="relative aspect-[4/5] overflow-hidden bg-gradient-to-b from-white to-cream">
        <Link href={href} aria-label={product.titleHe}>
          {product.imageUrl ? (
            <Image
              src={product.imageUrl}
              alt={product.titleHe}
              fill
              className="object-contain p-3 transition-transform duration-500 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              loading="lazy"
            />
          ) : (
            <span className="flex h-full items-center justify-center">
              <Icon className="h-16 w-16 text-gold/60" strokeWidth={1.2} />
            </span>
          )}
        </Link>

        {/* לוגו-שכבה על תמונות מרוחקות — תואם לצילומים עם הלוגו הצרוב */}
        {isRemote && (
          <span className="pointer-events-none absolute bottom-2 start-2 z-[1] flex items-center rounded-md bg-white/85 px-1.5 py-0.5 shadow-sm backdrop-blur-sm">
            <Image src="/brand/emuna-vebitachon-logo.png" alt="אמונה וביטחון" width={16} height={16} className="opacity-90" />
          </span>
        )}

        {/* Badges */}
        <div className="pointer-events-none absolute start-3 top-3 flex flex-col items-start gap-1.5">
          {product.certification && (
            <span className="flex items-center gap-1 rounded-full border border-gold/40 bg-navy/85 px-2.5 py-1 text-[11px] font-medium text-gold backdrop-blur-sm">
              <ShieldCheck className="h-3 w-3" /> {product.certification}
            </span>
          )}
          {product.isCustomizable && (
            <span className="flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-medium text-navy backdrop-blur-sm">
              <PenLine className="h-3 w-3 text-gold-soft" /> התאמה אישית
            </span>
          )}
        </div>
        <div className="pointer-events-none absolute end-3 top-3 flex flex-col items-end gap-1.5">
          {product.isNew && (
            <span className="rounded-full bg-gold px-2.5 py-1 text-[11px] font-bold text-navy">חדש</span>
          )}
          {(product.badges ?? [])
            .filter((b) => b !== 'new')
            .slice(0, 1)
            .map((b) => (
              <span key={b} className="rounded-full bg-navy/85 px-2.5 py-1 text-[11px] font-medium text-gold backdrop-blur-sm">
                {BADGE_LABELS[b]}
              </span>
            ))}
          {discountPct && (
            <span className="rounded-full bg-red-600/90 px-2.5 py-1 text-[11px] font-bold text-white">
              {discountPct}%-
            </span>
          )}
        </div>

        {/* פעולות מרחפות */}
        <div className="absolute bottom-3 end-3 flex flex-col gap-1.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button onClick={handleWishlist} aria-label="הוספה למועדפים" aria-pressed={mounted && inWishlist}
            className={cn('rounded-full p-2 shadow-card backdrop-blur-sm transition-colors',
              mounted && inWishlist ? 'bg-red-50 text-red-500' : 'bg-white/90 text-navy/60 hover:text-red-500')}>
            <Heart className={cn('h-4 w-4', mounted && inWishlist && 'fill-red-500')} />
          </button>
          {onQuickView && (
            <button onClick={() => onQuickView(product)} aria-label="תצוגה מהירה"
              className="rounded-full bg-white/90 p-2 text-navy/60 shadow-card backdrop-blur-sm hover:text-gold-soft">
              <Eye className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* פרטי מוצר */}
      <div className="flex flex-1 flex-col p-4">
        <span className="text-xs font-medium text-gold-soft">{product.category}</span>
        <Link href={href}>
          <h3 className="mt-1 line-clamp-2 font-medium leading-snug text-navy hover:text-gold-soft">
            {product.titleHe}
          </h3>
        </Link>
        {product.material && <p className="mt-1 text-xs text-navy/50">{product.material}</p>}
        {/* נקודות צבע מווריאציות */}
        {(() => {
          const colorOpts = product.variantGroups?.flatMap((g) => g.options).filter((o) => o.hex) ?? [];
          return colorOpts.length > 1 ? (
            <div className="mt-1.5 flex gap-1">
              {colorOpts.slice(0, 4).map((o) => (
                <span key={o.id} title={o.label} className="h-3.5 w-3.5 rounded-full border border-navy/15" style={{ backgroundColor: o.hex }} />
              ))}
              {colorOpts.length > 4 && <span className="text-[10px] text-navy/40">+{colorOpts.length - 4}</span>}
            </div>
          ) : null;
        })()}
        {product.prepTimeDays && (
          <p className="mt-1 text-[11px] text-navy/40">
            אספקה: עד {product.prepTimeDays[1]} ימי עסקים
          </p>
        )}
        {product.stockLeft !== undefined && product.stockLeft <= 3 && (
          <p className="mt-2 text-xs font-bold text-red-600">
            {product.stockLeft === 1 ? '🔥 אחרון במלאי!' : `🔥 נשארו רק ${product.stockLeft} במלאי`}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-2 pt-4">
          <div className="leading-none">
            {product.priceType === 'quote' ? (
              <span className="block text-sm font-bold text-gold-soft">לפי הצעת מחיר</span>
            ) : (
              <>
                {product.discountPrice && (
                  <span className="block text-xs text-navy/40 line-through">{formatPrice(product.basePrice)}</span>
                )}
                <span className="mt-0.5 block text-lg font-bold text-navy">
                  {product.priceType === 'from' && <span className="text-xs font-medium text-navy/50">החל מ־</span>}
                  {formatPrice(price)}
                  {product.minOrderUnits && <span className="text-[11px] font-medium text-navy/50"> ליחידה</span>}
                </span>

                {/* הנחה של 15% לחברי מועדון חדשים */}
                <div className="mt-2 space-y-1 rounded-lg bg-emerald-50 p-2">
                  <p className="text-[11px] font-bold text-emerald-700">✨ לחברי מועדון</p>
                  <p className="text-sm font-bold text-emerald-600">
                    {formatPrice(Math.round(price * 0.85))}
                  </p>
                  <p className="text-[10px] text-emerald-600">15% הנחה למשך 7 ימים</p>
                </div>

                {product.minOrderUnits && (
                  <span className="mt-0.5 block text-[11px] font-medium text-gold-soft">
                    מארז {product.minOrderUnits} יח' · {formatPrice(price * product.minOrderUnits)}
                  </span>
                )}
              </>
            )}
          </div>

          {product.priceType === 'quote' ? (
            <Link href={`/quote?product=${product.slug}`}
              className="rounded-full border border-gold/50 px-4 py-2 text-sm font-bold text-navy transition-colors hover:bg-gold/10">
              הצעת מחיר
            </Link>
          ) : (
          <motion.button onClick={handleAdd} whileTap={{ scale: 0.94 }}
            className={cn('flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-colors',
              added ? 'bg-emerald-600 text-white' : 'bg-navy text-cream hover:bg-gold hover:text-navy')}>
            <AnimatePresence mode="wait" initial={false}>
              {added ? (
                <motion.span key="added" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4" /> נוסף לסל
                </motion.span>
              ) : (
                <motion.span key="add" initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }} className="flex items-center gap-1.5">
                  <ShoppingBag className="h-4 w-4" /> הוספה לסל
                </motion.span>
              )}
            </AnimatePresence>
          </motion.button>
          )}
        </div>
      </div>
    </motion.article>
  );
}
