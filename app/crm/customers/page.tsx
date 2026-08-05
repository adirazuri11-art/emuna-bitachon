import Link from 'next/link';
import { Users, ArrowLeft } from 'lucide-react';
import { getAllCustomers, getClubStats } from '@/lib/crm/data';
import { SearchBox } from './SearchBox';

export const dynamic = 'force-dynamic';

const fmt = (iso: string) =>
  new Date(iso).toLocaleDateString('he-IL', { timeZone: 'Asia/Jerusalem', day: 'numeric', month: 'short', year: 'numeric' });

const initials = (email: string) => email.replace(/[^a-zA-Z֐-׿]/g, '').slice(0, 2).toUpperCase() || '#';

const STATUS: Record<string, { label: string; cls: string }> = {
  active: { label: 'הטבה פעילה', cls: 'bg-gold/15 text-gold' },
  used: { label: 'מומש', cls: 'bg-emerald-500/15 text-emerald-300' },
  expired: { label: 'פג תוקף', cls: 'bg-white/10 text-cream/50' },
};

export default async function CustomersPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q ?? '';
  const [customers, stats] = await Promise.all([getAllCustomers(q, 300), getClubStats()]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream">לקוחות</h1>
          <p className="mt-1 text-sm text-cream/50">
            {q ? `${customers.length} תוצאות עבור "${q}"` : `${stats.total} חברי מועדון · ${stats.activeCoupon} עם הטבה פעילה`}
          </p>
        </div>
        <SearchBox />
      </div>

      <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
        {customers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-14 text-center text-cream/40">
            <Users className="h-8 w-8" />
            {q ? 'לא נמצאו לקוחות תואמים' : 'אין עדיין לקוחות'}
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-cream/50">
                <th className="px-5 py-3 text-start font-medium">לקוח</th>
                <th className="px-5 py-3 text-start font-medium">קוד הטבה</th>
                <th className="px-5 py-3 text-start font-medium">סטטוס</th>
                <th className="px-5 py-3 text-start font-medium">הצטרף</th>
                <th className="px-5 py-3 text-start font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => {
                const s = STATUS[c.status];
                return (
                  <tr key={c.couponCode} className="group border-b border-white/5 transition-colors hover:bg-white/5">
                    <td className="px-5 py-3">
                      <Link href={`/crm/customers/${encodeURIComponent(c.email)}`} className="flex items-center gap-3">
                        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">
                          {initials(c.email)}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate text-cream/90" dir="ltr">{c.email}</span>
                          <span className="text-xs text-cream/40">חבר/ה כבר {c.daysSinceJoin} ימים</span>
                        </span>
                      </Link>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-gold" dir="ltr">{c.couponCode}</td>
                    <td className="px-5 py-3">
                      <span className={`rounded-full px-2.5 py-0.5 text-xs ${s.cls}`}>{s.label}</span>
                    </td>
                    <td className="px-5 py-3 text-cream/60">{fmt(c.createdAt)}</td>
                    <td className="px-5 py-3 text-end">
                      <Link
                        href={`/crm/customers/${encodeURIComponent(c.email)}`}
                        className="inline-flex items-center gap-1 text-xs text-cream/40 opacity-0 transition-opacity group-hover:opacity-100 hover:text-gold"
                      >
                        כרטיס לקוח <ArrowLeft className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
