'use client';

// ============================================================
// מועדון הלקוחות — הרשמה במייל.
// המייל נשלח ליעד (lalevmedia@gmail.com) דרך FormSubmit:
// שירות חינמי ללא מפתחות וללא backend, עובד גם באתר סטטי.
// ⚠️ הפעלה חד-פעמית: בהרשמה הראשונה FormSubmit שולח מייל אישור
// ליעד — צריך ללחוץ על הקישור פעם אחת, ואז כל ההרשמות מגיעות.
// שינוי כתובת היעד: NEXT_PUBLIC_NEWSLETTER_EMAIL ב-.env.
// ============================================================

import { useEffect, useState, type FormEvent } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2, Mail, Sparkles } from 'lucide-react';
import { useToastStore } from '@/store/toast';
import { trackEvent } from '@/lib/analytics';
import { savePersonalCoupon } from '@/lib/coupons';
import { joinClub, saveMemberCode } from '@/lib/club-client';
import { CouponCodeChip } from '@/components/shared/CouponCodeChip';

// NewsLetter subscription via backend API (FormSubmit handled server-side)
const ENDPOINT = '/api/newsletter/subscribe';

const PERKS = ['מבצעים והטבות חברים', 'גישה מוקדמת לקולקציות חג', 'טיפים והשראה לפני כל חג'];

export function NewsletterClub() {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.show);

  // אם כבר נרשם במכשיר הזה — מציגים ישר מצב "תודה"
  useEffect(() => {
    if (localStorage.getItem('emuna-club-joined')) setStatus('done');
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    // קוד אישי ייחודי מהשרת — נאכף: ייחודי לכל אדם + מימוש פעם אחת בלבד
    const join = await joinClub(email.trim());
    if (!join.ok) {
      setStatus('idle');
      showToast(join.error || 'משהו השתבש — נסו שוב', 'error');
      return;
    }
    const code = join.code;
    try {
      // מייל ההטבה ללקוח (RTL מלא) נשלח כבר מהשרת דרך Resend ב-/api/club.
      // כאן רק התראה לבעל האתר דרך API (FormSubmit מטופל בצד-שרת).
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), name: name.trim() }),
      }).catch(() => {});
      // שמירה מקומית — לזיהוי חבר בקופה ולהצגת הקוד
      saveMemberCode(code);
      savePersonalCoupon({
        code, type: 'pct', value: join.pct,
        label: `הטבת מועדון — ${join.pct}% להזמנה הראשונה`,
        expires: join.expires, firstOrderOnly: true,
      });
      localStorage.setItem('emuna-club-joined', '1');
      trackEvent('newsletter_signup', { value: 0 });
      setCouponCode(code);
      setStatus('done');
      showToast(join.already ? 'כבר חבר — הקוד האישי שלך במייל 🎉' : 'הצטרפת! קוד אישי נשלח למייל 🎉');
    } catch {
      setStatus('idle');
      showToast('משהו השתבש בהרשמה — נסו שוב עוד רגע', 'error');
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-4 py-16">
      <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-navy via-navy-deep to-navy-light p-8 text-center md:p-12">
        <div className="pointer-events-none absolute -top-16 start-1/3 h-64 w-64 rounded-full bg-gold/15 blur-[90px]" />

        <div className="relative">
          <span className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-gold/10">
            <Sparkles className="h-5 w-5 text-gold" />
          </span>
          <h2 className="font-display text-3xl font-bold text-cream">מועדון אמונה וביטחון</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/60">
            מצטרפים בחינם ומקבלים ראשונים את ההטבות, ההשקות והטיפים לכל חג.
          </p>

          <div className="mx-auto mt-5 flex max-w-lg flex-wrap justify-center gap-x-5 gap-y-1.5 text-sm text-cream/70">
            {PERKS.map((p) => (
              <span key={p} className="flex items-center gap-1.5">
                <Check className="h-3.5 w-3.5 text-gold" /> {p}
              </span>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {status === 'done' ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mx-auto mt-7 max-w-md rounded-2xl border border-gold/30 bg-white/5 px-5 py-4 text-center text-cream"
              >
                <p className="flex items-center justify-center gap-2 font-medium">
                  <Check className="h-5 w-5 text-emerald-400" /> אתם בפנים! שלחנו לכם קוד 10% למייל.
                </p>
                {couponCode && (
                  <div className="mt-3 flex flex-col items-center gap-1.5">
                    <span className="text-xs text-cream/60">קוד ההנחה שלכם (10% להזמנה הראשונה):</span>
                    <CouponCodeChip code={couponCode} />
                    <span className="text-[11px] text-cream/40">לחצו על הקוד להעתקה · תקף 7 ימים · שלחנו אותו גם למייל</span>
                  </div>
                )}
              </motion.div>
            ) : (
              <motion.form
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="mx-auto mt-7 max-w-md"
              >
                <div className="flex flex-col gap-2 sm:flex-row">
                  <label className="sr-only" htmlFor="club-name">שם</label>
                  <input
                    id="club-name" value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="שם (לא חובה)" autoComplete="name"
                    className="w-full rounded-full border border-gold/30 bg-white/10 px-4 py-3 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold sm:w-2/5"
                  />
                  <div className="relative flex-1">
                    <label className="sr-only" htmlFor="club-email">אימייל</label>
                    <Mail className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
                    <input
                      id="club-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                      placeholder="האימייל שלכם" autoComplete="email" dir="ltr"
                      className="w-full rounded-full border border-gold/30 bg-white/10 px-4 py-3 pe-10 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold"
                    />
                  </div>
                </div>
                <button
                  type="submit" disabled={status === 'loading'}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-gradient-to-l from-gold to-gold-soft py-3 font-bold text-navy shadow-gold transition-transform hover:scale-[1.02] disabled:opacity-60"
                >
                  {status === 'loading' ? <><Loader2 className="h-4 w-4 animate-spin" /> מצרפים...</> : 'הצטרפות למועדון'}
                </button>
                <p className="mt-2 text-[11px] text-cream/40">
                  לא נשלח ספאם. אפשר להסיר את ההרשמה בכל עת.
                </p>
              </motion.form>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
