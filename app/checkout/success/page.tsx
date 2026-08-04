import Link from 'next/link';
import { CheckCircle2 } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { order?: string };
}) {
  const order = searchParams.order ?? '';
  return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <CheckCircle2 className="mx-auto h-16 w-16 text-emerald-500" strokeWidth={1.4} />
      <h1 className="mt-4 font-display text-3xl font-bold text-navy">התשלום התקבל!</h1>
      <p className="mt-2 text-navy/60">
        תודה על הזמנתך.{order ? <> מספר הזמנה: <b dir="ltr" className="text-navy">{order}</b></> : null}
      </p>
      <p className="mx-auto mt-3 max-w-md rounded-xl border border-gold/25 bg-gold/10 px-4 py-3 text-sm text-navy/70">
        קיבלנו את התשלום ונתחיל בהכנת ההזמנה. נעדכן אותך בכל שלב.
      </p>
      <Link
        href="/"
        className="mt-8 inline-block rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-3 font-bold text-navy shadow-gold"
      >
        חזרה לחנות
      </Link>
    </div>
  );
}
