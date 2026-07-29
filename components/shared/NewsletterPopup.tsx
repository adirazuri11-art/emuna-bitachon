'use client';

// פופ-אפ הצטרפות למועדון — נכנס מצד המסך אחרי 30 שניות, וחוזר כל 2 דקות
// כל עוד הגולש לא נרשם. נסגר ידנית. המייל נשלח ל-lalevmedia דרך FormSubmit.

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Gift, Loader2, X } from 'lucide-react';
import { useToastStore } from '@/store/toast';
import { trackEvent } from '@/lib/analytics';
import { savePersonalCoupon } from '@/lib/coupons';
import { joinClub, saveMemberCode } from '@/lib/club-client';
import { sendCouponEmail } from '@/lib/email';

const TARGET_EMAIL = process.env.NEXT_PUBLIC_NEWSLETTER_EMAIL ?? 'lalevmedia@gmail.com';
const ENDPOINT = `https://formsubmit.co/ajax/${encodeURIComponent(TARGET_EMAIL)}`;
const FIRST_DELAY = 30_000; // 30 שניות
const REPEAT_DELAY = 120_000; // כל 2 דקות

export function NewsletterPopup() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');
  const [couponCode, setCouponCode] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>();
  const showToast = useToastStore((s) => s.show);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (localStorage.getItem('emuna-club-joined')) return; // כבר חבר — לא מציגים

    const schedule = (delay: number) => {
      timer.current = setTimeout(() => setOpen(true), delay);
    };
    schedule(FIRST_DELAY);
    return () => clearTimeout(timer.current);
  }, []);

  const dismiss = () => {
    setOpen(false);
    if (!localStorage.getItem('emuna-club-joined')) {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setOpen(true), REPEAT_DELAY);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || status === 'loading') return;
    setStatus('loading');
    // קוד אישי ייחודי מהשרת — נאכף: ייחודי + מימוש חד-פעמי לאדם
    const join = await joinClub(email.trim());
    if (!join.ok) {
      setStatus('idle');
      showToast(join.error || 'משהו השתבש — נסו שוב', 'error');
      return;
    }
    const code = join.code;
    const validUntil = new Date(join.expires).toLocaleDateString('he-IL', {
      day: 'numeric', month: 'long',
    });
    try {
      // מייל ההטבה ללקוח — דרך EmailJS (אמין, מעוצב). false אם לא הוגדר.
      const emailSent = await sendCouponEmail({
        toEmail: email.trim(), code, validUntil,
      });
      const payload: Record<string, string> = {
        _subject: 'הרשמה חדשה למועדון (פופ-אפ) — אמונה וביטחון',
        email: email.trim(),
        מקור: 'פופ-אפ מועדון',
        'קוד ההטבה': code,
        _template: 'box',
        _captcha: 'false',
      };
      if (!emailSent) {
        payload._autoresponse = [
          'שלום וברכה 🌿',
          '',
          'תודה שהצטרפת למועדון "אמונה וביטחון".',
          '',
          `🎁 קוד ההטבה שלך: ${code}`,
          `${join.pct}% הנחה על ההזמנה הראשונה.`,
          '',
          `• בתוקף עד ${validUntil} (7 ימים)`,
          '• לשימוש חד-פעמי',
          '• איך משתמשים: מזינים את הקוד בסל הקניות לפני התשלום',
          '',
          'לצפייה בקטלוג: https://emuna-bitachon.vercel.app',
          '',
          'בברכה, צוות אמונה וביטחון',
        ].join('\n');
      }
      await fetch(ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify(payload),
      }).catch(() => {});
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
      clearTimeout(timer.current);
      showToast(join.already ? 'כבר חבר — הקוד האישי במייל 🎉' : 'הצטרפת! קוד אישי נשלח למייל 🎉');
    } catch {
      setStatus('idle');
      showToast('משהו השתבש — נסו שוב', 'error');
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, x: -40, y: 20 }}
          animate={{ opacity: 1, x: 0, y: 0 }}
          exit={{ opacity: 0, x: -40, y: 20 }}
          transition={{ type: 'spring', damping: 24, stiffness: 260 }}
          role="dialog"
          aria-label="הצטרפות למועדון"
          className="fixed inset-x-4 bottom-6 z-[55] overflow-hidden rounded-2xl border border-gold/30 bg-navy shadow-2xl sm:inset-x-auto sm:left-6 sm:w-full sm:max-w-sm"
        >
          <div className="pointer-events-none absolute -top-10 start-1/3 h-32 w-32 rounded-full bg-gold/15 blur-[50px]" />
          <button onClick={dismiss} aria-label="סגירה"
            className="absolute end-2 top-2 z-10 rounded-full p-1.5 text-cream/50 hover:text-cream">
            <X className="h-4 w-4" />
          </button>

          <div className="relative p-5">
            <div className="mb-2 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-l from-gold to-gold-soft">
                <Gift className="h-4.5 w-4.5 text-navy" />
              </span>
              <h2 className="font-display text-lg font-bold text-cream">מצטרפים למועדון?</h2>
            </div>
            <p className="mb-3 text-sm text-cream/60">
              הטבה למצטרפים חדשים, גישה מוקדמת לקולקציות חג וטיפים — ישר למייל. בלי ספאם.
            </p>

            {status === 'done' ? (
              <div className="rounded-xl border border-gold/25 bg-white/5 px-4 py-3 text-center text-cream">
                <p className="text-sm font-medium">תודה שהצטרפת! 🎁 קוד 10% נשלח למייל</p>
                {couponCode && (
                  <p className="mt-1 font-mono text-base font-bold text-gold" dir="ltr">{couponCode}</p>
                )}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="flex gap-2">
                <input
                  type="email" required value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="האימייל שלכם" autoComplete="email" dir="ltr" aria-label="אימייל"
                  className="flex-1 rounded-full border border-gold/30 bg-white/10 px-4 py-2.5 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold"
                />
                <button type="submit" disabled={status === 'loading'}
                  className="flex items-center justify-center rounded-full bg-gradient-to-l from-gold to-gold-soft px-5 py-2.5 text-sm font-bold text-navy transition-transform hover:scale-[1.03] disabled:opacity-60">
                  {status === 'loading' ? <Loader2 className="h-4 w-4 animate-spin" /> : 'הצטרפות'}
                </button>
              </form>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
