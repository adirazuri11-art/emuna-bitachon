'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ShieldCheck, ShoppingBag, X } from 'lucide-react';
import type { CatalogProduct } from '@/lib/catalog';
import { STOCK_LABELS } from '@/lib/catalog';
import { formatPrice } from '@/lib/utils';
import { useCartStore } from '@/store/cart';
import { useToastStore } from '@/store/toast';
import { trackEvent } from '@/lib/analytics';

export function QuickViewModal({
  product,
  onClose,
}: {
  product: CatalogProduct | null;
  onClose: () => void;
}) {
  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);

  // סגירה ב-Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const price = product ? product.discountPrice ?? product.basePrice : 0;

  return (
    <AnimatePresence>
      {product && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose} className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-sm" />
          <motion.div
            role="dialog" aria-modal="true" aria-label={`תצוגה מהירה: ${product.titleHe}`}
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="fixed inset-x-4 top-1/2 z-50 mx-auto max-w-2xl -translate-y-1/2 overflow-hidden rounded-2xl bg-white shadow-2xl"
          >
            <button onClick={onClose} aria-label="סגירה"
              className="absolute end-3 top-3 z-10 rounded-full bg-white/90 p-1.5 text-navy/60 shadow-card hover:text-navy">
              <X className="h-4 w-4" />
            </button>

            <div className="grid sm:grid-cols-2">
              <div className="relative aspect-square bg-gradient-to-b from-white to-cream sm:aspect-auto">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={product.imageUrl!} alt={product.titleHe} className="h-full w-full object-contain p-4" />
                {product.isPlaceholderImage && (
                  <span className="absolute bottom-2 start-2 rounded-full bg-navy/80 px-2 py-0.5 text-[10px] text-cream/70">
                    תמונת המחשה
                  </span>
                )}
              </div>

              <div className="flex flex-col p-5">
                <span className="text-xs font-medium text-gold-soft">{product.category}</span>
                <h2 className="mt-1 font-display text-xl font-bold leading-snug text-navy">{product.titleHe}</h2>
                {product.certification && (
                  <span className="mt-2 flex w-fit items-center gap-1 rounded-full bg-navy px-2.5 py-1 text-[11px] text-gold">
                    <ShieldCheck className="h-3 w-3" /> {product.certification}
                  </span>
                )}
                <p className="mt-3 text-sm leading-relaxed text-navy/70">{product.shortDescription}</p>
                <p className="mt-2 text-xs text-emerald-700">{STOCK_LABELS[product.stockStatus]}</p>

                <div className="mt-auto pt-4">
                  <div className="mb-3 flex items-end gap-2">
                    {product.discountPrice && (
                      <span className="text-sm text-navy/40 line-through">{formatPrice(product.basePrice)}</span>
                    )}
                    <span className="font-display text-2xl font-bold text-navy">{formatPrice(price)}</span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        addItem({ id: product.id, title: product.titleHe, price });
                        trackEvent('add_to_cart', { value: price, items: [{ id: product.id, name: product.titleHe, price }] });
                        showToast('נוסף לסל ✓');
                        onClose();
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-full bg-navy py-2.5 text-sm font-bold text-cream hover:bg-gold hover:text-navy">
                      <ShoppingBag className="h-4 w-4" /> הוספה לסל
                    </button>
                    <Link href={`/product/${product.slug}`} onClick={onClose}
                      className="flex items-center gap-1.5 rounded-full border border-gold/40 px-4 py-2.5 text-sm font-medium text-navy hover:bg-gold/10">
                      לעמוד המלא <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </div>
                  {product.isCustomizable && (
                    <p className="mt-2 text-center text-[11px] text-gold-soft">
                      ✨ התאמה אישית מלאה זמינה בעמוד המוצר
                    </p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
