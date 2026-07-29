'use client';

// שובר מתנה דיגיטלי — בחירת סכום, נמען וברכה אישית, והוספה לסל.
// פריט מיוחד בסל (מזוהה כ-gift-card) עם המטא-דאטה של הנמען.

import { useState } from 'react';
import { Check, Gift, Mail, Printer, ShoppingBag } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useToastStore } from '@/store/toast';
import { trackEvent } from '@/lib/analytics';
import { formatPrice, cn } from '@/lib/utils';

const AMOUNTS = [100, 200, 300, 500, 750];
const MAX_MESSAGE = 140;

export default function GiftCardPage() {
  const [amount, setAmount] = useState(200);
  const [custom, setCustom] = useState('');
  const [to, setTo] = useState('');
  const [from, setFrom] = useState('');
  const [message, setMessage] = useState('');
  const [delivery, setDelivery] = useState<'email' | 'print'>('email');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [added, setAdded] = useState(false);

  const addItem = useCartStore((s) => s.addItem);
  const showToast = useToastStore((s) => s.show);

  const finalAmount = custom ? Math.max(20, Math.min(5000, Number(custom) || 0)) : amount;

  const handleAdd = () => {
    const customization: Record<string, string> = {
      סכום: formatPrice(finalAmount),
      אספקה: delivery === 'email' ? 'שליחה במייל' : 'הדפסה ואיסוף',
      ...(to && { לכבוד: to }),
      ...(from && { מאת: from }),
      ...(message && { ברכה: message }),
      ...(delivery === 'email' && recipientEmail && { 'מייל הנמען': recipientEmail }),
    };
    addItem({ id: `gift-card-${Date.now()}`, title: `שובר מתנה · ${formatPrice(finalAmount)}`, price: finalAmount, customization });
    trackEvent('add_to_cart', { value: finalAmount, items: [{ id: 'gift-card', name: 'שובר מתנה', price: finalAmount }] });
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
    showToast('שובר המתנה נוסף לסל 🎁');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 text-center">
        <span className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-navy">
          <Gift className="h-6 w-6 text-gold" />
        </span>
        <h1 className="font-display text-3xl font-bold text-navy">שובר מתנה דיגיטלי</h1>
        <p className="mx-auto mt-2 max-w-md text-navy/60">
          מתלבטים מה לקנות? תנו להם לבחור. שובר מתנה של אמונה וביטחון — לכל מוצר באתר.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* תצוגת השובר */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-deep to-navy-light p-8 text-center shadow-gold">
            <div className="pointer-events-none absolute -top-10 start-1/3 h-40 w-40 rounded-full bg-gold/15 blur-[70px]" />
            <div className="relative rounded-xl border border-gold/30 p-6">
              <p className="font-display text-2xl font-bold text-gold">שובר מתנה</p>
              <p className="mt-1 text-sm text-cream/60">אמונה וביטחון</p>
              <p className="my-5 font-display text-5xl font-bold text-cream">{formatPrice(finalAmount)}</p>
              {to && <p className="text-sm text-cream/80">לכבוד: {to}</p>}
              {message && <p className="mt-1 text-xs italic text-cream/50">"{message}"</p>}
              {from && <p className="mt-2 text-sm text-gold-soft">מאת: {from}</p>}
            </div>
          </div>
          <p className="mt-3 text-center text-xs text-navy/40">
            השובר יישלח כקוד מתנה. בשלב ההשקה — ניצור קשר לאישור לפני הפקה.
          </p>
        </div>

        {/* טופס */}
        <div className="space-y-5">
          <div>
            <span className="mb-2 block text-sm font-medium text-navy">בחרו סכום</span>
            <div className="flex flex-wrap gap-2">
              {AMOUNTS.map((a) => (
                <button key={a} onClick={() => { setAmount(a); setCustom(''); }}
                  className={cn('rounded-full border px-5 py-2 text-sm font-bold transition-colors',
                    !custom && amount === a ? 'border-gold bg-gold/15 text-navy' : 'border-navy/15 text-navy/70 hover:border-gold/60')}>
                  {formatPrice(a)}
                </button>
              ))}
              <input value={custom} onChange={(e) => setCustom(e.target.value.replace(/\D/g, ''))}
                inputMode="numeric" placeholder="סכום אחר"
                aria-label="סכום אחר"
                className={cn('w-28 rounded-full border px-4 py-2 text-sm outline-none',
                  custom ? 'border-gold bg-gold/10' : 'border-navy/15 focus:border-gold')} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">לכבוד</span>
              <input value={to} onChange={(e) => setTo(e.target.value)} dir="rtl" maxLength={30}
                placeholder="שם המקבל/ת" className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" />
            </label>
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">מאת</span>
              <input value={from} onChange={(e) => setFrom(e.target.value)} dir="rtl" maxLength={30}
                placeholder="השם שלכם" className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 flex justify-between text-sm font-medium text-navy">
              <span>ברכה אישית</span>
              <span className="text-navy/40">{message.length}/{MAX_MESSAGE}</span>
            </span>
            <textarea value={message} onChange={(e) => setMessage(e.target.value.slice(0, MAX_MESSAGE))}
              dir="rtl" rows={3} placeholder="מזל טוב! שתמצאו בדיוק את מה שאתם אוהבים 🎁"
              className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" />
          </label>

          <div>
            <span className="mb-2 block text-sm font-medium text-navy">אופן קבלה</span>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setDelivery('email')}
                className={cn('flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                  delivery === 'email' ? 'border-gold bg-gold/15 font-bold text-navy' : 'border-navy/15 text-navy/70 hover:border-gold/60')}>
                <Mail className="h-4 w-4 text-gold-soft" /> שליחה במייל
              </button>
              <button onClick={() => setDelivery('print')}
                className={cn('flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors',
                  delivery === 'print' ? 'border-gold bg-gold/15 font-bold text-navy' : 'border-navy/15 text-navy/70 hover:border-gold/60')}>
                <Printer className="h-4 w-4 text-gold-soft" /> הדפסה ואיסוף
              </button>
            </div>
          </div>

          {delivery === 'email' && (
            <label className="block">
              <span className="mb-1 block text-sm font-medium text-navy">מייל הנמען</span>
              <input value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} type="email" dir="ltr"
                placeholder="recipient@example.com" className="gold-ring w-full rounded-xl bg-white px-3 py-2 text-sm outline-none" />
            </label>
          )}

          <button onClick={handleAdd}
            className={cn('flex w-full items-center justify-center gap-2 rounded-full py-3.5 font-bold transition-all',
              added ? 'bg-emerald-600 text-white' : 'bg-gradient-to-l from-gold to-gold-soft text-navy shadow-gold hover:scale-[1.01]')}>
            {added ? <><Check className="h-5 w-5" /> נוסף לסל</> : <><ShoppingBag className="h-5 w-5" /> הוספה לסל · {formatPrice(finalAmount)}</>}
          </button>
        </div>
      </div>
    </div>
  );
}
