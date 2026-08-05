import { Ticket, CheckCircle2, Repeat, Wallet } from 'lucide-react';
import { listPromoCouponsWithPerf } from '@/lib/crm/promotions';
import { PromoManager } from '@/components/crm/PromoManager';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number) => `₪${nf(Math.round(n))}`;

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone?: 'emerald' | 'gold' }) {
  const c = tone === 'emerald' ? 'text-emerald-300' : 'text-gold';
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm text-cream/60"><Icon className={`h-4 w-4 ${c}`} /> {label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-cream" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export default async function PromotionsPage() {
  const coupons = await listPromoCouponsWithPerf();
  const activeCount = coupons.filter((c) => c.active && !c.expired).length;
  const totalRedemptions = coupons.reduce((s, c) => s + c.redemptions, 0);
  const totalRevenue = coupons.reduce((s, c) => s + c.revenue, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">מבצעים וקופונים</h1>
        <p className="mt-1 text-sm text-cream/50">
          יצירת קודי קופון מותאמים (אחוז/סכום, תוקף, מגבלת מימושים) — פעילים מיד בקופה — ומעקב אחר הביצועים שלהם.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Ticket} label="סה״כ קופונים" value={nf(coupons.length)} />
        <Kpi icon={CheckCircle2} label="פעילים כעת" value={nf(activeCount)} tone="emerald" />
        <Kpi icon={Repeat} label="מימושים" value={nf(totalRedemptions)} />
        <Kpi icon={Wallet} label="הכנסה מקופונים" value={money(totalRevenue)} tone="emerald" />
      </div>

      <PromoManager initial={coupons} />
    </div>
  );
}
