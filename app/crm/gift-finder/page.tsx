import { Gift, MousePointerClick, Sparkles } from 'lucide-react';
import { getGiftFinderStats } from '@/lib/crm/data';

export const dynamic = 'force-dynamic';

function Tile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <div className="font-display text-3xl font-bold text-cream">{value}</div>
      <div className="mt-1 text-sm text-cream/70">{label}</div>
    </div>
  );
}

function BarList({ items }: { items: { label: string; count: number }[] }) {
  const max = Math.max(1, ...items.map((i) => i.count));
  return (
    <div className="space-y-2.5">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-3">
          <span className="w-28 shrink-0 truncate text-sm text-cream/80">{it.label}</span>
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/10">
            <div className="h-full rounded-full bg-gradient-to-l from-gold to-gold-soft" style={{ width: `${(it.count / max) * 100}%` }} />
          </div>
          <span className="w-8 shrink-0 text-end text-sm font-bold text-gold">{it.count}</span>
        </div>
      ))}
    </div>
  );
}

export default async function GiftFinderCrmPage() {
  const gift = await getGiftFinderStats();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="h-5 w-5 text-gold" />
        <h1 className="font-display text-2xl font-bold text-cream">מאתר המתנה המושלמת</h1>
      </div>

      {!gift.tableReady ? (
        <div className="rounded-2xl border border-gold/20 bg-navy/40 p-6 text-sm text-cream/70">
          טבלת ה-sessions עדיין לא הופעלה. יש להריץ פעם אחת את המיגרציה{' '}
          <code className="rounded bg-black/30 px-1.5 py-0.5 text-gold" dir="ltr">
            docs/crm/sql/001_gift_finder_sessions.sql
          </code>{' '}
          ב-Supabase, ומאותו רגע כל שימוש במאתר המתנה יופיע כאן אוטומטית — כולל אילו תשובות הובילו לקליק
          ולרכישה (מזין את סוכן האופטימיזציה).
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile icon={Gift} label='סה"כ שימושים' value={gift.total} />
            <Tile icon={Gift} label="ב-30 יום" value={gift.last30d} />
            <Tile icon={MousePointerClick} label="הובילו לקליק" value={gift.withClick} />
            <Tile icon={MousePointerClick} label="שיעור קליק" value={`${Math.round(gift.clickRate * 100)}%`} />
          </div>
          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
              <h3 className="mb-4 text-sm font-medium text-cream/60">אירועים מובילים</h3>
              {gift.topOccasions.length ? <BarList items={gift.topOccasions} /> : <p className="text-sm text-cream/40">אין עדיין נתונים</p>}
            </div>
            <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
              <h3 className="mb-4 text-sm font-medium text-cream/60">קטגוריות מומלצות מובילות</h3>
              {gift.topCategories.length ? <BarList items={gift.topCategories} /> : <p className="text-sm text-cream/40">אין עדיין נתונים</p>}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
