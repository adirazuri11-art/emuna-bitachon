import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ChevronRight } from 'lucide-react';
import { getInventoryItem, MOVEMENT_LABELS, type MovementType } from '@/lib/crm/inventory';
import { StockAdjuster } from '@/components/crm/StockAdjuster';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number | null) => (n != null ? `₪${nf(Math.round(n))}` : '—');
const fmtDateTime = (iso: string) => (iso ? new Date(iso).toLocaleString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' }) : '—');

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3.5">
      <div className="text-xs text-cream/40">{label}</div>
      <div className="mt-1 text-lg font-bold text-cream" style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export default async function InventoryItemPage({ params }: { params: { sku: string } }) {
  const item = await getInventoryItem(decodeURIComponent(params.sku));
  if (!item) notFound();
  const q = item.quantityOnHand;
  const qtyColor = q < 0 ? 'text-red-300' : q === 0 ? 'text-cream/50' : q <= 3 ? 'text-amber-300' : 'text-emerald-300';

  return (
    <div className="space-y-6">
      <Link href="/crm/inventory" className="inline-flex items-center gap-1 text-sm text-cream/50 hover:text-gold">
        <ChevronRight className="h-4 w-4" /> חזרה לניהול מלאי
      </Link>

      {/* כותרת המוצר */}
      <div className="flex flex-col gap-5 rounded-2xl border border-gold/15 bg-white/5 p-5 sm:flex-row">
        <span className="relative h-32 w-32 shrink-0 overflow-hidden rounded-xl border border-white/10 bg-white">
          {item.image ? <Image src={item.image} alt={item.title} fill className="object-contain p-1" sizes="128px" /> : <span className="flex h-full items-center justify-center text-3xl">🎁</span>}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-xl font-bold text-cream">{item.title}</h1>
          <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-cream/50">
            <span>קוד ספק: <span className="font-mono text-cream/70" dir="ltr">{item.sku}</span></span>
            <span>קטגוריה: {item.category}</span>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-sm text-cream/50">מלאי נוכחי:</span>
            <span className={`font-display text-4xl font-bold ${qtyColor}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{nf(q)}</span>
            {q < 0 && <span className="rounded-full bg-red-500/15 px-2.5 py-0.5 text-xs font-medium text-red-300">מלאי שלילי — דורש בדיקה</span>}
          </div>
        </div>
      </div>

      {/* נתונים */}
      <div className="grid gap-3 grid-cols-2 lg:grid-cols-4">
        <Stat label="סה״כ נכנס" value={nf(item.totalReceived)} />
        <Stat label="סה״כ נמכר" value={nf(item.totalSold)} />
        <Stat label="מחיר רכישה אחרון" value={money(item.lastPurchasePrice)} />
        <Stat label="עלות ממוצעת" value={money(item.avgCost)} />
      </div>

      <StockAdjuster sku={item.sku} />

      {/* היסטוריית תנועות */}
      <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
        <div className="border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70">היסטוריית תנועות מלאי</div>
        {item.movements.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-cream/40">עדיין אין תנועות מלאי למוצר זה</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr className="text-right text-xs text-cream/40">
                  <th className="px-5 py-2.5 font-medium">תאריך</th>
                  <th className="px-3 py-2.5 font-medium">סוג</th>
                  <th className="px-3 py-2.5 font-medium">שינוי</th>
                  <th className="px-3 py-2.5 font-medium">לפני</th>
                  <th className="px-3 py-2.5 font-medium">אחרי</th>
                  <th className="px-3 py-2.5 font-medium">מסמך</th>
                  <th className="px-5 py-2.5 font-medium">סיבה / ע״י</th>
                </tr>
              </thead>
              <tbody>
                {item.movements.map((m) => (
                  <tr key={m.id} className="border-t border-white/5">
                    <td className="px-5 py-2.5 text-xs text-cream/50">{fmtDateTime(m.createdAt)}</td>
                    <td className="px-3 py-2.5 text-cream/80">{MOVEMENT_LABELS[m.type as MovementType] ?? m.type}</td>
                    <td className={'px-3 py-2.5 font-bold ' + (m.change >= 0 ? 'text-emerald-300' : 'text-red-300')}>{m.change >= 0 ? '+' : ''}{nf(m.change)}</td>
                    <td className="px-3 py-2.5 text-cream/50">{nf(m.before)}</td>
                    <td className="px-3 py-2.5 text-cream/80">{nf(m.after)}</td>
                    <td className="px-3 py-2.5 text-xs text-cream/40" dir="ltr">{m.sourceDocument ?? '—'}</td>
                    <td className="px-5 py-2.5 text-xs text-cream/50">{m.reason ?? '—'}{m.createdBy ? ` · ${m.createdBy}` : ''}</td>
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
