'use client';

// ביקורות מוצר — תצוגה + טופס הגשה. ביקורות חדשות ממתינות לאישור ב-CRM.
import { useState, type FormEvent } from 'react';
import { Star, CheckCircle2, Loader2 } from 'lucide-react';
import { useToastStore } from '@/store/toast';

interface Review {
  id: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  createdAt: string;
}
interface Props {
  productSlug: string;
  productId: string;
  reviews: Review[];
  stats: { count: number; avg: number };
}

function Stars({ value, size = 16, onSelect }: { value: number; size?: number; onSelect?: (n: number) => void }) {
  return (
    <span className="inline-flex" dir="ltr">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type={onSelect ? 'button' : undefined}
          onClick={onSelect ? () => onSelect(n) : undefined}
          className={onSelect ? 'cursor-pointer p-0.5' : 'pointer-events-none'}
          aria-label={onSelect ? `${n} כוכבים` : undefined}
        >
          <Star
            style={{ width: size, height: size }}
            className={n <= Math.round(value) ? 'fill-gold text-gold' : 'fill-navy/10 text-navy/20'}
          />
        </button>
      ))}
    </span>
  );
}

export function ProductReviews({ productSlug, productId, reviews, stats }: Props) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [name, setName] = useState('');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const showToast = useToastStore((s) => s.show);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (busy || !name.trim() || !body.trim()) return;
    setBusy(true);
    try {
      const r = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productSlug, productId, authorName: name.trim(), rating, title: title.trim(), body: body.trim(), email: email.trim() }),
      });
      const d = await r.json();
      if (d.ok) {
        setDone(true);
        showToast('תודה! הביקורת נשלחה ותפורסם לאחר אישור 🙏');
      } else {
        showToast('לא הצלחנו לשלוח — נסו שוב', 'error');
      }
    } catch {
      showToast('שגיאת רשת — נסו שוב', 'error');
    } finally {
      setBusy(false);
    }
  };

  const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <section className="mx-auto max-w-3xl px-4 py-10">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-navy/10 pb-4">
        <h2 className="font-display text-2xl font-bold text-navy">חוות דעת</h2>
        {stats.count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <Stars value={stats.avg} />
            <span className="font-bold text-navy">{stats.avg.toFixed(1)}</span>
            <span className="text-navy/50">· {stats.count} חוות דעת</span>
          </div>
        )}
      </div>

      {reviews.length > 0 ? (
        <div className="divide-y divide-navy/10">
          {reviews.map((r) => (
            <div key={r.id} className="py-4">
              <div className="mb-1 flex items-center justify-between gap-2">
                <span className="font-medium text-navy">{r.authorName}</span>
                <span className="text-xs text-navy/40">{fmtDate(r.createdAt)}</span>
              </div>
              <Stars value={r.rating} size={14} />
              {r.title && <p className="mt-1.5 font-medium text-navy">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-navy/75">{r.body}</p>
            </div>
          ))}
        </div>
      ) : (
        <p className="py-6 text-center text-sm text-navy/50">עדיין אין חוות דעת על המוצר הזה — היו הראשונים לשתף! ✨</p>
      )}

      {/* טופס */}
      {done ? (
        <div className="mt-4 flex items-center justify-center gap-2 rounded-xl border border-gold/25 bg-gold/5 p-4 text-sm font-medium text-navy">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" /> תודה! הביקורת תפורסם לאחר אישור.
        </div>
      ) : !open ? (
        <button
          onClick={() => setOpen(true)}
          className="mt-5 w-full rounded-full border border-gold/40 py-2.5 text-sm font-bold text-navy transition-colors hover:bg-gold/10"
        >
          כתיבת חוות דעת ✍️
        </button>
      ) : (
        <form onSubmit={submit} className="mt-5 space-y-3 rounded-2xl border border-gold/20 bg-white p-5 shadow-card">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-navy">הדירוג שלך:</span>
            <Stars value={rating} size={24} onSelect={setRating} />
          </div>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="השם שלך *"
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy outline-none focus:border-gold" />
          <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="כותרת (לא חובה)"
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy outline-none focus:border-gold" />
          <textarea value={body} onChange={(e) => setBody(e.target.value)} required rows={3} maxLength={2000}
            placeholder="ספרו לנו על החוויה עם המוצר... *"
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm leading-relaxed text-navy outline-none focus:border-gold" />
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" dir="ltr" placeholder="אימייל (לא יפורסם)"
            className="w-full rounded-xl border border-navy/15 bg-white px-4 py-2.5 text-sm text-navy outline-none focus:border-gold" />
          <button type="submit" disabled={busy}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft py-2.5 text-sm font-bold text-navy disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null} שליחת חוות דעת
          </button>
          <p className="text-center text-[11px] text-navy/40">הביקורת תפורסם לאחר בדיקה. אנו מפרסמים חוות דעת אמיתיות בלבד.</p>
        </form>
      )}
    </section>
  );
}
