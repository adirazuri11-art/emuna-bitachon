'use client';

import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash2, Truck, X, Gift } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useCartStore, selectCartTotal } from '@/store/cart';
import { useUIStore } from '@/store/ui';
import { useToastStore } from '@/store/toast';
import { formatPrice } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/payments';
import { resolveCoupon, couponDiscount as calcDiscount } from '@/lib/coupons';
import { validateClubCoupon } from '@/lib/club-client';
import { trackEvent } from '@/lib/analytics';

export function CartSlideOver() {
  const { isCartOpen, closeCart } = useUIStore();
  const { items, removeItem, setQuantity, coupon, setCoupon } = useCartStore();
  const total = useCartStore(selectCartTotal);
  const showToast = useToastStore((s) => s.show);
  const [couponInput, setCouponInput] = useState('');
  const [applying, setApplying] = useState(false);
  const [showMemberPrompt, setShowMemberPrompt] = useState(false);

  // בדוק אם הלקוח הוא חבר מועדון כשהסל נפתח
  useEffect(() => {
    if (isCartOpen && items.length > 0) {
      const memberCode = typeof window !== 'undefined' ? localStorage.getItem('emuna-club-code') : null;
      setShowMemberPrompt(!memberCode); // הצע הצטרפות אם אין קוד
    }
  }, [isCartOpen, items.length]);

  const couponDiscount = coupon ? calcDiscount(coupon, total) : 0;

  const applyCoupon = async () => {
    const code = couponInput.trim();
    if (!code || applying) return;
    setApplying(true);
    // 1) אימות מול השרת — קודי מועדון (ייחודי + חד-פעמי, נאכף בשרת)
    const v = await validateClubCoupon(code, total);
    if (v.ok) {
      // קוד מועדון (redeem=true, אחוז) או קופון מותאם מ-CRM (type/value, redeem=false)
      setCoupon({ code, type: v.type ?? 'pct', value: v.value ?? v.pct ?? 0, label: v.label, server: v.redeem ?? true });
      trackEvent('coupon_applied', { query: code });
      showToast(`הקופון הופעל — ${v.label} 🎉`);
      setCouponInput(''); setApplying(false);
      return;
    }
    // 2) לא קוד-מועדון (סטטי/קאשבק) — בדיקה מקומית
    if (v.error === 'קוד קופון לא תקין') {
      const r = resolveCoupon(code, total);
      if (r.ok) {
        setCoupon({ code, type: r.coupon.type, value: r.coupon.value, label: r.label, server: false });
        trackEvent('coupon_applied', { query: code });
        showToast(`הקופון הופעל — ${r.label} 🎉`);
        setCouponInput('');
      } else {
        showToast(r.error, 'error');
      }
      setApplying(false);
      return;
    }
    // 3) קוד מועדון אך לא תקף (נוצל / פג / שגיאת רשת)
    showToast(v.error, 'error');
    setApplying(false);
  };

  return (
    <>
      {showMemberPrompt && isCartOpen && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed bottom-4 left-4 right-4 z-[60] hidden max-w-sm rounded-xl border border-gold/40 bg-gradient-to-br from-gold/10 to-transparent p-4 shadow-lg backdrop-blur-sm md:left-auto md:right-20 md:block"
        >
          <div className="flex gap-3">
            <Gift className="h-5 w-5 flex-shrink-0 text-gold" />
            <div className="flex-1">
              <p className="font-bold text-navy">✨ קבל 10% הנחה!</p>
              <p className="mt-1 text-sm text-navy/70">הצטרף למועדון בחינם והנחה מיידית על הזמנה זו</p>
              <button
                onClick={() => {
                  setShowMemberPrompt(false);
                  showToast('עבור להצטרפות למועדון', 'info');
                }}
                className="mt-2 text-sm font-bold text-gold hover:underline"
              >
                הצטרף עכשיו →
              </button>
            </div>
            <button
              onClick={() => setShowMemberPrompt(false)}
              className="text-navy/30 hover:text-navy"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </motion.div>
      )}

      <AnimatePresence>
        {isCartOpen && (
          <>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 z-50 bg-navy-deep/60 backdrop-blur-sm"
          />
          <motion.aside
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-y-0 left-0 z-50 flex w-full max-w-md flex-col bg-cream shadow-2xl"
          >
            <header className="flex items-center justify-between border-b border-gold/20 bg-navy p-4 text-cream">
              <h2 className="flex items-center gap-2 font-display text-lg font-bold">
                <ShoppingBag className="h-5 w-5 text-gold" /> סל הקניות
              </h2>
              <button onClick={closeCart} className="rounded-full p-1.5 hover:bg-white/10" aria-label="סגירה">
                <X className="h-5 w-5" />
              </button>
            </header>

            {/* מד משלוח חינם — מנוע הגדלת סל קלאסי */}
            {items.length > 0 && (
              <div className="border-b border-gold/15 bg-white px-4 py-3">
                {total >= FREE_SHIPPING_THRESHOLD ? (
                  <p className="flex items-center gap-2 text-sm font-bold text-emerald-600">
                    <Truck className="h-4 w-4" /> מעולה! זכית במשלוח חינם 🎉
                  </p>
                ) : (
                  <p className="flex items-center gap-2 text-sm text-navy">
                    <Truck className="h-4 w-4 text-gold-soft" />
                    עוד <b className="text-gold-soft">{formatPrice(FREE_SHIPPING_THRESHOLD - total)}</b>
                    למשלוח חינם
                  </p>
                )}
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-navy/10">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-l from-gold to-gold-soft"
                    initial={false}
                    animate={{ width: `${Math.min(100, (total / FREE_SHIPPING_THRESHOLD) * 100)}%` }}
                    transition={{ type: 'spring', damping: 25 }}
                  />
                </div>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-4">
              {items.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center gap-3 text-navy/40">
                  <ShoppingBag className="h-12 w-12" strokeWidth={1} />
                  <p>הסל שלך עדיין ריק</p>
                </div>
              ) : (
                <ul className="space-y-3">
                  {items.map((item) => (
                    <li
                      key={item.id}
                      className="flex items-center gap-3 rounded-xl border border-navy/5 bg-white p-3 shadow-card"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-navy">{item.title}</p>
                        {item.customization && (
                          <p className="mt-0.5 line-clamp-2 text-[11px] leading-snug text-navy/50">
                            {Object.entries(item.customization)
                              .map(([k, v]) => `${k}: ${v}`)
                              .join(' · ')}
                          </p>
                        )}
                        <p className="mt-0.5 text-sm font-bold text-gold-soft">
                          {formatPrice(item.price)}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setQuantity(item.id, item.quantity - 1)}
                          className="rounded-full border border-navy/10 p-1 hover:border-gold"
                          aria-label="הפחתה"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                        <button
                          onClick={() => setQuantity(item.id, item.quantity + 1)}
                          className="rounded-full border border-navy/10 p-1 hover:border-gold"
                          aria-label="הוספה"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-navy/30 hover:text-red-500"
                        aria-label="הסרה"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {items.length > 0 && (
              <footer className="border-t border-gold/20 bg-white p-4">
                {/* קופון */}
                {coupon ? (
                  <div className="mb-3 flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-sm">
                    <span className="font-medium text-emerald-700">🎟️ {coupon.label}</span>
                    <button onClick={() => setCoupon(null)} className="text-xs text-navy/40 hover:text-red-500">הסרה</button>
                  </div>
                ) : (
                  <div className="mb-3 flex gap-2">
                    <input value={couponInput} onChange={(e) => setCouponInput(e.target.value)}
                      placeholder="קוד קופון" aria-label="קוד קופון"
                      className="min-w-0 flex-1 rounded-full border border-navy/15 px-4 py-2 text-sm outline-none focus:border-gold" />
                    <button onClick={applyCoupon} disabled={!couponInput.trim() || applying}
                      className="rounded-full border border-gold/50 px-4 py-2 text-sm font-medium text-navy hover:bg-gold/10 disabled:opacity-40">
                      {applying ? '…בודק' : 'הפעלה'}
                    </button>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="mb-1 flex justify-between text-sm text-emerald-700">
                    <span>הנחת קופון</span>
                    <span>‎-{formatPrice(couponDiscount)}</span>
                  </div>
                )}
                <div className="mb-3 flex justify-between font-bold text-navy">
                  <span>סה"כ</span>
                  <span>{formatPrice(total - couponDiscount)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={closeCart}
                  className="block w-full rounded-full bg-gradient-to-l from-gold to-gold-soft py-3 text-center font-bold text-navy shadow-gold transition-transform hover:scale-[1.02]"
                >
                  מעבר לתשלום מאובטח
                </Link>
              </footer>
            )}
          </motion.aside>
        </>
      )}
      </AnimatePresence>
    </>
  );
}
