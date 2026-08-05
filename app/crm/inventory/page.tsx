import { Boxes, PackageCheck, AlertTriangle, PackageX, TrendingDown, Activity } from 'lucide-react';
import { listInventory, getInventoryStats } from '@/lib/crm/inventory';
import { InventoryManager } from '@/components/crm/InventoryManager';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');

function Kpi({ icon: Icon, label, value, sub, tone }: { icon: any; label: string; value: string; sub?: string; tone?: 'emerald' | 'amber' | 'red' | 'gold' }) {
  const c = tone === 'emerald' ? 'text-emerald-300' : tone === 'amber' ? 'text-amber-300' : tone === 'red' ? 'text-red-300' : 'text-gold';
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="flex items-center gap-2 text-sm text-cream/60"><Icon className={`h-4 w-4 ${c}`} /> {label}</div>
      <div className="mt-2 font-display text-3xl font-bold text-cream" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      {sub && <div className="mt-1 text-xs text-cream/40">{sub}</div>}
    </div>
  );
}

export default async function InventoryPage() {
  const [items, stats] = await Promise.all([listInventory('', 'all', 400), getInventoryStats()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">ניהול מלאי</h1>
        <p className="mt-1 text-sm text-cream/50">
          מלאי פנימי לניהול הסחורה שלך — נפרד לחלוטין מהאתר. המלאי יורד אוטומטית רק בהפקת קבלה סופית ללקוח.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        <Kpi icon={Boxes} label="סה״כ יחידות במלאי" value={nf(stats.totalUnits)} tone="gold" />
        <Kpi icon={PackageCheck} label="מוצרים במעקב" value={nf(stats.tracked)} sub={`מתוך ${nf(stats.catalogSize)} בקטלוג`} />
        <Kpi icon={AlertTriangle} label="מלאי נמוך" value={nf(stats.low)} sub="1–3 יחידות" tone="amber" />
        <Kpi icon={PackageX} label="אזל (0)" value={nf(stats.zero)} />
        <Kpi icon={TrendingDown} label="מלאי שלילי" value={nf(stats.negative)} sub="דורש בדיקה" tone="red" />
        <Kpi icon={Activity} label="נמכר היום" value={nf(stats.salesTodayUnits)} sub={`${nf(stats.movementsToday)} תנועות`} tone="emerald" />
      </div>

      <InventoryManager initialItems={items} />
    </div>
  );
}
