import { ShoppingCart, ExternalLink, CheckCircle2, AlertTriangle, Clock, Package, ImageIcon, Boxes, TrendingUp, PlugZap, Copy } from 'lucide-react';
import { PRODUCTS } from '@/lib/catalog';
import { buildFeedItems, validateFeed, SITE_URL, FEED_PATH } from '@/lib/google-merchant/feed';
import { fetchMerchantDiagnostics, MERCHANT_ID } from '@/lib/crm/merchant-api';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const MC_URL = `https://merchants.google.com/mc/overview?a=${MERCHANT_ID}`;

export default async function MerchantPage() {
  const items = buildFeedItems();
  const total = PRODUCTS.length;
  const { issues, duplicates } = validateFeed(items);

  const availability = items.reduce<Record<string, number>>((a, it) => { a[it.availability] = (a[it.availability] ?? 0) + 1; return a; }, {});
  const prices = items.map((it) => parseFloat(it.price)).filter((n) => n > 0);
  const priceMin = prices.length ? Math.min(...prices) : 0;
  const priceMax = prices.length ? Math.max(...prices) : 0;
  const priceAvg = prices.length ? Math.round(prices.reduce((s, n) => s + n, 0) / prices.length) : 0;
  const remoteImages = items.filter((it) => /israel-judaica\.com/.test(it.imageLink)).length;

  const cats = items.reduce<Record<string, number>>((a, it) => {
    const c = it.productType.split(' > ')[1] ?? 'אחר';
    a[c] = (a[c] ?? 0) + 1; return a;
  }, {});
  const catRows = Object.entries(cats).sort((a, b) => b[1] - a[1]);

  const diag = await fetchMerchantDiagnostics();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 font-display text-2xl font-bold text-cream">
            <ShoppingCart className="h-6 w-6 text-gold" /> Google Shopping
          </h1>
          <p className="mt-1 text-sm text-cream/50">Merchant ID {MERCHANT_ID} · פיד אוטומטי · Free Listings</p>
        </div>
        <a href={MC_URL} target="_blank" rel="noopener" className="flex items-center gap-1.5 rounded-full border border-gold/40 px-4 py-2 text-sm font-medium text-cream hover:bg-gold/10">
          פתיחת Merchant Center <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* KPI — feed side (always) */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={Boxes} label="מוצרים בפיד" value={nf(items.length)} sub={`מתוך ${nf(total)} בקטלוג`} tone="gold" />
        <Kpi icon={CheckCircle2} label="במלאי" value={nf(availability['in_stock'] ?? 0)} sub={`${nf(availability['preorder'] ?? 0)} בהזמנה מוקדמת`} tone="emerald" />
        <Kpi icon={issues.length || duplicates.length ? AlertTriangle : CheckCircle2} label="בריאות הפיד" value={issues.length || duplicates.length ? `${issues.length + duplicates.length} בעיות` : 'תקין'} sub={`${duplicates.length} כפילויות`} tone={issues.length || duplicates.length ? 'amber' : 'emerald'} />
        <Kpi icon={Package} label="טווח מחירים" value={`₪${nf(priceMin)}–${nf(priceMax)}`} sub={`ממוצע ₪${nf(priceAvg)}`} tone="gold" />
      </div>

      {/* Google-side status */}
      {diag.connected ? (
        <div className="rounded-2xl border border-gold/15 bg-white/5 p-6">
          <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-bold text-cream"><TrendingUp className="h-5 w-5 text-gold" /> סטטוס המוצרים ב-Google</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <StatusPill icon={CheckCircle2} label="אושרו" value={diag.totals.approved} tone="emerald" />
            <StatusPill icon={Clock} label="בבדיקה" value={diag.totals.pending} tone="amber" />
            <StatusPill icon={AlertTriangle} label="נפסלו" value={diag.totals.disapproved} tone="red" />
          </div>
          {diag.topIssues.length > 0 && (
            <div className="mt-5">
              <h3 className="mb-2 text-sm font-medium text-cream/60">בעיות מובילות (Diagnostics)</h3>
              <div className="divide-y divide-white/5 rounded-xl border border-white/10">
                {diag.topIssues.map((i, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm">
                    <span className="min-w-0 truncate text-cream/85">{i.description}</span>
                    <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs ${i.servability === 'disapproved' ? 'bg-red-400/15 text-red-300' : 'bg-amber-400/15 text-amber-300'}`}>{nf(i.numItems)} מוצרים</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <ConnectCard diag={diag} />
      )}

      {/* Category breakdown + feed meta */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-gold/15 bg-white/5 p-6 lg:col-span-2">
          <h2 className="mb-4 font-display text-lg font-bold text-cream">פילוח לפי קטגוריה</h2>
          <div className="space-y-2">
            {catRows.map(([name, count]) => {
              const pct = Math.round((count / items.length) * 100);
              return (
                <div key={name} className="text-sm">
                  <div className="mb-1 flex justify-between text-cream/80"><span>{name}</span><span className="text-cream/50">{nf(count)} · {pct}%</span></div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/5"><div className="h-full rounded-full bg-gradient-to-l from-gold to-gold-soft" style={{ width: `${Math.max(pct, 2)}%` }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="space-y-3">
          <MetaRow icon={ExternalLink} label="כתובת הפיד" value={<a href={`${SITE_URL}${FEED_PATH}`} target="_blank" rel="noopener" className="text-gold hover:underline" dir="ltr">google-merchant.xml</a>} />
          <MetaRow icon={ImageIcon} label="תמונות מרוחקות" value={`${nf(remoteImages)} · ${nf(items.length - remoteImages)} מקומיות`} />
          <MetaRow icon={Boxes} label="מקור אמת" value="קטלוג האתר (799 מוצרים)" />
          <MetaRow icon={Clock} label="עדכון פיד" value="אוטומטי · יומי 0:00" />
        </div>
      </div>
    </div>
  );
}

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone: 'gold' | 'emerald' | 'amber' | 'red' }) {
  const c = { gold: 'text-gold', emerald: 'text-emerald-300', amber: 'text-amber-300', red: 'text-red-300' }[tone];
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-cream/50"><Icon className={`h-4 w-4 ${c}`} /> {label}</div>
      <div className="font-display text-2xl font-bold text-cream">{value}</div>
      {sub && <div className="mt-0.5 text-[11px] text-cream/40">{sub}</div>}
    </div>
  );
}

function StatusPill({ icon: Icon, label, value, tone }: { icon: any; label: string; value: number; tone: 'emerald' | 'amber' | 'red' }) {
  const c = { emerald: 'border-emerald-400/20 text-emerald-300', amber: 'border-amber-400/20 text-amber-300', red: 'border-red-400/20 text-red-300' }[tone];
  return (
    <div className={`rounded-xl border bg-white/5 p-4 text-center ${c}`}>
      <Icon className="mx-auto mb-1 h-5 w-5" />
      <div className="font-display text-2xl font-bold text-cream">{nf(value)}</div>
      <div className="text-xs text-cream/50">{label}</div>
    </div>
  );
}

function MetaRow({ icon: Icon, label, value }: { icon: any; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-gold/15 bg-white/5 px-4 py-3 text-sm">
      <span className="flex items-center gap-2 text-cream/50"><Icon className="h-4 w-4 text-gold/70" /> {label}</span>
      <span className="text-cream/90">{value}</span>
    </div>
  );
}

function ConnectCard({ diag }: { diag: Awaited<ReturnType<typeof fetchMerchantDiagnostics>> }) {
  const err =
    diag.error === 'no-token' ? 'חשבון-השירות לא מוגדר בשרת.' :
    diag.error === 'no-access' ? 'חשבון-השירות עדיין לא קיבל גישה ל-Merchant Center.' :
    diag.error?.startsWith('http') ? `שגיאת API: ${diag.error}` : null;
  return (
    <div className="rounded-2xl border border-gold/25 bg-navy/40 p-6">
      <h2 className="mb-1 flex items-center gap-2 font-display text-lg font-bold text-gold"><PlugZap className="h-5 w-5" /> חיבור נתונים חיים מ-Google</h2>
      <p className="mb-4 text-sm text-cream/60">כדי למשוך סטטוס אישור/פסילה ו-Diagnostics ישירות מ-Google — 2 פעולות חד-פעמיות:</p>
      <ol className="space-y-3 text-sm text-cream/85">
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">1</span>
          <div>
            <div className="font-medium text-cream">להפעיל את Content API for Shopping</div>
            <div className="text-cream/55">ב-Google Cloud Console → APIs → חיפוש "Content API for Shopping" → Enable.</div>
          </div>
        </li>
        <li className="flex gap-3">
          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold/15 text-xs font-bold text-gold">2</span>
          <div>
            <div className="font-medium text-cream">להוסיף את חשבון-השירות כמשתמש ב-Merchant Center</div>
            <div className="text-cream/55">Merchant Center → הגדרות → משתמשים → הוספת משתמש → הדבק את המייל למטה (הרשאת "רגיל"/Standard).</div>
            {diag.serviceAccount ? (
              <code className="mt-2 flex items-center gap-2 break-all rounded-lg border border-white/10 bg-navy/60 px-3 py-2 text-xs text-gold" dir="ltr">
                <Copy className="h-3.5 w-3.5 shrink-0" /> {diag.serviceAccount}
              </code>
            ) : (
              <div className="mt-2 text-xs text-amber-300">המייל של חשבון-השירות לא זמין בשרת.</div>
            )}
          </div>
        </li>
      </ol>
      {err && <div className="mt-4 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-300">סטטוס נוכחי: {err}</div>}
      <p className="mt-4 text-xs text-cream/40">עד לחיבור — הנתונים למעלה מגיעים מהפיד שלנו (מקור האמת). לאחר החיבור יופיעו כאן אישורים/פסילות מ-Google אוטומטית.</p>
    </div>
  );
}
