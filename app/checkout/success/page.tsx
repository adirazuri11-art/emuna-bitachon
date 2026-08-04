import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';
import { getOrder } from '@/lib/orders';
import { PaymentVerifying } from '@/components/checkout/PaymentVerifying';
import { PurchaseTracker } from '@/components/checkout/PurchaseTracker';

export const dynamic = 'force-dynamic';

// עמוד הצלחה — הגעה ל-URL אינה הוכחה לתשלום.
// בודקים את סטטוס ההזמנה בשרת; מציגים "התקבל" רק אם paid, אחרת "מאמתים" עם polling.
export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNumber = searchParams.order ?? '';
  const order = orderNumber ? await getOrder(orderNumber) : null;

  return (
    <div className="mx-auto max-w-xl px-4 py-20">
      {order?.paid ? (
        <div className="text-center">
          <PurchaseTracker orderNumber={orderNumber} amount={order.amount} />
          <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" strokeWidth={1.4} />
          <h1 className="mt-4 font-display text-3xl font-bold text-navy">ההזמנה התקבלה בהצלחה</h1>
          <p className="mt-2 text-navy/60">
            תודה שקניתם באמונה וביטחון. התשלום התקבל וההזמנה נכנסה לטיפול.
          </p>
          <p className="mt-1 text-navy/60">מספר הזמנה: <b dir="ltr" className="text-navy">{orderNumber}</b></p>
          <p className="mx-auto mt-3 max-w-md rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-navy/70">
            שלחנו אישור למייל שלך. נעדכן אותך בכל שלב בהכנת ההזמנה.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link href="/" className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-3 font-bold text-navy shadow-gold">חזרה לעמוד הבית</Link>
            <Link href="/search" className="rounded-full border border-gold/40 px-8 py-3 font-bold text-navy hover:bg-gold/10">המשך לקנות</Link>
          </div>
        </div>
      ) : (
        <PaymentVerifying orderNumber={orderNumber} amount={order?.amount ?? 0} />
      )}
    </div>
  );
}
