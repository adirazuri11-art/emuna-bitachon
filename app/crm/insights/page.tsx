import { PackageSearch, TrendingUp, PackageX, Users, Crown, UserMinus, Repeat } from 'lucide-react';
import { getProductPerformance, getCustomerSegments } from '@/lib/crm/insights';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number) => `₪${nf(Math.round(n))}`;

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone?: 'emerald' | 'amber' | 'gold' }) {
  const c = tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : 'text-gold';
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm text-cream/60"><Icon className={`h-4 w-4 ${c}`} /> {label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-cream">{value}</div>
      {sub && <div className="mt-1 text-xs text-cream/40">{sub}</div>}
    </div>
  );
}

const daysAgo = (d: number) => (d >= 9999 ? '—' : d < 1 ? 'היום' : `לפני ${d} ימים`);

export default async function InsightsPage() {
  const [perf, seg] = await Promise.all([getProductPerformance(), getCustomerSegments()]);
  const empty = (!perf.ok || perf.soldDistinct === 0) && (!seg.ok || seg.buyers === 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">תובנות מוצרים ולקוחות</h1>
        <p className="mt-1 text-sm text-cream/50">מה נמכר, מה תקוע במלאי, ומי הלקוחות ששווה לשמר ולהחזיר.</p>
      </div>

      {empty ? (
        <div className="rounded-2xl border border-gold/15 bg-white/5 px-5 py-12 text-center text-sm text-cream/40">
          עדיין אין מספיק נתוני מכירות לתובנות.
        </div>
      ) : (
        <>
          {/* ===== ביצועי מוצרים ===== */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cream"><PackageSearch className="h-5 w-5 text-gold" /> ביצועי מוצרים</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <Kpi icon={PackageSearch} label="מוצרים בקטלוג" value={nf(perf.catalogSize)} />
              <Kpi icon={TrendingUp} label="מוצרים שנמכרו" value={nf(perf.soldDistinct)} tone="emerald" />
              <Kpi icon={PackageX} label="מעולם לא נמכרו" value={nf(perf.deadStockCount)} sub="שווה לקדם או להוריד" tone="amber" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* רבי-מכר */}
              <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
                <div className="border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70">🔥 רבי-מכר (לפי כמות)</div>
                {perf.topSellers.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-cream/40">אין עדיין מכירות</div>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {perf.topSellers.map((s, i) => (
                        <tr key={s.sku} className="border-t border-white/5 hover:bg-white/5">
                          <td className="w-8 px-5 py-2.5 text-cream/30">{i + 1}</td>
                          <td className="px-3 py-2.5 text-cream/90">{s.title}</td>
                          <td className="px-3 py-2.5 text-left font-medium text-emerald-300">{nf(s.units)} יח׳</td>
                          <td className="px-5 py-2.5 text-left text-cream/50">{money(s.revenue)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* dead stock */}
              <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
                <div className="border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70">🧊 מלאי תקוע — לדוגמה ({nf(perf.deadStockCount)} סה״כ)</div>
                {perf.deadStockSample.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-emerald-300/70">כל המוצרים נמכרו לפחות פעם! 🎉</div>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {perf.deadStockSample.map((d) => (
                        <tr key={d.sku} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-5 py-2.5 text-cream/80">{d.title}</td>
                          <td className="px-5 py-2.5 text-left font-mono text-xs text-cream/30" dir="ltr">{d.sku}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>

          {/* ===== פילוח לקוחות ===== */}
          <section className="space-y-4">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-cream"><Users className="h-5 w-5 text-gold" /> פילוח לקוחות</h2>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              <Kpi icon={Users} label="סה״כ קונים" value={nf(seg.buyers)} />
              <Kpi icon={Repeat} label="קונים חוזרים" value={nf(seg.repeatBuyers)} sub={`${seg.repeatRate}% מהקונים`} tone="emerald" />
              <Kpi icon={Crown} label="VIP" value={nf(seg.vips.length)} sub="3+ הזמנות או ₪800+" tone="gold" />
              <Kpi icon={UserMinus} label="בסיכון" value={nf(seg.atRisk.length)} sub="לא רכשו 60+ יום" tone="amber" />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              {/* VIP */}
              <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
                <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70"><Crown className="h-4 w-4 text-gold" /> לקוחות VIP</div>
                {seg.vips.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-cream/40">אין עדיין לקוחות VIP</div>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {seg.vips.map((c) => (
                        <tr key={c.email || c.name} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-5 py-2.5 text-cream/90">{c.name}</td>
                          <td className="px-3 py-2.5 text-cream/40">{nf(c.orders)} הזמנות</td>
                          <td className="px-5 py-2.5 text-left font-medium text-gold">{money(c.spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>

              {/* בסיכון — win-back */}
              <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
                <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70"><UserMinus className="h-4 w-4 text-amber-300" /> בסיכון — מועמדים ל-win-back</div>
                {seg.atRisk.length === 0 ? (
                  <div className="px-5 py-10 text-center text-sm text-cream/40">אין לקוחות בסיכון כרגע</div>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {seg.atRisk.map((c) => (
                        <tr key={c.email || c.name} className="border-t border-white/5 hover:bg-white/5">
                          <td className="px-5 py-2.5 text-cream/90">{c.name}</td>
                          <td className="px-3 py-2.5 text-xs text-cream/40">{daysAgo(c.daysSince)}</td>
                          <td className="px-5 py-2.5 text-left font-medium text-cream/70">{money(c.spent)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </section>
        </>
      )}
    </div>
  );
}
