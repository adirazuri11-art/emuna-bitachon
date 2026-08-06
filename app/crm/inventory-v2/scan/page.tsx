import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { InvoiceScanner } from '@/components/crm/InvoiceScanner';

export const dynamic = 'force-dynamic';

export default function ScanPage() {
  return (
    <div className="space-y-6">
      <Link href="/crm/inventory-v2" className="inline-flex items-center gap-1 text-sm text-cream/50 hover:text-gold">
        <ChevronRight className="h-4 w-4" /> חזרה למרכז ניהול המלאי
      </Link>
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">קליטת חשבונית ספק</h1>
        <p className="mt-1 text-sm text-cream/50">
          העלה חשבונית (PDF / צילום / HEIC). המערכת קוראת אוטומטית קוד, כמות ומחיר, מיישרת מול הקטלוג ומאמתת סכומים — ואתה מאשר.
        </p>
      </div>
      <InvoiceScanner />
    </div>
  );
}
