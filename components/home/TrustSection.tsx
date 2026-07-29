import { Hammer, MessageCircle, ShieldCheck, Truck } from 'lucide-react';

// אמון בלי המצאות: אין כאן ביקורות או דירוגים מזויפים —
// רק הבטחות שירות אמיתיות שבשליטתנו. ביקורות אמיתיות יתווספו
// למבנה המוכן בעמודי המוצר אחרי ההשקה.
const PILLARS = [
  {
    icon: Hammer,
    title: 'עבודת יד ואומנים',
    text: 'כלי הכסף, הרקמה והאריגה נעשים בידי אומנים ובתי מלאכה מנוסים — לא פס ייצור.',
  },
  {
    icon: ShieldCheck,
    title: 'כשרות ואמינות',
    text: 'מוצרי סת"ם וציציות מגיעים עם תעודה מהגורם המוסמך, ושם הגורם מופיע על כל מוצר.',
  },
  {
    icon: MessageCircle,
    title: 'ליווי אישי בוואטסאפ',
    text: 'מתלבטים בין נוסחים, מידות או עיצוב? כותבים לנו — ועונה לכם אדם, לא בוט.',
  },
  {
    icon: Truck,
    title: 'משלוח והחזרות',
    text: 'משלוח חינם מעל ₪399, אספקה מהירה לכל הארץ, ו-30 יום להחזרת מוצרים רגילים.',
  },
];

export function TrustSection() {
  return (
    <section className="border-y border-gold/15 bg-white py-16">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-10 text-center">
          <span className="text-sm font-medium text-gold-soft">בית מלאכה, לא רק חנות</span>
          <h2 className="mt-1 font-display text-3xl font-bold text-navy">למה אמונה וביטחון</h2>
          <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-l from-transparent via-gold to-transparent" />
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {PILLARS.map(({ icon: Icon, title, text }) => (
            <div key={title} className="rounded-2xl border border-navy/5 bg-cream p-6 text-center shadow-card">
              <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-navy">
                <Icon className="h-5 w-5 text-gold" />
              </span>
              <h3 className="font-display text-lg font-bold text-navy">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-navy/60">{text}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
