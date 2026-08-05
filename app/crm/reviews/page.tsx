import { Star, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { listReviews, getReviewsOverview } from '@/lib/reviews';
import { ReviewModerator } from '@/components/crm/ReviewModerator';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');

export default async function CrmReviewsPage() {
  const [overview, all] = await Promise.all([getReviewsOverview(), listReviews()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-cream">
          <Star className="h-6 w-6 text-gold" /> חוות דעת
        </h1>
        <p className="mt-1 text-sm text-cream/50">אישור/דחיית ביקורות · רק מאושרות מוצגות באתר ונספרות בכוכבי גוגל</p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Clock} label="ממתינות לאישור" value={nf(overview.pending)} tone="amber" />
        <Kpi icon={CheckCircle2} label="מאושרות (חיות)" value={nf(overview.approved)} tone="emerald" />
        <Kpi icon={Star} label="דירוג ממוצע" value={overview.approved > 0 ? overview.avgApproved.toFixed(1) : '—'} tone="gold" />
        <Kpi icon={XCircle} label="נדחו" value={nf(overview.rejected)} tone="red" />
      </div>

      <ReviewModerator initial={all} />
    </div>
  );
}

function Kpi({ icon: Icon, label, value, tone }: { icon: any; label: string; value: string; tone: 'gold' | 'emerald' | 'amber' | 'red' }) {
  const c = { gold: 'text-gold', emerald: 'text-emerald-300', amber: 'text-amber-300', red: 'text-red-300' }[tone];
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-cream/50"><Icon className={`h-4 w-4 ${c}`} /> {label}</div>
      <div className="font-display text-2xl font-bold text-cream">{value}</div>
    </div>
  );
}
