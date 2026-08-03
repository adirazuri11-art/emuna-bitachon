import { Ticket, TicketCheck, Percent } from 'lucide-react';
import { getClubStats, getCouponStats } from '@/lib/crm/data';

export const dynamic = 'force-dynamic';

function Tile({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number; sub?: string }) {
  return (
    <div className="rounded-2xl border border-gold/15 bg-white/5 p-5">
      <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-gold/15">
        <Icon className="h-5 w-5 text-gold" />
      </div>
      <div className="font-display text-3xl font-bold text-cream">{value}</div>
      <div className="mt-1 text-sm text-cream/70">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-cream/40">{sub}</div>}
    </div>
  );
}

export default async function CouponsPage() {
  const [club, coupons] = await Promise.all([getClubStats(), getCouponStats()]);
  const redemption = club.total ? Math.round((club.usedCoupon / club.total) * 100) : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-cream">קופונים והטבות</h1>
        <p className="mt-1 text-sm text-cream/50">הטבת מועדון 10% · קוד אישי חד-פעמי לכל חבר</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Tile icon={Ticket} label="קופוני מועדון פעילים" value={club.activeCoupon} />
        <Tile icon={TicketCheck} label="קופוני מועדון שמומשו" value={club.usedCoupon} />
        <Tile icon={Percent} label="שיעור מימוש" value={`${redemption}%`} sub="מתוך כלל החברים" />
        <Tile
          icon={Ticket}
          label='קופונים נוספים (טבלת coupons)'
          value={coupons.tableReady ? coupons.total : '—'}
          sub={coupons.tableReady ? `${coupons.used} מומשו` : 'הטבלה אינה זמינה'}
        />
      </div>

      <div className="rounded-2xl border border-gold/15 bg-white/5 p-6 text-sm leading-relaxed text-cream/70">
        <p>
          כל חבר מועדון מקבל קוד הטבה אישי חד-פעמי (10% להזמנה הראשונה, תוקף 7 ימים), הנאכף בצד-שרת בעת
          הרכישה. ניהול קופוני קמפיין ייעודיים, קופוני קאשבק ומגבלות מתקדמות יתווסף עם חיבור הסליקה.
        </p>
      </div>
    </div>
  );
}
