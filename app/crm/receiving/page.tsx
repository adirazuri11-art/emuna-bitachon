import { FileText, PackageCheck } from 'lucide-react';
import { listInvoices } from '@/lib/crm/receiving';
import { ReceivingForm } from '@/components/crm/ReceivingForm';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const fmtDate = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: '2-digit' }) : '—');

export default async function ReceivingPage() {
  const invoices = await listInvoices(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">קליטת סחורה</h1>
        <p className="mt-1 text-sm text-cream/50">
          צלמו או העלו את חשבונית הספק — הסריקה החכמה תזהה את המוצרים והכמויות, ואתם רק מאשרים.
          התאמה אוטומטית לפי קוד ספק, חשבונית שכבר נקלטה לא תיקלט שוב. אפשר גם להזין ידנית או להדביק CSV.
        </p>
      </div>

      <ReceivingForm />

      {/* חשבוניות אחרונות */}
      <div className="overflow-hidden rounded-2xl border border-gold/15 bg-white/5">
        <div className="flex items-center gap-2 border-b border-white/10 px-5 py-3.5 text-sm font-medium text-cream/70"><FileText className="h-4 w-4 text-gold" /> חשבוניות שנקלטו</div>
        {invoices.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-cream/40">עדיין לא נקלטו חשבוניות</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm" style={{ fontVariantNumeric: 'tabular-nums' }}>
              <thead>
                <tr className="text-right text-xs text-cream/40">
                  <th className="px-5 py-2.5 font-medium">חשבונית</th>
                  <th className="px-3 py-2.5 font-medium">ספק</th>
                  <th className="px-3 py-2.5 font-medium">תאריך</th>
                  <th className="px-3 py-2.5 font-medium">שורות</th>
                  <th className="px-3 py-2.5 font-medium">יחידות</th>
                  <th className="px-5 py-2.5 font-medium">סה״כ</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-t border-white/5 hover:bg-white/5">
                    <td className="px-5 py-3 font-mono text-xs text-cream/80" dir="ltr">{inv.invoiceNumber}</td>
                    <td className="px-3 py-3 text-cream/70">{inv.supplierName}</td>
                    <td className="px-3 py-3 text-xs text-cream/50">{fmtDate(inv.invoiceDate)}</td>
                    <td className="px-3 py-3 text-cream/60">
                      {nf(inv.matchedCount)}<span className="text-cream/30">/{nf(inv.lineCount)}</span>
                    </td>
                    <td className="px-3 py-3 font-medium text-emerald-300">{nf(inv.unitsTotal)}</td>
                    <td className="px-5 py-3 text-cream/70">₪{nf(Math.round(inv.total))}</td>
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
