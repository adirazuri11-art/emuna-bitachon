import Link from 'next/link';
import {
  Users,
  UserPlus,
  TicketCheck,
  Ticket,
  Database,
  TrendingUp,
  ArrowLeft,
  Sparkles,
  Wallet,
  ShoppingBag,
  Package,
  ChevronLeft,
} from 'lucide-react';
import {
  getClubStats,
  getRecentClubMembers,
  getSignupTrend,
} from '@/lib/crm/data';
import { getOrdersStats, getRecentOrders } from '@/lib/crm/orders';
import { AreaChart } from '@/components/crm/AreaChart';
import { Copilot } from '@/components/crm/Copilot';

const money = (n: number) => `₪${Math.round(n).toLocaleString('he-IL')}`;
const fmtDateTime = (iso: string) => (iso ? new Date(iso).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

export const dynamic = 'force-dynamic';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'short' });

function Tile({
  icon: Icon,
  label,
  value,
  href,
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  href?: string;
}) {
  const inner = (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5 transition-colors hover:border-gold/40">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <div className="font-display text-3xl font-bold text-cream">{value}</div>
      <div className="mt-1 text-sm text-cream/70">{label}</div>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default async function CrmDashboard() {
  const [club, members, trend, orderStats, recentOrders] = await Promise.all([
    getClubStats(),
    getRecentClubMembers(6),
    getSignupTrend(30),
    getOrdersStats(),
    getRecentOrders(6),
  ]);
  const trendTotal = trend.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">סקירה כללית</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-cream/50">
          <Database className="h-3.5 w-3.5" />
          נתונים אמיתיים בזמן אמת · לחיפוש מהיר: ⌘K
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {/* הזמנות — הליבה העסקית */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile icon={Wallet} label="הכנסות (שולם)" value={money(orderStats.revenue)} href="/crm/orders" />
            <Tile icon={ShoppingBag} label="הזמנות ששולמו" value={orderStats.paidCount} href="/crm/orders" />
            <Tile icon={Package} label="בעבודה" value={orderStats.inProgress} href="/crm/orders?fulfill=in_progress" />
            <Tile icon={TrendingUp} label="7 ימים" value={money(orderStats.revenue7d)} href="/crm/orders" />
          </div>

          {/* הזמנות אחרונות */}
          <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="h-5 w-5 text-gold" />
                <h2 className="font-display text-lg font-bold text-cream">הזמנות אחרונות</h2>
              </div>
              <Link href="/crm/orders" className="flex items-center gap-1 text-sm text-gold-soft hover:text-gold">
                לכל ההזמנות <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="py-6 text-center text-sm text-cream/40">אין עדיין הזמנות</div>
            ) : (
              <div className="divide-y divide-white/5">
                {recentOrders.map((o) => (
                  <Link key={o.orderNumber} href={`/crm/orders/${encodeURIComponent(o.orderNumber)}`} className="flex items-center gap-3 py-2.5 transition-colors hover:opacity-80">
                    <span className={'flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ' + (o.status === 'paid' ? 'bg-emerald-400/15 text-emerald-300' : 'bg-amber-400/15 text-amber-300')}>
                      {o.status === 'paid' ? '✓' : '…'}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm text-cream/90">{o.customerName}{o.city ? ` · ${o.city}` : ''}</div>
                      <div className="font-mono text-[11px] text-cream/40" dir="ltr">{o.orderNumber}</div>
                    </div>
                    <span className="text-sm font-medium text-cream">{money(o.amount)}</span>
                    <span className="text-xs text-cream/40">{fmtDateTime(o.createdAt)}</span>
                    <ChevronLeft className="h-4 w-4 text-gold/60" />
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* מועדון וקופונים */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <Tile icon={Users} label="חברי מועדון" value={club.total} href="/crm/customers" />
            <Tile icon={UserPlus} label="הצטרפו ב-30 יום" value={club.joined30d} href="/crm/customers" />
            <Tile icon={TicketCheck} label="קופונים שמומשו" value={club.usedCoupon} href="/crm/coupons" />
            <Tile icon={Ticket} label="קופונים פעילים" value={club.activeCoupon} href="/crm/coupons" />
          </div>

          <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-gold" />
                <h2 className="font-display text-lg font-bold text-cream">הצטרפות חברים · 30 יום</h2>
              </div>
              <span className="text-sm text-cream/50">
                סה"כ <b className="text-gold">{trendTotal}</b>
              </span>
            </div>
            <AreaChart data={trend} />
          </div>

          {/* Recent customers preview */}
          <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-gold" />
                <h2 className="font-display text-lg font-bold text-cream">לקוחות אחרונים</h2>
              </div>
              <Link href="/crm/customers" className="flex items-center gap-1 text-sm text-gold-soft hover:text-gold">
                לכל הלקוחות <ArrowLeft className="h-4 w-4" />
              </Link>
            </div>
            <div className="divide-y divide-white/5">
              {members.map((m) => (
                <Link
                  key={m.couponCode}
                  href={`/crm/customers/${encodeURIComponent(m.email)}`}
                  className="flex items-center gap-3 py-2.5 transition-colors hover:opacity-80"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/15 text-[11px] font-bold text-gold">
                    {m.email.slice(0, 2).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm text-cream/90" dir="ltr">{m.email}</span>
                  <span className={m.couponUsed ? 'text-xs text-emerald-300' : 'text-xs text-gold'}>
                    {m.couponUsed ? 'מומש' : 'פעיל'}
                  </span>
                  <span className="text-xs text-cream/40">{fmtDate(m.createdAt)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        {/* Copilot */}
        <div className="lg:col-span-1">
          <Copilot />
        </div>
      </div>

      {/* Gift finder quick link */}
      <Link
        href="/crm/gift-finder"
        className="flex items-center justify-between rounded-2xl border border-gold/15 bg-gradient-to-l from-gold/5 to-transparent p-5 transition-colors hover:border-gold/40"
      >
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-gold" />
          <div>
            <div className="font-display font-bold text-cream">אנליטיקת מאתר המתנה</div>
            <div className="text-sm text-cream/50">אילו תשובות מובילות לקליק ולרכישה</div>
          </div>
        </div>
        <ArrowLeft className="h-5 w-5 text-gold" />
      </Link>
    </div>
  );
}
