'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, Lock, MessageCircle, ShieldCheck, Truck, Loader2 } from 'lucide-react';
import { Confetti } from '@/components/ui/Confetti';
import { useCartStore, selectCartTotal, type CartItem } from '@/store/cart';
import { calcShipping, FREE_SHIPPING_THRESHOLD } from '@/lib/payments';
import { couponDiscount as calcDiscount, generateCashbackCoupon, savePersonalCoupon, type PersonalCoupon } from '@/lib/coupons';
import { redeemClubCoupon } from '@/lib/club-client';
import { useToastStore } from '@/store/toast';
import { trackEvent } from '@/lib/analytics';
import { formatPrice } from '@/lib/utils';
import { GiftWrapOption } from '@/components/checkout/GiftWrapOption';
import { countWords, giftWrapCharge, validateGiftMessage, GIFT_WRAP_MAX_WORDS, GIFT_WRAP_PRICE } from '@/lib/gift-wrap';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '972503096969';

interface OrderSnapshot {
  orderNumber: string;
  items: CartItem[];
  subtotal: number;
  shipping: number;
  couponDiscount: number;
  giftWrap: number; // 0 או 10
  giftMessage: string; // הברכה (Plain Text בטוח), ריק אם לא נבחרה
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
  const giftWrap = useCartStore((s) => s.giftWrap);
  const setGiftWrap = useCartStore((s) => s.setGiftWrap);
  const clearCart = useCartStore((s) => s.clear);
  const showToast = useToastStore((s) => s.show);
  const subtotal = useCartStore(selectCartTotal);
  const shipping = calcShipping(subtotal);
  const [giftSubmitError, setGiftSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // בדיקה: אם לא יש קופון אבל יש קוד מועדון בlocalStorage — החל 10% אוטומטי
  const memberCode = typeof window !== 'undefined' ? localStorage.getItem('emuna-club-code') : null;
  const memberCoupon = memberCode ? { code: memberCode, type: 'pct' as const, value: 10, label: '10% הנחת מועדון', server: true } : null;
  const effectiveCoupon = (coupon || memberCoupon) as typeof coupon | null;

  const couponDiscount = effectiveCoupon ? calcDiscount(effectiveCoupon, subtotal) : 0;
  const couponLabel = effectiveCoupon?.label ?? null;

  // ---- אריזת מתנה — ספירת מילים ומחיר ממקור אמת יחיד ----
  const hasItems = items.length > 0;
  const giftWordCount = countWords(giftWrap.message);
  const giftCharge = giftWrapCharge(giftWrap.selected, hasItems); // 10 או 0, פעם אחת
  // שגיאה חיה: חריגה מ-100 מילים מוצגת מיד; "שדה ריק" רק לאחר ניסיון שליחה.
  const giftLiveError =
    giftWrap.selected && giftWordCount > GIFT_WRAP_MAX_WORDS
      ? 'הברכה יכולה לכלול עד 100 מילים. אנא קצרו את הטקסט כדי להמשיך.'
      : null;
  const giftError = giftLiveError ?? giftSubmitError;

  const total = subtotal + shipping - couponDiscount + giftCharge;

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
    if (submitting) return; // מניעת לחיצה כפולה
    const formEl = e.currentTarget as HTMLFormElement;

    // ---- אריזת מתנה: Validation לקוח → אכיפה בשרת (מחיר וברכה מהשרת בלבד) ----
    let giftFinalCharge = 0;
    let giftFinalMessage = '';
    if (giftWrap.selected && hasItems) {
      const local = validateGiftMessage(giftWrap.message);
      if (!local.ok) {
        setGiftSubmitError(local.error ?? null);
        trackEvent('gift_message_validation_error', { selected: true, wordCount: local.wordCount });
        showToast(local.error ?? 'יש לתקן את הברכה כדי להמשיך', 'error');
        return;
      }
      try {
        const res = await fetch('/api/gift-wrap/validate', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ selected: true, message: giftWrap.message }),
        });
        const data = await res.json();
        if (!res.ok || !data.ok) {
          setGiftSubmitError(data?.error ?? null);
          trackEvent('gift_message_validation_error', { selected: true, wordCount: data?.wordCount });
          showToast(data?.error ?? 'שגיאה באימות הברכה. נסו שוב', 'error');
          return;
        }
        // המחיר והברכה מגיעים מהשרת (10 ₪, Plain Text בטוח) — לא מה-Client.
        giftFinalCharge = data.price === GIFT_WRAP_PRICE ? GIFT_WRAP_PRICE : GIFT_WRAP_PRICE;
        giftFinalMessage = typeof data.sanitizedMessage === 'string' ? data.sanitizedMessage : local.sanitized;
        setGiftWrap({ message: giftFinalMessage }); // שמירת הגרסה המנוקה
        setGiftSubmitError(null);
      } catch {
        showToast('בעיית תקשורת באימות הברכה. נסו שוב', 'error');
        return;
      }
    }

    trackEvent('add_payment_info', { value: total });

    // ---- מעבר לסליקה מאובטחת (הסכום מחושב ומאומת בשרת) ----
    // כשהסליקה פעילה (CARDCOM_LIVE) — יוצרים הזמנה בשרת ומפנים לעמוד התשלום.
    // כל עוד לא הופעלה — השרת מחזיר liveDisabled ואנו נופלים בחזרה לזרימת "בקשה ללא חיוב".
    setSubmitting(true);
    try {
      const fd = new FormData(formEl);
      const res = await fetch('/api/checkout/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          items: items.map((i) => ({ id: i.id, quantity: i.quantity, price: i.price, title: i.title })),
          giftWrap: { selected: giftWrap.selected, message: giftWrap.message },
          couponCode: effectiveCoupon?.code,
          customer: {
            name: String(fd.get('name') ?? ''),
            phone: String(fd.get('phone') ?? ''),
            email: String(fd.get('email') ?? ''),
            street: String(fd.get('street') ?? ''),
            city: String(fd.get('city') ?? ''),
            zip: String(fd.get('zip') ?? ''),
          },
        }),
      });
      const j = await res.json();
      if (j.ok && j.redirectUrl) {
        window.location.href = j.redirectUrl; // מעבר לעמוד התשלום — הכפתור נשאר נעול
        return;
      }
      if (!j.liveDisabled) {
        setSubmitting(false);
        showToast(j.error ?? 'שגיאה במעבר לתשלום. נסו שוב', 'error');
        return;
      }
      // liveDisabled → ממשיכים לזרימת הבקשה המקומית שלמטה
    } catch {
      setSubmitting(false);
      showToast('בעיית תקשורת במעבר לתשלום. נסו שוב', 'error');
      return;
    }
    setSubmitting(false);

    // ===== זרימת "בקשה ללא חיוב" (פעילה עד הפעלת הסליקה) =====
    // מימוש הקופון האישי (חד-פעמי, נאכף בשרת) לפני סגירת ההזמנה
    if (coupon?.server) {
      const r = await redeemClubCoupon(coupon.code);
      if (!r.ok) {
        setCoupon(null);
        showToast('הקופון כבר נוצל או פג — הוסר מההזמנה. בדקו את הסכום ונסו שוב', 'error');
        return;
      }
    }

    // סכום סופי מחושב מחדש עם תוספת אריזת המתנה שאושרה בשרת (הנחה/משלוח על מוצרים בלבד)
    const finalTotal = subtotal + shipping - couponDiscount + giftFinalCharge;

    if (giftFinalCharge > 0) {
      trackEvent('checkout_with_gift_wrap', { selected: true, price: GIFT_WRAP_PRICE, currency: 'ILS', wordCount: giftWordCount });
    }

    // קופון קאשבק 3% להזמנה הבאה (מקומי)
    const cashback = generateCashbackCoupon(finalTotal);
    savePersonalCoupon(cashback);

    const snapshot: OrderSnapshot = {
      orderNumber: `EB-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`,
      items: [...items],
      subtotal,
      shipping,
      couponDiscount,
      giftWrap: giftFinalCharge,
      giftMessage: giftFinalMessage,
      total: finalTotal,
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
            {order.giftWrap > 0 && (
              <div className="flex justify-between text-navy/70"><dt>🎁 אריזת מתנה + כרטיס ברכה</dt><dd>{formatPrice(order.giftWrap)}</dd></div>
            )}
            <div className="flex justify-between border-t border-navy/10 pt-2 font-bold text-navy"><dt>סה"כ</dt><dd>{formatPrice(order.total)}</dd></div>
          </dl>

          {order.giftWrap > 0 && order.giftMessage && (
            <div className="mt-4 rounded-xl border border-gold/25 bg-gold/5 p-4">
              <p className="mb-1 text-xs font-bold text-navy/70">כיתוב לכרטיס הברכה:</p>
              <p className="whitespace-pre-wrap break-words text-sm text-navy/90">{order.giftMessage}</p>
            </div>
          )}
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
          <a href={`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(
              `שלום! שלחתי הזמנה באתר — מספר ${order.orderNumber}` +
              (order.giftWrap > 0
                ? `\n\n🎁 אריזת מתנה + כרטיס ברכה (${formatPrice(order.giftWrap)})\nברכה לכרטיס:\n${order.giftMessage}`
                : ''),
            )}`}
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
      <div className="mb-8" />

      <div className="grid gap-10 lg:grid-cols-5">
        {/* טופס פרטים */}
        <form onSubmit={handleSubmit} className="lg:col-span-3">
          <div className="grid gap-4 sm:grid-cols-2">
            {FIELDS.map((f) => (
              <label key={f.key} className="block">
                <span className="mb-1 block text-sm font-medium text-navy">{f.label}</span>
                <input
                  required
                  name={f.key}
                  type={f.type}
                  autoComplete={f.autoComplete}
                  className="gold-ring w-full rounded-xl bg-white px-4 py-2.5 text-sm outline-none"
                />
              </label>
            ))}
          </div>

          <GiftWrapOption
            selected={giftWrap.selected}
            message={giftWrap.message}
            wordCount={giftWordCount}
            error={giftError}
            onToggle={(sel) => {
              setGiftWrap({ selected: sel });
              setGiftSubmitError(null);
              trackEvent(sel ? 'gift_wrap_selected' : 'gift_wrap_removed', { selected: sel, price: GIFT_WRAP_PRICE, currency: 'ILS' });
            }}
            onMessage={(msg) => {
              setGiftWrap({ message: msg });
              if (giftSubmitError) setGiftSubmitError(null);
            }}
          />

          <button
            type="submit"
            disabled={!!giftError || submitting}
            aria-busy={submitting}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft py-3.5 font-bold text-navy shadow-gold transition-transform hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:scale-100"
          >
            {submitting ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> מעבירים אתכם לתשלום מאובטח…</>
            ) : (
              <>מעבר לתשלום מאובטח · {formatPrice(total)}</>
            )}
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
            {giftCharge > 0 && (
              <div className="flex justify-between text-navy/80">
                <dt>🎁 אריזת מתנה + כרטיס ברכה</dt>
                <dd>{formatPrice(giftCharge)}</dd>
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
