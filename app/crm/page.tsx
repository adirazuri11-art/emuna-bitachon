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
} from 'lucide-react';
import {
  getClubStats,
  getRecentClubMembers,
  getSignupTrend,
} from '@/lib/crm/data';
import { AreaChart } from '@/components/crm/AreaChart';
import { Copilot } from '@/components/crm/Copilot';

export const dynamic = 'force-dynamic';

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('he-IL', { day: 'numeric', month: 'short' });

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
  const [club, members, trend] = await Promise.all([
    getClubStats(),
    getRecentClubMembers(6),
    getSignupTrend(30),
  ]);
  const trendTotal = trend.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">סקירה כללית</h1>
        <p className="mt-1 flex items-center gap-2 text-sm text-cream/50">
          <Database className="h-3.5 w-3.5" />
          נתונים אמיתיים בזמן אמת מ-Supabase · לחיפוש מהיר: ⌘K
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
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
