'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Loader2, ChevronLeft, Download, SlidersHorizontal, ArrowUpDown } from 'lucide-react';
import { QuickEditProduct } from './QuickEditProduct';

export interface InvV2RowClient {
  sku: string; supplierCode: string | null; barcode: string | null; name: string;
  internalDescription: string | null;
  category: string; supplierName: string | null; brand: string | null; image?: string;
  warehouseLocation: string | null;
  quantityOnHand: number; quantityGood: number; quantityDamaged: number; minimumStock: number | null;
  lastPurchaseCost: number | null; landedCost: number | null; retailPrice: number | null; clubPrice: number | null;
  profitAmount: number | null; profitMarginPercent: number | null; markupPercent: number | null;
  inventoryValueAtCost: number | null; inventoryValueAtRetail: number | null;
  lastReceivedAt: string | null; lastSoldAt: string | null; status: string; inCatalog: boolean;
  missingImage: boolean; missingCost: boolean; missingRetail: boolean;
}
export interface InvV2KpisClient {
  totalProducts: number; totalUnits: number; valueAtCost: number; valueAtRetail: number; potentialProfit: number;
  lowStock: number; zeroStock: number; negativeStock: number; damaged: number;
  missingImage: number; missingCost: number; missingRetail: number; pendingSupplierInvoices: number; unmatchedLines: number;
}

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number | null) => (n != null ? `₪${nf(Math.round(n))}` : '—');
const money0 = (n: number) => `₪${nf(Math.round(n))}`;
const pct = (n: number | null) => (n != null ? `${n}%` : '—');
const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');

type Col = { key: string; label: string; def: boolean; get: (r: InvV2RowClient) => string | number; render?: (r: InvV2RowClient) => React.ReactNode; num?: boolean };

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'הכל' }, { key: 'tracked', label: 'במעקב' }, { key: 'low', label: 'מלאי נמוך' },
  { key: 'zero', label: 'אפס' }, { key: 'negative', label: 'שלילי' }, { key: 'damaged', label: 'פגום' },
  { key: 'no_image', label: 'ללא תמונה' }, { key: 'no_cost', label: 'ללא עלות' }, { key: 'no_retail', label: 'ללא מחיר' },
];

function qtyCls(q: number) {
  return q < 0 ? 'text-red-300' : q === 0 ? 'text-cream/40' : q <= 3 ? 'text-amber-300' : 'text-emerald-300';
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: 'gold' | 'red' | 'amber' | 'emerald' }) {
  const c = tone === 'gold' ? 'text-gold' : tone === 'red' ? 'text-red-300' : tone === 'amber' ? 'text-amber-300' : tone === 'emerald' ? 'text-emerald-300' : 'text-cream';
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 px-3.5 py-3">
      <div className="text-[11px] leading-tight text-cream/45">{label}</div>
      <div className={`mt-1 text-lg font-bold ${c}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{value}</div>
    </div>
  );
}

export function InventoryCenter({ initialRows, initialKpis }: { initialRows: InvV2RowClient[]; initialKpis: InvV2KpisClient }) {
  const [rows, setRows] = useState(initialRows);
  const [kpis, setKpis] = useState(initialKpis);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);
  const [sortKey, setSortKey] = useState<string>('quantityOnHand');
  const [sortDir, setSortDir] = useState<1 | -1>(1);
  const [showCols, setShowCols] = useState(false);

  const COLS: Col[] = useMemo(() => [
    { key: 'name', label: 'שם המוצר', def: true, get: (r) => r.name, render: (r) => (
      <div className="flex items-center gap-2.5">
        <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white">
          {r.image ? <Image src={r.image} alt="" fill className="object-contain p-0.5" sizes="40px" unoptimized={r.image.startsWith('data:')} /> : <span className="flex h-full items-center justify-center text-base">🎁</span>}
        </span>
        <span className="line-clamp-2 max-w-[20rem] text-cream/90">{r.name}</span>
      </div>) },
    { key: 'supplierCode', label: 'קוד ספק', def: true, get: (r) => r.supplierCode ?? '', render: (r) => <span className="font-mono text-xs text-cream/60" dir="ltr">{r.supplierCode ?? '—'}</span> },
    { key: 'sku', label: 'SKU', def: false, get: (r) => r.sku, render: (r) => <span className="font-mono text-xs text-cream/50" dir="ltr">{r.sku}</span> },
    { key: 'barcode', label: 'ברקוד', def: false, get: (r) => r.barcode ?? '', render: (r) => <span className="font-mono text-xs text-cream/50" dir="ltr">{r.barcode ?? '—'}</span> },
    { key: 'supplierName', label: 'ספק', def: false, get: (r) => r.supplierName ?? '', render: (r) => <span className="text-xs text-cream/60">{r.supplierName ?? '—'}</span> },
    { key: 'category', label: 'קטגוריה', def: true, get: (r) => r.category, render: (r) => <span className="text-xs text-cream/60">{r.category}</span> },
    { key: 'warehouseLocation', label: 'מיקום', def: false, get: (r) => r.warehouseLocation ?? '', render: (r) => <span className="text-xs text-cream/50">{r.warehouseLocation ?? '—'}</span> },
    { key: 'quantityOnHand', label: 'מלאי פיזי', def: true, num: true, get: (r) => r.quantityOnHand, render: (r) => <span className={`font-bold ${qtyCls(r.quantityOnHand)}`}>{nf(r.quantityOnHand)}</span> },
    { key: 'quantityGood', label: 'תקין', def: true, num: true, get: (r) => r.quantityGood, render: (r) => <span className="text-emerald-300/90">{nf(r.quantityGood)}</span> },
    { key: 'quantityDamaged', label: 'פגום', def: true, num: true, get: (r) => r.quantityDamaged, render: (r) => <span className={r.quantityDamaged > 0 ? 'text-red-300' : 'text-cream/30'}>{nf(r.quantityDamaged)}</span> },
    { key: 'minimumStock', label: 'מינ׳', def: false, num: true, get: (r) => r.minimumStock ?? -1, render: (r) => <span className="text-cream/50">{r.minimumStock != null ? nf(r.minimumStock) : '—'}</span> },
    { key: 'lastPurchaseCost', label: 'עלות אחרונה', def: false, num: true, get: (r) => r.lastPurchaseCost ?? -1, render: (r) => <span className="text-cream/70">{money(r.lastPurchaseCost)}</span> },
    { key: 'landedCost', label: 'עלות (כולל מע״מ)', def: true, num: true, get: (r) => r.landedCost ?? -1, render: (r) => r.landedCost != null ? <span className="text-cream/80">{money(r.landedCost)}</span> : <span className="text-amber-300/70 text-xs">חסרה עלות</span> },
    { key: 'retailPrice', label: 'מחיר לצרכן', def: true, num: true, get: (r) => r.retailPrice ?? -1, render: (r) => r.retailPrice != null ? <span className="text-cream">{money(r.retailPrice)}</span> : <span className="text-amber-300/70 text-xs">חסר מחיר</span> },
    { key: 'clubPrice', label: 'מחיר חבר', def: false, num: true, get: (r) => r.clubPrice ?? -1, render: (r) => <span className="text-cream/70">{r.clubPrice != null ? money(r.clubPrice) : 'לא הוגדר'}</span> },
    { key: 'profitAmount', label: 'רווח ליח׳', def: true, num: true, get: (r) => r.profitAmount ?? -99999, render: (r) => r.profitAmount != null ? <span className="text-emerald-300">{money(r.profitAmount)}</span> : <span className="text-cream/30">—</span> },
    { key: 'profitMarginPercent', label: 'מרווח', def: true, num: true, get: (r) => r.profitMarginPercent ?? -999, render: (r) => <span className="text-emerald-300/80">{pct(r.profitMarginPercent)}</span> },
    { key: 'inventoryValueAtCost', label: 'שווי מלאי', def: true, num: true, get: (r) => r.inventoryValueAtCost ?? -1, render: (r) => <span className="text-gold/90">{money(r.inventoryValueAtCost)}</span> },
    { key: 'lastReceivedAt', label: 'כניסה אחרונה', def: false, get: (r) => r.lastReceivedAt ?? '', render: (r) => <span className="text-xs text-cream/50">{fmtDate(r.lastReceivedAt)}</span> },
    { key: 'lastSoldAt', label: 'מכירה אחרונה', def: false, get: (r) => r.lastSoldAt ?? '', render: (r) => <span className="text-xs text-cream/50">{fmtDate(r.lastSoldAt)}</span> },
    { key: 'status', label: 'סטטוס', def: false, get: (r) => r.status, render: (r) => <span className="rounded-full bg-white/10 px-2 py-0.5 text-[11px] text-cream/70">{r.inCatalog ? 'בקטלוג' : 'לא בקטלוג'}</span> },
  ], []);

  const [visible, setVisible] = useState<Record<string, boolean>>(() => Object.fromEntries(COLS.map((c) => [c.key, c.def])));

  const load = useCallback(async (s: string, f: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/inventory-v2?search=${encodeURIComponent(s)}&filter=${f}`);
      const data = await res.json();
      if (data.ok) { setRows(data.rows); setKpis(data.kpis); }
    } catch { /* keep */ } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const t = setTimeout(() => { if (search !== '' || filter !== 'all') load(search, filter); else setRows(initialRows); }, 300);
    return () => clearTimeout(t);
  }, [search, filter, load, initialRows]);

  const sorted = useMemo(() => {
    const col = COLS.find((c) => c.key === sortKey);
    if (!col) return rows;
    return [...rows].sort((a, b) => {
      const av = col.get(a), bv = col.get(b);
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * sortDir;
      return String(av).localeCompare(String(bv), 'he') * sortDir;
    });
  }, [rows, sortKey, sortDir, COLS]);

  const toggleSort = (key: string) => {
    if (sortKey === key) setSortDir((d) => (d === 1 ? -1 : 1));
    else { setSortKey(key); setSortDir(1); }
  };

  const exportCsv = () => {
    const cols = COLS.filter((c) => visible[c.key]);
    const header = cols.map((c) => c.label).join(',');
    const lines = sorted.map((r) => cols.map((c) => `"${String(c.get(r)).replace(/"/g, '""')}"`).join(','));
    const csv = '﻿' + [header, ...lines].join('\n');
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a'); a.href = url; a.download = `inventory-${new Date().toISOString().slice(0, 10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const shown = COLS.filter((c) => visible[c.key]);

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-6">
        <Kpi label="סך מוצרים" value={nf(kpis.totalProducts)} />
        <Kpi label="סך יחידות במלאי" value={nf(kpis.totalUnits)} />
        <Kpi label="שווי מלאי (עלות)" value={money0(kpis.valueAtCost)} tone="gold" />
        <Kpi label="שווי מלאי (מכירה)" value={money0(kpis.valueAtRetail)} />
        <Kpi label="רווח פוטנציאלי" value={money0(kpis.potentialProfit)} tone="emerald" />
        <Kpi label="מלאי נמוך" value={nf(kpis.lowStock)} tone="amber" />
        <Kpi label="מלאי 0" value={nf(kpis.zeroStock)} />
        <Kpi label="מלאי שלילי" value={nf(kpis.negativeStock)} tone="red" />
        <Kpi label="פגומים" value={nf(kpis.damaged)} tone="red" />
        <Kpi label="ללא תמונה" value={nf(kpis.missingImage)} tone="amber" />
        <Kpi label="ללא עלות" value={nf(kpis.missingCost)} tone="amber" />
        <Kpi label="ללא מחיר מכירה" value={nf(kpis.missingRetail)} tone="amber" />
      </div>

      {/* Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="relative lg:max-w-sm lg:flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש: שם, קוד ספק, SKU, ברקוד, ספק…"
            className="w-full rounded-xl border border-gold/20 bg-[#0B132B] px-3.5 py-2.5 pe-9 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-gold/60" dir="auto" />
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <button onClick={() => setShowCols((s) => !s)} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-cream/70 hover:bg-white/5">
              <SlidersHorizontal className="h-3.5 w-3.5" /> עמודות
            </button>
            {showCols && (
              <div className="absolute end-0 z-20 mt-1 max-h-80 w-52 overflow-auto rounded-xl border border-gold/20 bg-[#0B132B] p-2 shadow-xl">
                {COLS.map((c) => (
                  <label key={c.key} className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs text-cream/80 hover:bg-white/5">
                    <input type="checkbox" checked={!!visible[c.key]} onChange={() => setVisible((v) => ({ ...v, [c.key]: !v[c.key] }))} className="accent-gold" />
                    {c.label}
                  </label>
                ))}
              </div>
            )}
          </div>
          <button onClick={exportCsv} className="inline-flex items-center gap-1.5 rounded-xl border border-white/10 px-3 py-2 text-xs text-cream/70 hover:bg-white/5">
            <Download className="h-3.5 w-3.5" /> CSV
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5">
        {FILTERS.map((f) => (
          <button key={f.key} onClick={() => setFilter(f.key)}
            className={'rounded-full px-3.5 py-1.5 text-xs transition-colors ' + (filter === f.key ? 'bg-gold/15 font-bold text-gold' : 'text-cream/60 hover:bg-white/5')}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-sm font-medium text-cream/70">
          <span>{nf(sorted.length)} מוצרים</span>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gold/60" />}
        </div>
        {sorted.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-cream/40">לא נמצאו מוצרים</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr className="text-right text-xs text-cream/40">
                  {shown.map((c) => (
                    <th key={c.key} className="whitespace-nowrap px-3 py-2.5 font-medium">
                      <button onClick={() => toggleSort(c.key)} className="inline-flex items-center gap-1 hover:text-gold">
                        {c.label}<ArrowUpDown className={`h-3 w-3 ${sortKey === c.key ? 'text-gold' : 'text-cream/20'}`} />
                      </button>
                    </th>
                  ))}
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((r) => (
                  <tr key={r.sku} className="border-t border-white/5 hover:bg-white/5">
                    {shown.map((c) => (
                      <td key={c.key} className="whitespace-nowrap px-3 py-2.5">{c.render ? c.render(r) : String(c.get(r))}</td>
                    ))}
                    <td className="px-5 py-2.5 text-left">
                      <div className="flex items-center justify-end gap-1">
                        <QuickEditProduct sku={r.sku} name={r.name} description={r.internalDescription} retailPrice={r.retailPrice} image={r.image} compact />
                        <Link href={`/crm/inventory-v2/${encodeURIComponent(r.sku)}`} className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80">
                          ניהול <ChevronLeft className="h-3.5 w-3.5" />
                        </Link>
                      </div>
                    </td>
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
