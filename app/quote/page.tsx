'use client';

// בקשת הצעת מחיר להזמנות כמות — עסקים, מוסדות ואירועים.
// המנגנון עובד באמת: הטופס נשלח כהודעת וואטסאפ מסודרת (אין צורך בשרת).

import { Suspense, useState, type FormEvent } from 'react';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Building2, CalendarDays, MessageCircle, Package } from 'lucide-react';
import { getProduct } from '@/lib/catalog';
import { trackEvent } from '@/lib/analytics';

const WHATSAPP = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '972503096969';

const NEED_TYPES = [
  'כיפות לאירוע (חתונה / בר מצווה)',
  'מתנות לעובדים וללקוחות',
  'הזמנה מרוכזת למוסד / בית כנסת',
  'מארזים בהתאמה אישית',
  'אחר',
];

function QuoteForm() {
  const params = useSearchParams();
  const productSlug = params.get('product');
  const product = productSlug ? getProduct(productSlug) : null;

  const [form, setForm] = useState({
    name: '',
    phone: '',
    needType: product ? NEED_TYPES[0] : '',
    quantity: '',
    eventDate: '',
    colors: '',
    notes: '',
  });
  const patch = (p: Partial<typeof form>) => setForm((f) => ({ ...f, ...p }));

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    trackEvent('quote_request', { query: form.needType });
    const lines = [
      '🏷️ בקשת הצעת מחיר — אמונה וביטחון',
      product && `מוצר: ${product.titleHe} (${product.sku})`,
      `שם: ${form.name}`,
      `טלפון: ${form.phone}`,
      `סוג הצורך: ${form.needType}`,
      form.quantity && `כמות משוערת: ${form.quantity}`,
      form.eventDate && `תאריך האירוע: ${form.eventDate}`,
      form.colors && `צבעים מועדפים: ${form.colors}`,
      form.notes && `הערות: ${form.notes}`,
    ].filter(Boolean);
    window.open(`https://wa.me/${WHATSAPP}?text=${encodeURIComponent(lines.join('\n'))}`, '_blank');
  };

  const input = 'gold-ring w-full rounded-xl bg-white px-3 py-2.5 text-sm outline-none';

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <div className="text-center">
        <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy">
          <Building2 className="h-6 w-6 text-gold" />
        </span>
        <h1 className="font-display text-3xl font-bold text-navy">הזמנה בכמות והצעת מחיר</h1>
        <p className="mx-auto mt-2 max-w-md text-navy/60">
          אירועים, עסקים, מוסדות ובתי כנסת — ממלאים פרטים, ההודעה נפתחת בוואטסאפ, ואנחנו חוזרים עם הצעה מותאמת.
        </p>
      </div>

      {product && (
        <div className="mx-auto mt-6 flex max-w-md items-center gap-3 rounded-2xl border border-gold/25 bg-white p-3 shadow-card">
          <div className="relative h-16 w-14 flex-shrink-0">
            <Image src={product.imageUrl!} alt={product.titleHe} fill className="rounded-xl object-cover" sizes="56px" />
          </div>
          <div>
            <p className="text-sm font-medium text-navy">{product.titleHe}</p>
            <p className="text-xs text-navy/50">מק"ט {product.sku}</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mx-auto mt-8 max-w-md space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">שם מלא</span>
            <input required value={form.name} onChange={(e) => patch({ name: e.target.value })} className={input} />
          </label>
          <label className="block">
            <span className="mb-1 block text-sm font-medium text-navy">טלפון</span>
            <input required type="tel" value={form.phone} onChange={(e) => patch({ phone: e.target.value })} className={input} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy">מה אתם צריכים?</span>
          <select required value={form.needType} onChange={(e) => patch({ needType: e.target.value })} className={input}>
            <option value="">בחירה...</option>
            {NEED_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-sm font-medium text-navy">
              <Package className="h-3.5 w-3.5 text-gold-soft" /> כמות משוערת
            </span>
            <input value={form.quantity} onChange={(e) => patch({ quantity: e.target.value })}
              placeholder="למשל: 120" className={input} />
          </label>
          <label className="block">
            <span className="mb-1 flex items-center gap-1 text-sm font-medium text-navy">
              <CalendarDays className="h-3.5 w-3.5 text-gold-soft" /> תאריך האירוע
            </span>
            <input value={form.eventDate} onChange={(e) => patch({ eventDate: e.target.value })}
              placeholder="אם רלוונטי" className={input} />
          </label>
        </div>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy">צבעים מועדפים (לא חובה)</span>
          <input value={form.colors} onChange={(e) => patch({ colors: e.target.value })} className={input} />
        </label>

        <label className="block">
          <span className="mb-1 block text-sm font-medium text-navy">הערות (לוגו, טקסט, תקציב...)</span>
          <textarea rows={3} value={form.notes} onChange={(e) => patch({ notes: e.target.value })} className={input} />
        </label>

        <button type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-full bg-[#25D366] py-3 font-bold text-white transition-transform hover:scale-[1.01]">
          <MessageCircle className="h-5 w-5" /> שליחת הבקשה בוואטסאפ
        </button>
        <p className="text-center text-[11px] text-navy/40">
          הפרטים לא נשמרים באתר — ההודעה נפתחת אצלכם בוואטסאפ ואתם שולחים אותה בעצמכם.
        </p>
      </form>
    </div>
  );
}

export default function QuotePage() {
  return (
    <Suspense fallback={<div className="skeleton mx-auto my-16 h-64 max-w-md rounded-2xl" />}>
      <QuoteForm />
    </Suspense>
  );
}
