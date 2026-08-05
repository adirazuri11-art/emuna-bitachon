'use client';

// צ'יפ קוד קופון עם העתקה מהירה לקליפבורד — לחיצה מעתיקה ומראה ✓.
import { useState } from 'react';
import { Copy, Check } from 'lucide-react';

export function CouponCodeChip({ code, className = '' }: { code: string; className?: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // fallback לדפדפנים ישנים / הקשר לא-מאובטח
      const ta = document.createElement('textarea');
      ta.value = code;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); } catch { /* noop */ }
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? 'הקוד הועתק' : 'העתקת קוד הקופון'}
      className={
        'group inline-flex items-center gap-2 rounded-full border border-gold/40 bg-white/5 px-4 py-2 font-mono text-base font-bold text-gold transition-colors hover:bg-gold/10 ' +
        className
      }
      dir="ltr"
    >
      <span>{code}</span>
      {copied ? (
        <Check className="h-4 w-4 shrink-0 text-emerald-400" />
      ) : (
        <Copy className="h-4 w-4 shrink-0 text-gold/70 transition-colors group-hover:text-gold" />
      )}
    </button>
  );
}
