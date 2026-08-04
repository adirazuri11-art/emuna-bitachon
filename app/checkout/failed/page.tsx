import Link from 'next/link';
import { XCircle, Clock } from 'lucide-react';
import { getOrder } from '@/lib/orders';

export const dynamic = 'force-dynamic';

export default async function CheckoutFailedPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const orderNumber = searchParams.order ?? '';
  const order = orderNumber ? await getOrder(orderNumber) : null;
  // אם ההזמנה עדיין pending — ייתכן שהתשלום בעיבוד; לא מצהירים "לא חויבת".
  const uncertain = order?.status === 'pending_payment';

  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      {uncertain ? (
        <>
          <Clock className="mx-auto h-16 w-16 text-gold-soft" strokeWidth={1.4} />
          <h1 className="mt-4 font-display text-2xl font-bold text-navy">סטטוס התשלום נבדק</h1>
          <p className="mx-auto mt-2 max-w-md text-navy/60">
            סטטוס התשלום עדיין נבדק. אין לבצע ניסיון נוסף עד לסיום הבדיקה — אם חויבת, ההזמנה תתעדכן אוטומטית.
          </p>
        </>
      ) : (
        <>
          <XCircle className="mx-auto h-16 w-16 text-red-400" strokeWidth={1.4} />
          <h1 className="mt-4 font-display text-3xl font-bold text-navy">התשלום לא הושלם</h1>
          <p className="mx-auto mt-2 max-w-md text-navy/60">
            לא בוצע חיוב. המוצרים נשמרו בסל — אפשר לבדוק את הפרטים ולנסות שוב מתי שנוח.
          </p>
        </>
      )}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/checkout" className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-3 font-bold text-navy shadow-gold">חזרה לתשלום</Link>
        <Link href="/" className="rounded-full border border-gold/40 px-8 py-3 font-bold text-navy hover:bg-gold/10">המשך לקנות</Link>
      </div>
    </div>
  );
}
