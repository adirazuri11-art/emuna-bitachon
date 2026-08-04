import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowRight, CheckCircle2, Phone, Mail, MapPin, Gift } from 'lucide-react';
import { getOrderDetail } from '@/lib/crm/orders';
import { FulfillmentControl } from '@/components/crm/FulfillmentControl';

export const dynamic = 'force-dynamic';

const nf = (n: number) => n.toLocaleString('he-IL');
const money = (n: number) => `₪${nf(Math.round(n))}`;

export default async function OrderDetailPage({ params }: { params: { order: string } }) {
  const order = await getOrderDetail(decodeURIComponent(params.order));
  if (!order) notFound();

  const c = order.customer;
  const addr = [c.street, c.city, c.zip].filter(Boolean).join(', ');
  const paid = order.status === 'paid';

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/crm/orders" className="inline-flex items-center gap-1 text-sm text-cream/50 hover:text-gold">
        <ArrowRight className="h-4 w-4" /> חזרה להזמנות
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-2xl font-bold text-cream" dir="ltr">{order.orderNumber}</h1>
          <p className="mt-1 text-sm text-cream/50">
            {order.createdAt ? new Date(order.createdAt).toLocaleString('he-IL') : ''}
          </p>
        </div>
        {paid ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-400/15 px-3 py-1.5 text-sm font-medium text-emerald-300"><CheckCircle2 className="h-4 w-4" /> שולם · {money(order.amount)}</span>
        ) : (
          <span className="rounded-full bg-amber-400/15 px-3 py-1.5 text-sm font-medium text-amber-300">{order.status === 'pending_payment' ? 'ממתין לתשלום' : 'נכשל'}</span>
        )}
      </div>

      {/* סטטוס טיפול — workflow */}
      {paid && <FulfillmentControl orderNumber={order.orderNumber} current={order.fulfillment} />}

      {/* פריטים */}
      <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-medium text-cream/60">פריטים</h2>
        <div className="space-y-2">
          {order.items.map((i, idx) => (
            <div key={idx} className="flex items-center justify-between border-b border-white/5 py-2 text-sm last:border-0">
              <span className="text-cream/90">{i.title || i.id} <span className="text-cream/40">× {i.quantity}</span></span>
              <span className="font-medium text-cream">{money(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
        </div>
        <div className="mt-3 space-y-1.5 border-t border-white/10 pt-3 text-sm">
          {order.discount > 0 && <Row label={`הנחה${order.couponCode ? ` · ${order.couponCode}` : ''}`} value={`-${money(order.discount)}`} />}
          <Row label="משלוח" value={order.shipping ? money(order.shipping) : 'חינם'} />
          {order.giftWrap > 0 && <Row label="🎁 אריזת מתנה" value={money(order.giftWrap)} />}
          <div className="flex justify-between border-t border-white/10 pt-2 font-bold text-cream"><span>סה"כ</span><span>{money(order.amount)}</span></div>
        </div>
      </div>

      {/* לקוח */}
      <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
        <h2 className="mb-3 text-sm font-medium text-cream/60">לקוח ומשלוח</h2>
        <div className="grid gap-2.5 text-sm text-cream/85 sm:grid-cols-2">
          <div className="font-medium text-cream">{c.name || '—'}</div>
          <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-gold" /> <a href={`tel:${c.phone}`} className="hover:text-gold" dir="ltr">{c.phone || '—'}</a></div>
          <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-gold" /> <span dir="ltr">{c.email || '—'}</span></div>
          <div className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 text-gold" /> {addr || '—'}</div>
        </div>
      </div>

      {/* אריזת מתנה */}
      {order.giftWrap > 0 && order.giftMessage && (
        <div className="rounded-2xl border border-gold/25 bg-gold/5 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-sm font-bold text-gold"><Gift className="h-4 w-4" /> כיתוב לכרטיס הברכה</h2>
          <p className="whitespace-pre-wrap text-sm text-cream/90">{order.giftMessage}</p>
        </div>
      )}

      {/* תשלום */}
      <div className="rounded-2xl border border-gold/15 bg-white/5 p-5 text-sm">
        <h2 className="mb-3 text-sm font-medium text-cream/60">תשלום</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <Row label="סטטוס" value={paid ? 'שולם' : order.status} />
          <Row label="מזהה עסקה" value={order.transactionId || '—'} />
          <Row label="שולם בתאריך" value={order.paidAt ? new Date(order.paidAt).toLocaleString('he-IL') : '—'} />
          <Row label="ספק" value="Cardcom" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-cream/50">{label}</span>
      <span className="text-cream/90" dir="auto">{value}</span>
    </div>
  );
}
