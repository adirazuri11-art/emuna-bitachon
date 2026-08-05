'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Search, Loader2, ChevronLeft, PackageX, AlertTriangle } from 'lucide-react';

export interface InvItemClient {
  sku: string;
  title: string;
  image?: string;
  category: string;
  quantityOnHand: number;
  lastReceivedAt: string | null;
  lastSoldAt: string | null;
  tracked: boolean;
}

const nf = (n: number) => n.toLocaleString('he-IL');
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');

const FILTERS: { key: string; label: string }[] = [
  { key: 'all', label: 'הכל' },
  { key: 'tracked', label: 'במעקב' },
  { key: 'low', label: 'מלאי נמוך' },
  { key: 'zero', label: 'אפס' },
  { key: 'negative', label: 'שלילי' },
];

function qtyPill(q: number) {
  const cls = q < 0 ? 'bg-red-500/15 text-red-300' : q === 0 ? 'bg-white/10 text-cream/50' : q <= 3 ? 'bg-amber-400/15 text-amber-300' : 'bg-emerald-400/15 text-emerald-300';
  return <span className={`inline-flex min-w-[2.5rem] items-center justify-center rounded-lg px-2 py-1 text-sm font-bold ${cls}`} style={{ fontVariantNumeric: 'tabular-nums' }}>{nf(q)}</span>;
}

export function InventoryManager({ initialItems }: { initialItems: InvItemClient[] }) {
  const [items, setItems] = useState<InvItemClient[]>(initialItems);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(false);

  const load = useCallback(async (s: string, f: string) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/crm/inventory?search=${encodeURIComponent(s)}&filter=${f}`);
      const data = await res.json();
      if (data.ok) setItems(data.items);
    } catch { /* keep current */ } finally { setLoading(false); }
  }, []);

  // debounce על חיפוש/פילטר
  useEffect(() => {
    const t = setTimeout(() => { if (search !== '' || filter !== 'all') load(search, filter); else setItems(initialItems); }, 300);
    return () => clearTimeout(t);
  }, [search, filter, load, initialItems]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/30" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="חיפוש לפי שם או קוד ספק…"
            className="w-full rounded-xl border border-gold/20 bg-[#0B132B] px-3.5 py-2.5 pe-9 text-sm text-cream placeholder:text-cream/30 outline-none focus:border-gold/60" dir="auto" />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={'rounded-full px-3.5 py-1.5 text-xs transition-colors ' + (filter === f.key ? 'bg-gold/15 font-bold text-gold' : 'text-cream/60 hover:bg-white/5')}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-3 text-sm font-medium text-cream/70">
          <span>{nf(items.length)} מוצרים</span>
          {loading && <Loader2 className="h-4 w-4 animate-spin text-gold/60" />}
        </div>
        {items.length === 0 ? (
          <div className="px-5 py-12 text-center text-sm text-cream/40">לא נמצאו מוצרים</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-right text-xs text-cream/40">
                  <th className="px-5 py-2.5 font-medium">מוצר</th>
                  <th className="px-3 py-2.5 font-medium">קוד ספק</th>
                  <th className="px-3 py-2.5 font-medium">קטגוריה</th>
                  <th className="px-3 py-2.5 font-medium">מלאי</th>
                  <th className="px-3 py-2.5 font-medium">כניסה אחרונה</th>
                  <th className="px-3 py-2.5 font-medium">מכירה אחרונה</th>
                  <th className="px-5 py-2.5"></th>
                </tr>
              </thead>
              <tbody>
                {items.map((it) => (
                  <tr key={it.sku} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-5 py-2.5">
                      <div className="flex items-center gap-3">
                        <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-lg border border-white/10 bg-white">
                          {it.image ? <Image src={it.image} alt="" fill className="object-contain p-0.5" sizes="44px" /> : <span className="flex h-full items-center justify-center text-lg">🎁</span>}
                        </span>
                        <span className="line-clamp-2 max-w-[22rem] text-cream/90">{it.title}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-cream/50" dir="ltr">{it.sku}</td>
                    <td className="px-3 py-2.5 text-xs text-cream/50">{it.category}</td>
                    <td className="px-3 py-2.5">{qtyPill(it.quantityOnHand)}</td>
                    <td className="px-3 py-2.5 text-xs text-cream/50">{fmtDate(it.lastReceivedAt)}</td>
                    <td className="px-3 py-2.5 text-xs text-cream/50">{fmtDate(it.lastSoldAt)}</td>
                    <td className="px-5 py-2.5 text-left">
                      <Link href={`/crm/inventory/${encodeURIComponent(it.sku)}`} className="inline-flex items-center gap-1 text-xs text-gold hover:text-gold/80">
                        ניהול <ChevronLeft className="h-3.5 w-3.5" />
                      </Link>
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
