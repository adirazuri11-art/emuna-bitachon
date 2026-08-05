'use client';

// הרשמה למועדון (פוטר) — שומר את החבר ב-DB דרך /api/club, שולח קוד הטבה במייל.
// אכיפת ייחודיות + מימוש חד-פעמי נעשית בשרת. כך כל נרשם "נצבע" וניתן לשווק אליו.
import { useState, type FormEvent } from 'react';
import { Check, Mail } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';
import { useToastStore } from '@/store/toast';
import { joinClub, saveMemberCode } from '@/lib/club-client';
import { savePersonalCoupon } from '@/lib/coupons';
import { CouponCodeChip } from '@/components/shared/CouponCodeChip';

export function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const showToast = useToastStore((s) => s.show);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || loading) return;
    setLoading(true);

    // קוד אישי ייחודי מהשרת — הנרשם נשמר ב-DB (ClubMember) לצורך שיווק עתידי.
    const join = await joinClub(value);
    if (!join.ok) {
      setLoading(false);
      showToast(join.error || 'משהו השתבש — נסו שוב', 'error');
      return;
    }

    // מייל ההטבה (RTL מלא) נשלח כבר מהשרת דרך Resend ב-/api/club.
    saveMemberCode(join.code);
    savePersonalCoupon({
      code: join.code, type: 'pct', value: join.pct,
      label: `הטבת מועדון — ${join.pct}% להזמנה הראשונה`,
      expires: join.expires, firstOrderOnly: true,
    });
    // גיבוי מקומי (לא מקור האמת — ה-DB הוא המקור)
    try {
      const list: string[] = JSON.parse(localStorage.getItem('emuna-newsletter') ?? '[]');
      if (!list.includes(value)) list.push(value);
      localStorage.setItem('emuna-newsletter', JSON.stringify(list));
    } catch { /* localStorage לא זמין */ }

    trackEvent('newsletter_signup');
    setCode(join.code);
    setLoading(false);
    showToast(join.already ? 'כבר חבר — הקוד האישי במייל 🎉' : 'הצטרפת למועדון! קוד אישי נשלח למייל 💌');
  };

  if (code) {
    return (
      <div className="flex flex-col items-center gap-1 py-2 text-center">
        <p className="flex items-center gap-2 font-medium text-emerald-400">
          <Check className="h-5 w-5" /> את/ה במועדון — הקוד האישי נשלח למייל
        </p>
        <p className="text-sm text-cream/70">קוד ההטבה שלך · 10% להזמנה הראשונה</p>
        <CouponCodeChip code={code} className="mt-1" />
        <span className="text-[11px] text-cream/50">לחצו על הקוד להעתקה מהירה</span>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto flex max-w-md gap-2">
      <div className="relative flex-1">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="כתובת האימייל שלך"
          aria-label="אימייל להרשמה למועדון"
          className="w-full rounded-full border border-gold/30 bg-white/10 py-2.5 pe-10 ps-4 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold"
        />
        <Mail className="absolute end-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gold/60" />
      </div>
      <button type="submit" disabled={loading}
        className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-5 py-2.5 text-sm font-bold text-navy hover:scale-[1.02] disabled:opacity-60">
        {loading ? 'רגע…' : 'הצטרפות'}
      </button>
    </form>
  );
}
