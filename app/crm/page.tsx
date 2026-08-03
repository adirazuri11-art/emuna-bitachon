import {
  Users,
  UserPlus,
  TicketCheck,
  Ticket,
  Gift,
  MousePointerClick,
  Sparkles,
  Database,
} from 'lucide-react';
import {
  getClubStats,
  getRecentClubMembers,
  getGiftFinderStats,
  getCouponStats,
} from '@/lib/crm/data';

export const dynamic = 'force-dynamic';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short', year: 'numeric' });

function Tile({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <div className="font-display text-3xl font-bold text-cream">{value}</div>
      <div className="mt-1 text-sm text-cream/70">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-cream/40">{sub}</div>}
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
            <div
              className="h-full rounded-full bg-gradient-to-l from-gold to-gold-soft"
              style={{ width: `${(it.count / max) * 100}%` }}
            />
          </div>
          <span className="w-8 shrink-0 text-end text-sm font-bold text-gold">{it.count}</span>
        </div>
      ))}
    </div>
  );
}

export default async function CrmDashboard() {
  const [club, members, gift, coupons] = await Promise.all([
    getClubStats(),
    getRecentClubMembers(25),
    getGiftFinderStats(),
    getCouponStats(),
  ]);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">סקירה כללית</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-cream/50">
          <Database className="h-3.5 w-3.5" />
          נתונים אמיתיים בזמן אמת מ-Supabase · ללא נתוני דמו
        </p>
      </div>

      {/* KPI tiles — real */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile icon={Users} label="חברי מועדון" value={club.total} sub={club.ok ? undefined : 'אין חיבור ל-DB'} />
        <Tile icon={UserPlus} label="הצטרפו ב-30 יום" value={club.joined30d} />
        <Tile icon={TicketCheck} label="קופוני מועדון שמומשו" value={club.usedCoupon} />
        <Tile icon={Ticket} label="קופוני מועדון פעילים" value={club.activeCoupon} />
      </div>

      {/* Gift Finder analytics */}
      <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <h2 className="font-display text-lg font-bold text-cream">מאתר המתנה המושלמת</h2>
        </div>

        {!gift.tableReady ? (
          <div className="rounded-xl border border-gold/20 bg-navy/40 p-5 text-sm text-cream/70">
            טבלת ה-sessions עדיין לא הופעלה. יש להריץ פעם אחת את המיגרציה
            <code className="mx-1 rounded bg-black/30 px-1.5 py-0.5 text-gold" dir="ltr">
              docs/crm/sql/001_gift_finder_sessions.sql
            </code>
            ב-Supabase, ואז הנתונים כאן יתמלאו אוטומטית עם כל שימוש במאתר המתנה.
          </div>
        ) : (
          <>
            <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
              <Tile icon={Gift} label='סה"כ שימושים' value={gift.total} />
              <Tile icon={Gift} label="ב-30 יום" value={gift.last30d} />
              <Tile icon={MousePointerClick} label="הובילו לקליק" value={gift.withClick} />
              <Tile
                icon={MousePointerClick}
                label="שיעור קליק"
                value={`${Math.round(gift.clickRate * 100)}%`}
              />
            </div>
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-sm font-medium text-cream/60">אירועים מובילים</h3>
                {gift.topOccasions.length ? (
                  <BarList items={gift.topOccasions} />
                ) : (
                  <p className="text-sm text-cream/40">אין עדיין נתונים</p>
                )}
              </div>
              <div>
                <h3 className="mb-3 text-sm font-medium text-cream/60">קטגוריות מומלצות מובילות</h3>
                {gift.topCategories.length ? (
                  <BarList items={gift.topCategories} />
                ) : (
                  <p className="text-sm text-cream/40">אין עדיין נתונים</p>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      {/* Coupons + recent members */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gold/15 bg-white/5 p-6 lg:col-span-1">
          <div className="mb-4 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-gold" />
            <h2 className="font-display text-lg font-bold text-cream">קופונים</h2>
          </div>
          {coupons.tableReady ? (
            <div className="space-y-4">
              <Tile icon={Ticket} label='קופונים סה"כ' value={coupons.total} />
              <Tile icon={TicketCheck} label="מומשו" value={coupons.used} />
            </div>
          ) : (
            <p className="text-sm text-cream/40">טבלת הקופונים אינה זמינה כרגע.</p>
          )}
        </div>

        <div className="rounded-2xl border border-gold/15 bg-white/5 p-6 lg:col-span-2">
          <div className="mb-4 flex items-center gap-2">
            <Users className="h-5 w-5 text-gold" />
            <h2 className="font-display text-lg font-bold text-cream">חברי מועדון אחרונים</h2>
          </div>
          {members.length ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/10 text-cream/50">
                    <th className="py-2 text-start font-medium">אימייל</th>
                    <th className="py-2 text-start font-medium">קוד הטבה</th>
                    <th className="py-2 text-start font-medium">סטטוס</th>
                    <th className="py-2 text-start font-medium">הצטרף</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((m) => (
                    <tr key={m.couponCode} className="border-b border-white/5">
                      <td className="py-2.5 text-cream/90" dir="ltr">
                        {m.email}
                      </td>
                      <td className="py-2.5 font-mono text-xs text-gold" dir="ltr">
                        {m.couponCode}
                      </td>
                      <td className="py-2.5">
                        {m.couponUsed ? (
                          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-300">
                            מומש
                          </span>
                        ) : (
                          <span className="rounded-full bg-gold/15 px-2 py-0.5 text-xs text-gold">
                            פעיל
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 text-cream/60">{fmtDate(m.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-cream/40">
              אין עדיין חברי מועדון להצגה (או שאין חיבור ל-DB בסביבה זו).
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
