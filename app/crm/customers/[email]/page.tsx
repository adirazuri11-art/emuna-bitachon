import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, Mail, Ticket, CalendarDays, ShoppingBag, UserPlus, CheckCircle2, Clock } from 'lucide-react';
import { getCustomer } from '@/lib/crm/data';

export const dynamic = 'force-dynamic';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'long', year: 'numeric' });

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'הטבה פעילה', cls: 'bg-gold/15 text-gold' },
  used: { label: 'מומש', cls: 'bg-emerald-500/15 text-emerald-300' },
  expired: { label: 'פג תוקף', cls: 'bg-white/10 text-cream/50' },
};

export default async function CustomerDetail({ params }: { params: { email: string } }) {
  const email = decodeURIComponent(params.email);
  const { customer, timeline } = await getCustomer(email);
  if (!customer) notFound();
  const s = STATUS[customer.status];

  return (
    <div className="space-y-6">
      <Link href="/crm/customers" className="inline-flex items-center gap-1.5 text-sm text-cream/50 hover:text-gold">
        <ArrowRight className="h-4 w-4" /> חזרה לרשימת הלקוחות
      </Link>

      {/* Header card */}
      <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
        <div className="flex flex-wrap items-center gap-4">
          <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gold/15 font-display text-xl font-bold text-gold">
            {email.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0 flex-1">
            <h1 className="truncate font-display text-2xl font-bold text-cream" dir="ltr">{email}</h1>
            <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-cream/50">
              <span className={`rounded-full px-2.5 py-0.5 text-xs ${s.cls}`}>{s.label}</span>
              <span>· חבר/ה כבר {customer.daysSinceJoin} ימים</span>
            </div>
          </div>
          <a
            href={`https://wa.me/?text=${encodeURIComponent('שלום מאמונה וביטחון')}`}
            className="rounded-full border border-gold/30 px-4 py-2 text-sm text-cream/80 hover:border-gold hover:text-gold"
          >
            פנייה בוואטסאפ
          </a>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Facts */}
        <div className="space-y-4 lg:col-span-1">
          <Fact icon={Mail} label="אימייל" value={email} ltr />
          <Fact icon={Ticket} label="קוד הטבה" value={customer.couponCode} ltr gold />
          <Fact icon={CalendarDays} label="הצטרפות" value={fmt(customer.createdAt)} />
          <Fact icon={Clock} label="תוקף הטבה" value={fmt(customer.couponExpires)} />
          <Fact
            icon={ShoppingBag}
            label="היסטוריית רכישות"
            value="תתמלא עם חיבור הסליקה"
            muted
          />
        </div>

        {/* Timeline */}
        <div className="rounded-2xl border border-gold/15 bg-white/5 p-6 lg:col-span-2">
          <h2 className="mb-5 font-display text-lg font-bold text-cream">ציר זמן פעילות</h2>
          <ol className="relative space-y-6 border-s border-white/10 ps-6">
            {timeline.map((e, i) => {
              const Icon = e.kind === 'join' ? UserPlus : e.kind === 'coupon' ? CheckCircle2 : Clock;
              return (
                <li key={i} className="relative">
                  <span className="absolute -start-[31px] flex h-6 w-6 items-center justify-center rounded-full border border-gold/30 bg-navy">
                    <Icon className="h-3 w-3 text-gold" />
                  </span>
                  <div className="text-sm text-cream/90">{e.title}</div>
                  <div className="text-xs text-cream/40">{fmt(e.date)}</div>
                </li>
              );
            })}
          </ol>
          <p className="mt-6 rounded-xl border border-gold/15 bg-navy/40 p-3 text-xs text-cream/50">
            רכישות, צפיות ופעילות במאתר המתנה יופיעו כאן אוטומטית עם חיבור הסליקה (מחר) והרצת המיגרציה.
          </p>
        </div>
      </div>
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
  ltr,
  gold,
  muted,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  ltr?: boolean;
  gold?: boolean;
  muted?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-4">
      <div className="mb-1 flex items-center gap-2 text-xs text-cream/40">
        <Icon className="h-3.5 w-3.5" /> {label}
      </div>
      <div
        className={`truncate text-sm ${gold ? 'font-mono text-gold' : muted ? 'text-cream/40' : 'text-cream/90'}`}
        dir={ltr ? 'ltr' : undefined}
      >
        {value}
      </div>
    </div>
  );
}
