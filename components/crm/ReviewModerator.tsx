'use client';

// מודרציית ביקורות ב-CRM — אישור/דחייה, סינון לפי סטטוס.
import { useState } from 'react';
import { Star, Check, X, Clock, RotateCcw } from 'lucide-react';

type Status = 'pending' | 'approved' | 'rejected';
interface Review {
  id: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string | null;
  body: string;
  status: Status;
  createdAt: string;
}

const TABS: { key: Status; label: string }[] = [
  { key: 'pending', label: 'ממתינות' },
  { key: 'approved', label: 'מאושרות' },
  { key: 'rejected', label: 'נדחו' },
];

export function ReviewModerator({ initial }: { initial: Review[] }) {
  const [reviews, setReviews] = useState<Review[]>(initial);
  const [tab, setTab] = useState<Status>('pending');
  const [busy, setBusy] = useState<string | null>(null);

  const moderate = async (id: string, status: Status) => {
    setBusy(id);
    try {
      const r = await fetch('/api/crm/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      const d = await r.json();
      if (d.ok) setReviews((prev) => prev.map((x) => (x.id === id ? { ...x, status } : x)));
    } finally {
      setBusy(null);
    }
  };

  const shown = reviews.filter((r) => r.status === tab);
  const counts = {
    pending: reviews.filter((r) => r.status === 'pending').length,
    approved: reviews.filter((r) => r.status === 'approved').length,
    rejected: reviews.filter((r) => r.status === 'rejected').length,
  };
  const fmt = (iso: string) => new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={
              'rounded-full px-4 py-1.5 text-sm transition-colors ' +
              (tab === t.key ? 'bg-gold/15 font-bold text-gold' : 'text-cream/60 hover:bg-white/5')
            }
          >
            {t.label} <span className="text-cream/40">· {counts[t.key]}</span>
          </button>
        ))}
      </div>

      {shown.length === 0 ? (
        <div className="rounded-2xl border border-gold/15 bg-white/5 p-10 text-center text-sm text-cream/40">
          אין ביקורות בסטטוס הזה
        </div>
      ) : (
        <div className="space-y-3">
          {shown.map((r) => (
            <div key={r.id} className="rounded-2xl border border-gold/15 bg-white/5 p-4">
              <div className="mb-1.5 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-cream">{r.authorName}</span>
                  <span className="inline-flex" dir="ltr">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <Star key={n} className={`h-3.5 w-3.5 ${n <= r.rating ? 'fill-gold text-gold' : 'fill-white/10 text-white/20'}`} />
                    ))}
                  </span>
                </div>
                <span className="text-xs text-cream/40">{fmt(r.createdAt)}</span>
              </div>
              <a href={`/product/${r.productSlug}`} target="_blank" rel="noopener" className="text-[11px] text-gold/70 hover:underline" dir="ltr">
                {r.productSlug}
              </a>
              {r.title && <p className="mt-1 font-medium text-cream/90">{r.title}</p>}
              <p className="mt-1 text-sm leading-relaxed text-cream/70">{r.body}</p>

              <div className="mt-3 flex gap-2">
                {r.status !== 'approved' && (
                  <button
                    onClick={() => moderate(r.id, 'approved')}
                    disabled={busy === r.id}
                    className="flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-xs font-medium text-emerald-300 hover:bg-emerald-400/25 disabled:opacity-50"
                  >
                    <Check className="h-3.5 w-3.5" /> אישור ופרסום
                  </button>
                )}
                {r.status !== 'rejected' && (
                  <button
                    onClick={() => moderate(r.id, 'rejected')}
                    disabled={busy === r.id}
                    className="flex items-center gap-1.5 rounded-full bg-red-400/15 px-3 py-1.5 text-xs font-medium text-red-300 hover:bg-red-400/25 disabled:opacity-50"
                  >
                    <X className="h-3.5 w-3.5" /> דחייה
                  </button>
                )}
                {r.status !== 'pending' && (
                  <button
                    onClick={() => moderate(r.id, 'pending')}
                    disabled={busy === r.id}
                    className="flex items-center gap-1.5 rounded-full bg-white/5 px-3 py-1.5 text-xs text-cream/60 hover:bg-white/10 disabled:opacity-50"
                  >
                    <Clock className="h-3.5 w-3.5" /> להמתנה
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      {reviews.length === 0 && (
        <div className="flex items-center gap-2 text-xs text-cream/30">
          <RotateCcw className="h-3.5 w-3.5" /> ביקורות שלקוחות ישלחו בעמודי המוצר יופיעו כאן לאישור.
        </div>
      )}
    </div>
  );
}
