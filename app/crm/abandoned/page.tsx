import { ShoppingCart, AlertTriangle, Wallet, PhoneCall, MessageCircle, Mail, Clock } from 'lucide-react';
import { getAbandonedCheckouts } from '@/lib/crm/abandoned';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number) => `₪${nf(Math.round(n))}`;

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone?: 'amber' | 'emerald' }) {
  const c = tone === 'amber' ? 'text-amber-300' : tone === 'emerald' ? 'text-emerald-300' : 'text-gold';
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm text-cream/60"><Icon className={`h-4 w-4 ${c}`} /> {label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-cream">{value}</div>
      {sub && <div className="mt-1 text-xs text-cream/40">{sub}</div>}
    </div>
  );
}

const ago = (h: number) => (h < 1 ? 'לפני פחות משעה' : h < 24 ? `לפני ${h} שע׳` : `לפני ${Math.round(h / 24)} ימים`);

export default async function AbandonedPage() {
  const { rows, stats } = await getAbandonedCheckouts(30, 100);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">שחזור קופות נטושות</h1>
        <p className="mt-1 text-sm text-cream/50">
          לקוחות שהתחילו הזמנה ולא השלימו תשלום (30 יום אחרונים). לחיצה על וואטסאפ פותחת הודעת שחזור מוכנה.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Kpi icon={ShoppingCart} label="קופות נטושות" value={nf(stats.count)} tone="amber" />
        <Kpi icon={Wallet} label="כסף תלוי לשחזור" value={money(stats.valueAtRisk)} sub="הסכום הכולל של ההזמנות שלא הושלמו" tone="amber" />
        <Kpi icon={PhoneCall} label="ניתנים ליצירת קשר" value={nf(stats.recoverableCount)} sub="עם טלפון או מייל" tone="emerald" />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70">
          <AlertTriangle className="h-4 w-4 text-amber-300" /> קופות ממתינות לשחזור
        </div>
        {rows.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-cream/40">🎉 אין כרגע קופות נטושות — כל הכבוד!</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-cream/40">
                  <th className="px-5 py-2.5 font-medium">לקוח</th>
                  <th className="px-3 py-2.5 font-medium">מה בעגלה</th>
                  <th className="px-3 py-2.5 font-medium">סכום</th>
                  <th className="px-3 py-2.5 font-medium">מתי</th>
                  <th className="px-5 py-2.5 font-medium text-left">שחזור</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.orderNumber} className="border-t border-white/5 align-top hover:bg-white/5">
                    <td className="px-5 py-3">
                      <div className="text-cream/90">{r.name}</div>
                      {r.phone && <div className="text-xs text-cream/40" dir="ltr">{r.phone}</div>}
                      {r.email && <div className="text-xs text-cream/40" dir="ltr">{r.email}</div>}
                    </td>
                    <td className="px-3 py-3 text-xs text-cream/60">
                      {r.items.slice(0, 3).join(' · ')}
                      {r.itemCount > 3 && <span className="text-cream/30"> +{r.itemCount - 3}</span>}
                    </td>
                    <td className="px-3 py-3 font-medium text-cream">{money(r.amount)}</td>
                    <td className="px-3 py-3 text-xs text-cream/50">
                      <span className="inline-flex items-center gap-1"><Clock className="h-3 w-3" /> {ago(r.hoursAgo)}</span>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-start gap-2">
                        {r.waHref ? (
                          <a href={r.waHref} target="_blank" rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1.5 text-xs font-bold text-emerald-300 transition-colors hover:bg-emerald-500/25">
                            <MessageCircle className="h-3.5 w-3.5" /> וואטסאפ
                          </a>
                        ) : null}
                        {r.mailHref ? (
                          <a href={r.mailHref}
                            className="inline-flex items-center gap-1.5 rounded-full bg-sky-500/15 px-3 py-1.5 text-xs font-bold text-sky-300 transition-colors hover:bg-sky-500/25">
                            <Mail className="h-3.5 w-3.5" /> מייל
                          </a>
                        ) : null}
                        {!r.waHref && !r.mailHref && <span className="text-xs text-cream/30">אין פרטי קשר</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
