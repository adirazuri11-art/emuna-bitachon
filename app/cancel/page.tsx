'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { CheckCircle2, Loader2 } from 'lucide-react';

const TYPES = [
  'מוצר פגום',
  'מוצר שגוי',
  'מוצר שאינו תואם להזמנה',
  'שינוי דעת ובקשת ביטול',
  'בקשת החלפה',
  'פריט חסר',
  'משלוח שלא הגיע',
  'נושא אחר',
];

const SOLUTIONS = ['החלפת מוצר', 'ביטול והחזר כספי', 'תיקון', 'שיחה עם נציג'];

export default function CancelPage() {
  const [form, setForm] = useState({
    name: '',
    orderNumber: '',
    phone: '',
    email: '',
    type: '',
    product: '',
    description: '',
    preferred: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [ticket, setTicket] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;
    setError(null);
    setStatus('loading');
    try {
      const res = await fetch('/api/returns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const j = await res.json().catch(() => ({}));
      if (!j.ok) {
        setError(j.error || 'אירעה שגיאה — נסו שוב.');
        setStatus('idle');
        return;
      }
      setTicket(j.ticket);
      setStatus('done');
    } catch {
      setError('שגיאת רשת — נסו שוב עוד רגע.');
      setStatus('idle');
    }
  };

  const field = 'w-full rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 outline-none focus:border-green-700';

  if (status === 'done') {
    return (
      <main className="min-h-screen bg-white text-right" dir="rtl">
        <div className="mx-auto max-w-xl px-4 py-20 text-center">
          <CheckCircle2 className="mx-auto mb-4 h-14 w-14 text-green-700" />
          <h1 className="text-2xl font-bold text-black">קיבלנו את פנייתכם</h1>
          <p className="mt-3 text-gray-700">
            מספר הפנייה שלכם הוא{' '}
            <span className="font-mono font-bold text-green-800" dir="ltr">
              {ticket}
            </span>
            . נציג מטעמנו יבדוק את הפרטים ויחזור אליכם בהקדם.
          </p>
          <p className="mt-2 text-sm text-gray-500">שמרו את מספר הפנייה למעקב.</p>
          <Link href="/returns" className="mt-6 inline-block text-green-800 hover:underline">
            חזרה למדיניות המשלוחים והביטולים
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white text-right" dir="rtl">
      <div className="bg-green-900 px-4 py-10 text-white">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-2xl md:text-3xl font-bold">בקשה לביטול, החזרה או החלפה</h1>
          <p className="mt-2 text-sm text-green-200">
            מלאו את הפרטים ונחזור אליכם. הפתרון המבוקש ייבחן בהתאם לנסיבות ולהוראות הדין.
          </p>
        </div>
      </div>

      <form onSubmit={submit} className="mx-auto max-w-2xl space-y-4 px-4 py-10">
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">שם מלא *</label>
            <input required value={form.name} onChange={set('name')} className={field} />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">מספר הזמנה</label>
            <input value={form.orderNumber} onChange={set('orderNumber')} className={field} dir="ltr" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">טלפון *</label>
            <input value={form.phone} onChange={set('phone')} className={field} dir="ltr" inputMode="tel" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-800">דוא"ל</label>
            <input type="email" value={form.email} onChange={set('email')} className={field} dir="ltr" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">סוג הפנייה *</label>
          <select required value={form.type} onChange={set('type')} className={field}>
            <option value="">בחרו סוג פנייה…</option>
            {TYPES.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">המוצר הרלוונטי</label>
          <input value={form.product} onChange={set('product')} className={field} />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">פתרון מועדף</label>
          <select value={form.preferred} onChange={set('preferred')} className={field}>
            <option value="">אין העדפה מיוחדת</option>
            {SOLUTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-800">תיאור קצר</label>
          <textarea rows={4} value={form.description} onChange={set('description')} className={field} />
          <p className="mt-1 text-xs text-gray-500">
            ניתן לצרף תמונות או סרטון בהמשך, בתשובה למייל האישור או בוואטסאפ 050-3096969.
          </p>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={status === 'loading'}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-green-900 py-3 font-bold text-white transition-colors hover:bg-green-800 disabled:opacity-60"
        >
          {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'שליחת הבקשה'}
        </button>

        <p className="text-center text-xs text-gray-500">
          הבקשה תטופל בהתאם למדיניות ולהוראות חוק הגנת הצרכן. אין למלא כאן פרטי כרטיס אשראי.{' '}
          <Link href="/returns" className="text-green-800 hover:underline">
            למדיניות המלאה
          </Link>
        </p>
      </form>
    </main>
  );
}
