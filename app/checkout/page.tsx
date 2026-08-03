'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, MessageCircle, ShieldCheck, Truck } from 'lucide-react';
import { Confetti } from '@/components/ui/Confetti';
import { useCartStore, selectCartTotal, type CartItem } from '@/store/cart';
import { calcShipping, FREE_SHIPPING_THRESHOLD } from '@/lib/payments';
import { couponDiscount as calcDiscount, generateCashbackCoupon, savePersonalCoupon, type PersonalCoupon } from '@/lib/coupons';
import { redeemClubCoupon } from '@/lib/club-client';
import { useToastStore } from '@/store/toast';
import { trackEvent } from '@/lib/analytics';
import { formatPrice } from '@/lib/utils';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '972503096969';

interface OrderSnapshot {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  total: number;
  cashback: PersonalCoupon;
}

const FIELDS = [
  { key: 'name', label: 'שם מלא', type: 'text', autoComplete: 'name' },
  { key: 'phone', label: 'טלפון נייד', type: 'tel', autoComplete: 'tel' },
  { key: 'email', label: 'אימייל', type: 'email', autoComplete: 'email' },
  { key: 'street', label: 'רחוב ומספר בית', type: 'text', autoComplete: 'street-address' },
  { key: 'city', label: 'עיר', type: 'text', autoComplete: 'address-level2' },
  { key: 'zip', label: 'מיקוד', type: 'text', autoComplete: 'postal-code' },
] as const;

export default function CheckoutPage() {
  const [mounted, setMounted] = useState(false);
  const [order, setOrder] = useState<OrderSnapshot | null>(null);
  const items = useCartStore((s) => s.items);
  const coupon = useCartStore((s) => s.coupon);
  const setCoupon = useCartStore((s) => s.setCoupon);
  const clearCart = useCartStore((s) => s.clear);
  const showToast = useToastStore((s) => s.show);
  const subtotal = useCartStore(selectCartTotal);
  const shipping = calcShipping(subtotal);

  // בדיקה: אם לא יש קופון אבל יש קוד מועדון בlocalStorage — החל 10% אוטומטי
  const memberCode = typeof window !== 'undefined' ? localStorage.getItem('emuna-club-code') : null;
  const memberCoupon = memberCode ? { code: memberCode, type: 'pct' as const, value: 10, label: '10% הנחת מועדון', server: true } : null;
  const effectiveCoupon = (coupon || memberCoupon) as typeof coupon | null;

  const couponDiscount = effectiveCoupon ? calcDiscount(effectiveCoupon, subtotal) : 0;
  const couponLabel = effectiveCoupon?.label ?? null;
  const total = subtotal + shipping - couponDiscount;

  useEffect(() => setMounted(true), []);

  // begin_checkout נורה פעם אחת כשנכנסים לעמוד עם פריטים בסל
  useEffect(() => {
    if (mounted && items.length > 0) {
      trackEvent('begin_checkout', {
        value: subtotal,
        items: items.map((i) => ({ id: i.id, name: i.title, price: i.price, quantity: i.quantity })),
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mounted]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    trackEvent('add_payment_info', { value: total });
    // TODO: Server Action → יצירת Order ב-Prisma → getPaymentProvider().createPaymentPage()
    // → redirect לעמוד הסליקה (Cardcom / PayPlus). ראו lib/payments.ts
    // ⚠️ חשוב: בשרת, בדוק אם הלקוח הוא חבר מועדון לפני החלת 10% הנחה זמנית.
    // רק קופון שרת-side (חברות מועדון) יופעל בקופה.
    // מימוש הקופון האישי (חד-פעמי, נאכף בשרת) לפני סגירת ההזמנה
    if (coupon?.server) {
      const r = await redeemClubCoupon(coupon.code);
      if (!r.ok) {
        setCoupon(null);
        showToast('הקופון כבר נוצל או פג — הוסר מההזמנה. בדקו את הסכום ונסו שוב', 'error');
        return;
      }
    }
    // קופון קאשבק 3% להזמנה הבאה (מקומי)
    const cashback = generateCashbackCoupon(total);
    savePersonalCoupon(cashback);

    const snapshot: OrderSnapshot = {
      orderNumber: `EB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      items: [...items],
      subtotal,
      shipping,
      couponDiscount,
      total,
      cashback,
    };
    // ⚠️ אין לירות purchase ללא תשלום אמיתי. אירוע ה-purchase (עם value/currency/
    // transaction_id) ייורה בצד השרת רק לאחר אישור התשלום מספק הסליקה (מחר).
    setOrder(snapshot);
    clearCart();
    window.scrollTo({ top: 0 });
  };

  if (!mounted) return null;

  // ===== מסך הצלחה =====
  if (order) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <Confetti />
        <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" strokeWidth={1.4} />
        <h1 className="mt-4 font-display text-3xl font-bold text-navy">הבקשה התקבלה!</h1>
        <p className="mt-2 text-navy/60">
          מספר הזמנה: <b dir="ltr" className="text-navy">{order.orderNumber}</b>
        </p>
        <p className="mx-auto mt-3 max-w-md rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-navy/70">
          נחזור אליך לאישור טלפוני של הפרטים וההתאמות לפני הייצור. <b>לא בוצע חיוב</b> — התשלום ייסגר יחד עם האישור.
        </p>

        <div className="mt-8 rounded-2xl border border-navy/10 bg-white p-5 text-start shadow-card">
          <h2 className="mb-3 font-display text-lg font-bold text-navy">סיכום ההזמנה</h2>
          <ul className="space-y-2 border-b border-navy/10 pb-3 text-sm">
            {order.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3">
                <span className="text-navy/75">{i.title} <span className="text-navy/40">×{i.quantity}</span></span>
                <span className="shrink-0 font-medium">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-3 space-y-1.5 text-sm">
            <div className="flex justify-between text-navy/60"><dt>משלוח</dt><dd>{order.shipping === 0 ? 'חינם' : formatPrice(order.shipping)}</dd></div>
            {order.couponDiscount > 0 && (
              <div className="flex justify-between text-emerald-700"><dt>הנחת קופון</dt><dd>‎-{formatPrice(order.couponDiscount)}</dd></div>
            )}
            <div className="flex justify-between border-t border-navy/10 pt-2 font-bold text-navy"><dt>סה"כ</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>
        </div>

        {/* קאשבק 3% להזמנה הבאה */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-gold/30 bg-gradient-to-br from-navy to-navy-light p-5 text-center">
          <p className="text-sm text-cream/70">צברת קאשבק 3% להזמנה הבאה שלך:</p>
          <p className="mt-2 font-display text-3xl font-bold text-gold">{formatPrice(order.cashback.value)}</p>
          <div className="mx-auto mt-2 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-white/5 px-4 py-1.5">
            <span className="text-xs text-cream/60">קוד הקופון:</span>
            <b className="font-mono text-sm text-cream" dir="ltr">{order.cashback.code}</b>
          </div>
          <p className="mt-2 text-[11px] text-cream/40">שמור את הקוד — תקף 90 יום להזמנתך הבאה (נשמר אוטומטית בדפדפן זה).</p>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(`שלום! שלחתי הזמנה באתר — מספר ${order.orderNumber}`)}`}
            target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-2.5 font-bold text-white">
            <MessageCircle className="h-4 w-4" /> לזרז בוואטסאפ
          </a>
          <Link href="/" className="rounded-full border border-gold/40 px-6 py-2.5 font-bold text-navy hover:bg-gold/10">
            חזרה לחנות
          </Link>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-3xl font-bold text-navy">הסל שלך ריק</h1>
        <Link
          href="/"
          className="mt-6 inline-block rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-3 font-bold text-navy shadow-gold"
        >
          חזרה לחנות
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="mb-2 font-display text-3xl font-bold text-navy">השלמת הזמנה</h1>
      <p className="mb-3 flex items-center gap-2 text-sm text-navy/60">
        <Lock className="h-4 w-4 text-gold-soft" /> תשלום מאובטח ומוצפן · פרטיך לא נשמרים באתר
      </p>
      {/* שקיפות בשלב ההרצה — אין חיוב עד אישור אנושי */}
      <p className="mb-8 rounded-xl border border-gold/25 bg-gold/10 px-4 py-2.5 text-xs text-navy/70">
        האתר בשלב השקה: ההזמנה נקלטת כבקשה, ניצור איתך קשר לאישור סופי — <b>לא מתבצע חיוב אוטומטי</b>.
      </p>

      <div className="grid gap-10 lg:grid-cols-5">
        {/* טופס פרטים */}
        <form onSubmit={handleSubmit} className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-sm font-medium text-navy">{f.label}</span>
                <input
                  required
                  type={f.type}
                  autoComplete={f.autoComplete}
                  className="gold-ring w-full rounded-xl bg-white px-4 py-2.5 text-sm outline-none"
                />
              </label>
            ))}
          </div>

          <button
            type="submit"
            className="mt-6 w-full rounded-full bg-gradient-to-l from-gold to-gold-soft py-3.5 font-bold text-navy shadow-gold transition-transform hover:scale-[1.01]"
          >
            שליחת ההזמנה לאישור · {formatPrice(total)}
          </button>

          <div className="mt-4 flex items-center justify-center gap-6 text-xs text-navy/50">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-gold-soft" /> סליקה מאובטחת PCI-DSS
            </span>
            <span className="flex items-center gap-1.5">
              <Truck className="h-4 w-4 text-gold-soft" /> משלוח 1-3 ימי עסקים
            </span>
          </div>
        </form>

        {/* סיכום הזמנה */}
        <aside className="h-fit rounded-2xl border border-gold/20 bg-white p-6 shadow-card lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-navy">סיכום הזמנה</h2>
          <ul className="space-y-3 border-b border-navy/10 pb-4">
            {items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="text-navy/80">
                  {i.title} <span className="text-navy/40">×{i.quantity}</span>
                </span>
                <span className="shrink-0 font-medium">{formatPrice(i.price * i.quantity)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-2 text-sm">
            <div className="flex justify-between">
              <dt className="text-navy/60">ביניים</dt>
              <dd>{formatPrice(subtotal)}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-navy/60">משלוח</dt>
              <dd className={shipping === 0 ? 'font-bold text-emerald-600' : ''}>
                {shipping === 0 ? 'חינם!' : formatPrice(shipping)}
              </dd>
            </div>
            {shipping > 0 && (
              <p className="text-xs text-gold-soft">
                עוד {formatPrice(FREE_SHIPPING_THRESHOLD - subtotal)} למשלוח חינם
              </p>
            )}
            {couponDiscount > 0 && couponLabel && (
              <div className="flex justify-between text-emerald-700">
                <dt>🎟️ {couponLabel}</dt>
                <dd>‎-{formatPrice(couponDiscount)}</dd>
              </div>
            )}
            <div className="flex justify-between border-t border-navy/10 pt-3 text-base font-bold text-navy">
              <dt>סה"כ לתשלום</dt>
              <dd>{formatPrice(total)}</dd>
            </div>
          </dl>
          <p className="mt-3 text-[11px] leading-relaxed text-navy/40">
            בהשלמת ההזמנה אתם מאשרים את{' '}
            <Link href="/returns" className="underline hover:text-gold-soft">
              מדיניות המשלוחים, ההחזרות והביטולים
            </Link>
            .
          </p>
        </aside>
      </div>
    </div>
  );
}
