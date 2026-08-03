// מסך הפתיחה של מאתר המתנה — hero מזמין שמסביר את התהליך בארבעה שלבים,
// עם קריאה לפעולה ברורה ופסי אמון. שומר על שפת המותג: נייבי, זהב, RTL.
// כל התוכן מוצג סטטית וגלוי כברירת מחדל — ללא הסתרה שתלויה ב-JS/אנימציה.

import Link from 'next/link';
import { Sparkles, Gift, ArrowLeft, ShieldCheck, Truck, Award } from 'lucide-react';

const STEPS = [
  { n: '1', label: 'למי מיועדת המתנה' },
  { n: '2', label: 'לאיזה אירוע' },
  { n: '3', label: 'מה התקציב' },
  { n: '4', label: 'מקבלים המלצות' },
];

const TRUST = [
  { icon: ShieldCheck, label: 'כשרות מאומתת' },
  { icon: Truck, label: 'משלוח מהיר לכל הארץ' },
  { icon: Award, label: 'אחריות לכל החיים' },
];

export function GiftFinderHero() {
  return (
    <section className="relative flex min-h-[82vh] items-center overflow-hidden bg-navy-deep px-4 py-16">
      {/* רקע — זוהר זהב עדין + ויניטה */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 start-1/4 h-[380px] w-[380px] rounded-full bg-gold/15 blur-[120px]" />
        <div className="absolute -bottom-16 end-1/4 h-[320px] w-[320px] rounded-full bg-gold-soft/10 blur-[110px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,#0B132B_100%)]" />
        <div className="absolute end-[12%] top-[16%] hidden h-24 w-24 rounded-full border border-gold/15 lg:block" />
        <div className="absolute bottom-[18%] start-[10%] hidden h-14 w-14 rotate-45 border border-gold/10 lg:block" />
      </div>

      <div className="relative mx-auto w-full max-w-3xl text-center">
        {/* תג עליון */}
        <span className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-4 py-1.5 text-sm font-medium text-gold">
          <Sparkles className="h-3.5 w-3.5 fill-gold" />
          מנוע ההמלצות של אמונה וביטחון
        </span>

        {/* אייקון */}
        <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-gold/25 bg-navy shadow-gold">
          <Gift className="h-7 w-7 text-gold" />
        </span>

        {/* כותרת */}
        <h1 className="font-display text-4xl font-bold leading-[1.15] text-cream md:text-6xl">
          מאתר <span className="gold-text">המתנה המושלמת</span>
        </h1>

        <p className="mx-auto mt-5 max-w-xl text-lg leading-relaxed text-cream/70">
          עונים על ארבע שאלות קצרות — ומקבלים מתנות אמיתיות מתוך הקולקציה,
          בדיוק לפי מקבל המתנה, האירוע והתקציב.
        </p>

        {/* ארבעת השלבים */}
        <div className="mx-auto mt-9 flex max-w-2xl flex-wrap items-center justify-center gap-x-2 gap-y-3">
          {STEPS.map((s, i) => (
            <div key={s.n} className="flex items-center gap-2">
              <div className="flex items-center gap-2 rounded-full border border-gold/15 bg-white/5 px-3.5 py-2 backdrop-blur-sm">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold text-[11px] font-bold text-navy">
                  {s.n}
                </span>
                <span className="text-sm text-cream/80">{s.label}</span>
              </div>
              {i < STEPS.length - 1 && (
                <ArrowLeft className="hidden h-4 w-4 shrink-0 text-gold/50 sm:block" />
              )}
            </div>
          ))}
        </div>

        {/* קריאות לפעולה */}
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link
            href="/gift-finder"
            className="group inline-flex items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-3.5 font-bold text-navy shadow-gold transition-transform hover:scale-[1.03] active:scale-[0.98]"
          >
            <Sparkles className="h-5 w-5" />
            מצאו מתנה עכשיו
          </Link>
          <Link
            href="/search"
            className="inline-flex items-center justify-center gap-2 rounded-full border border-gold/30 bg-white/5 px-8 py-3.5 font-bold text-cream backdrop-blur-sm transition-all hover:border-gold hover:bg-gold/10"
          >
            עיון בכל הקטלוג
          </Link>
        </div>

        <p className="mt-4 text-xs text-cream/40">זה לוקח פחות מדקה</p>

        {/* פס אמון */}
        <div className="mx-auto mt-12 flex flex-wrap items-center justify-center gap-x-7 gap-y-2 border-t border-gold/10 pt-6 text-sm text-cream/60">
          {TRUST.map(({ icon: Icon, label }) => (
            <span key={label} className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-gold" /> {label}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
