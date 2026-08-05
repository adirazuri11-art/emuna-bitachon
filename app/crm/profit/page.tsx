import { Coins, Wallet, TrendingUp, Percent, PackageOpen } from 'lucide-react';
import { getProfitOverview } from '@/lib/crm/profit';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number) => `₪${nf(Math.round(n))}`;

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone?: 'emerald' | 'gold' }) {
  const c = tone === 'emerald' ? 'text-emerald-300' : 'text-gold';
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm text-cream/60"><Icon className={`h-4 w-4 ${c}`} /> {label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-cream">{value}</div>
      {sub && <div className="mt-1 text-xs text-cream/40">{sub}</div>}
    </div>
  );
}

// פס-רווח יחסי לתצוגה מהירה
function ProfitBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.max(2, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/5">
      <div className="h-full rounded-full bg-gradient-to-l from-gold to-emerald-400" style={{ width: `${pct}%` }} />
    </div>
  );
}

export default async function ProfitPage() {
  const p = await getProfitOverview(0);
  const maxCatProfit = Math.max(1, ...p.byCategory.map((c) => c.profit));
  const maxProdProfit = Math.max(1, ...p.topProducts.map((c) => c.profit));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">רווח</h1>
        <p className="mt-1 text-sm text-cream/50">
          רווח גולמי אמיתי לפי עלות הספק — מכל הזמנות ששולמו. הערכה לרווח מוצרים (לפני משלוח וקופונים).
        </p>
      </div>

      {!p.ok || p.ordersCount === 0 ? (
        <div className="rounded-2xl border border-gold/15 bg-white/5 px-5 py-12 text-center text-sm text-cream/40">
          עדיין אין הזמנות ששולמו לחישוב רווח.
        </div>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <Kpi icon={Wallet} label="הכנסות (מוצרים)" value={money(p.revenue)} sub={`${nf(p.ordersCount)} הזמנות`} />
            <Kpi icon={PackageOpen} label="עלות ספק" value={money(p.cost)} />
            <Kpi icon={Coins} label="רווח גולמי" value={money(p.grossProfit)} tone="emerald" />
            <Kpi icon={Percent} label="מרווח" value={`${p.margin}%`} sub="רווח מתוך ההכנסה" tone="emerald" />
          </div>

          {/* רווח לפי קטגוריה */}
          <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70">
              <TrendingUp className="h-4 w-4 text-gold" /> רווח לפי קטגוריה
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-xs text-cream/40">
                    <th className="px-5 py-2.5 font-medium">קטגוריה</th>
                    <th className="px-3 py-2.5 font-medium">יח׳</th>
                    <th className="px-3 py-2.5 font-medium">הכנסה</th>
                    <th className="px-3 py-2.5 font-medium">רווח</th>
                    <th className="px-3 py-2.5 font-medium">מרווח</th>
                    <th className="px-5 py-2.5 font-medium w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {p.byCategory.map((c) => (
                    <tr key={c.key} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 text-cream/90">{c.label}</td>
                      <td className="px-3 py-3 text-cream/50">{nf(c.units)}</td>
                      <td className="px-3 py-3 text-cream/70">{money(c.revenue)}</td>
                      <td className="px-3 py-3 font-medium text-emerald-300">{money(c.profit)}</td>
                      <td className="px-3 py-3 text-cream/60">{c.margin}%</td>
                      <td className="px-5 py-3"><ProfitBar value={c.profit} max={maxCatProfit} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* מוצרים רווחיים */}
          <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
            <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70">
              <Coins className="h-4 w-4 text-emerald-300" /> 15 המוצרים הרווחיים ביותר
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-right text-xs text-cream/40">
                    <th className="px-5 py-2.5 font-medium">מוצר</th>
                    <th className="px-3 py-2.5 font-medium">נמכרו</th>
                    <th className="px-3 py-2.5 font-medium">רווח</th>
                    <th className="px-3 py-2.5 font-medium">מרווח</th>
                    <th className="px-5 py-2.5 font-medium w-32"></th>
                  </tr>
                </thead>
                <tbody>
                  {p.topProducts.map((c) => (
                    <tr key={c.key} className="border-t border-white/5 hover:bg-white/5">
                      <td className="px-5 py-3 text-cream/90">{c.label}</td>
                      <td className="px-3 py-3 text-cream/50">{nf(c.units)}</td>
                      <td className="px-3 py-3 font-medium text-emerald-300">{money(c.profit)}</td>
                      <td className="px-3 py-3 text-cream/60">{c.margin}%</td>
                      <td className="px-5 py-3"><ProfitBar value={c.profit} max={maxProdProfit} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
