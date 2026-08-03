import { Users, MousePointerClick, Target, Search, TrendingUp, Eye, Zap, BarChart3 } from 'lucide-react';
import { getGoogleData } from '@/lib/crm/google';
import { AreaChart } from '@/components/crm/AreaChart';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');

function Kpi({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm text-cream/60"><Icon className="h-4 w-4 text-gold" /> {label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-cream">{value}</div>
    </div>
  );
}

export default async function AnalyticsPage() {
  const data = await getGoogleData();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">אנליטיקס Google</h1>
        <p className="mt-1 text-sm text-cream/50">
          {data.configured ? 'נתונים חיים · GA4 + Search Console · 30 ימים' : 'ממתין לחיבור חשבונות Google'}
        </p>
      </div>

      {/* GA4 */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-cream"><BarChart3 className="h-5 w-5 text-gold" /> תנועה באתר (GA4)</h2>
        {data.ga4 ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Kpi icon={Users} label="משתמשים (30 ימים)" value={nf(data.ga4.users30d)} />
              <Kpi icon={TrendingUp} label="ביקורים" value={nf(data.ga4.sessions30d)} />
              <Kpi icon={Target} label="המרות" value={nf(data.ga4.conversions30d)} />
            </div>
            <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
              <div className="mb-3 text-sm text-cream/60">משתמשים ליום</div>
              <AreaChart data={data.ga4.usersTrend} height={110} />
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <TopList title="עמודים מובילים" rows={data.ga4.topPages} />
              <TopList title="מקורות תנועה" rows={data.ga4.topSources} />
            </div>
          </div>
        ) : (
          <NotConnected which="ga4" />
        )}
      </section>

      {/* Search Console */}
      <section>
        <h2 className="mb-3 flex items-center gap-2 font-display text-lg font-bold text-cream"><Search className="h-5 w-5 text-gold" /> חיפוש אורגני (Search Console)</h2>
        {data.gsc ? (
          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-4">
              <Kpi icon={MousePointerClick} label="קליקים" value={nf(data.gsc.clicks)} />
              <Kpi icon={Eye} label="חשיפות" value={nf(data.gsc.impressions)} />
              <Kpi icon={Target} label="CTR" value={`${(data.gsc.ctr * 100).toFixed(1)}%`} />
              <Kpi icon={TrendingUp} label="מיקום ממוצע" value={String(data.gsc.position)} />
            </div>
            <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
              <div className="mb-3 text-sm text-cream/60">קליקים ליום</div>
              <AreaChart data={data.gsc.clicksTrend} height={110} />
            </div>
            <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
              <div className="mb-3 text-sm text-cream/60">מילות חיפוש מובילות</div>
              <div className="space-y-1.5">
                {data.gsc.topQueries.map((q) => (
                  <div key={q.label} className="flex items-center justify-between border-b border-white/5 py-1.5 text-sm">
                    <span className="text-cream/80">{q.label}</span>
                    <span className="flex items-center gap-4 text-xs text-cream/50">
                      <span>{nf(q.clicks)} קליקים</span>
                      <span>{nf(q.impressions)} חשיפות</span>
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <NotConnected which="gsc" />
        )}
      </section>
    </div>
  );
}

function TopList({ title, rows }: { title: string; rows: { label: string; count: number }[] }) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="mb-3 text-sm text-cream/60">{title}</div>
      <div className="space-y-1.5">
        {rows.map((r) => (
          <div key={r.label} className="flex items-center justify-between border-b border-white/5 py-1.5 text-sm">
            <span className="truncate pe-3 text-cream/80">{r.label}</span>
            <span className="text-cream/50">{r.count.toLocaleString('he-IL')}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function NotConnected({ which }: { which: 'ga4' | 'gsc' }) {
  return (
    <div className="rounded-xl border border-gold/20 bg-navy/40 p-5 text-sm leading-relaxed text-cream/70">
      <div className="mb-2 flex items-center gap-2 font-bold text-gold"><Zap className="h-4 w-4" /> לחיבור נתונים חיים</div>
      <p>חיבור חד-פעמי דרך Service Account של Google (שלך — לעולם לא בצ'אט):</p>
      <ol className="mt-2 list-decimal space-y-1 pe-5 text-cream/60">
        <li>ב-Google Cloud צור Service Account והורד מפתח JSON. הפעל Analytics Data API + Search Console API.</li>
        {which === 'ga4' ? (
          <li>ב-GA4 → Admin → Property Access → הוסף את מייל ה-Service Account כ-Viewer.</li>
        ) : (
          <li>ב-Search Console → Settings → Users → הוסף את מייל ה-Service Account (Restricted).</li>
        )}
        <li>הוסף ב-Vercel (Server-only): <code className="text-gold" dir="ltr">GOOGLE_SERVICE_ACCOUNT_EMAIL</code>, <code className="text-gold" dir="ltr">GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY</code>, {which === 'ga4' ? <code className="text-gold" dir="ltr">GA4_PROPERTY_ID</code> : <code className="text-gold" dir="ltr">GSC_SITE_URL</code>}.</li>
      </ol>
    </div>
  );
}
