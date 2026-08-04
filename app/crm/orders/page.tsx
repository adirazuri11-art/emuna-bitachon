import Link from 'next/link';
import { ShoppingBag, TrendingUp, Wallet, Clock, CheckCircle2, ChevronLeft } from 'lucide-react';
import { getOrdersStats, getRecentOrders } from '@/lib/crm/orders';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number) => `₪${nf(Math.round(n))}`;

function Kpi({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm text-cream/60"><Icon className="h-4 w-4 text-gold" /> {label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-cream">{value}</div>
      {sub && <div className="mt-1 text-xs text-cream/40">{sub}</div>}
    </div>
  );
}

const statusPill = (s: string) => {
  if (s === 'paid') return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/15 px-2.5 py-0.5 text-xs font-medium text-emerald-300"><CheckCircle2 className="h-3 w-3" /> שולם</span>;
  if (s === 'pending_payment') return <span className="rounded-full bg-amber-400/15 px-2.5 py-0.5 text-xs font-medium text-amber-300">ממתין</span>;
  return <span className="rounded-full bg-red-400/15 px-2.5 py-0.5 text-xs font-medium text-red-300">נכשל</span>;
};

const fmtDate = (iso: string) => (iso ? new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

export default async function OrdersPage() {
  const [stats, orders] = await Promise.all([getOrdersStats(), getRecentOrders(60)]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">הזמנות</h1>
        <p className="mt-1 text-sm text-cream/50">מרכז ההזמנות — הכנסות, סטטוס תשלום ופרטי כל הזמנה</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Wallet} label="הכנסות (שולם)" value={money(stats.revenue)} sub={`${nf(stats.paidCount)} הזמנות ששולמו`} />
        <Kpi icon={TrendingUp} label="7 ימים אחרונים" value={money(stats.revenue7d)} sub={`${nf(stats.paid7d)} הזמנות`} />
        <Kpi icon={ShoppingBag} label="ממוצע להזמנה" value={money(stats.aov)} />
        <Kpi icon={Clock} label="ממתינות לתשלום" value={nf(stats.pendingCount)} sub={stats.revenueToday ? `היום: ${money(stats.revenueToday)}` : undefined} />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
        <div className="border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70">הזמנות אחרונות</div>
        {orders.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-cream/40">אין עדיין הזמנות</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-cream/40">
                  <th className="px-5 py-2.5 font-medium">הזמנה</th>
                  <th className="px-3 py-2.5 font-medium">לקוח</th>
                  <th className="px-3 py-2.5 font-medium">סכום</th>
                  <th className="px-3 py-2.5 font-medium">סטטוס</th>
                  <th className="px-3 py-2.5 font-medium">תאריך</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.orderNumber} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3 font-mono text-xs text-cream/80" dir="ltr">{o.orderNumber}</td>
                    <td className="px-3 py-3">
                      <div className="text-cream/90">{o.customerName}</div>
                      {o.city && <div className="text-xs text-cream/40">{o.city}</div>}
                    </td>
                    <td className="px-3 py-3 font-medium text-cream">{money(o.amount)}</td>
                    <td className="px-3 py-3">{statusPill(o.status)}</td>
                    <td className="px-3 py-3 text-xs text-cream/50">{fmtDate(o.createdAt)}</td>
                    <td className="px-5 py-3 text-left">
                      <Link href={`/crm/orders/${encodeURIComponent(o.orderNumber)}`} className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80">
                        פרטים <ChevronLeft className="h-3.5 w-3.5" />
                      </Link>
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
