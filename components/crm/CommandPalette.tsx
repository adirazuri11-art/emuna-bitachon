'use client';

import { useEffect, useRef, useState } from 'react';
import { Search, User, LayoutDashboard, Ticket, CornerDownLeft, Instagram, BarChart3, ShoppingBag } from 'lucide-react';

interface Member {
  email: string;
  couponCode: string;
  couponUsed: boolean;
}

const NAV = [
  { label: 'סקירה כללית', href: '/crm', icon: LayoutDashboard },
  { label: 'הזמנות', href: '/crm/orders', icon: ShoppingBag },
  { label: 'לקוחות', href: '/crm/customers', icon: User },
  { label: 'חוות דעת', href: '/crm/reviews', icon: ShoppingBag },
  { label: 'Google Shopping', href: '/crm/merchant', icon: ShoppingBag },
  { label: 'מאתר המתנה', href: '/crm/gift-finder', icon: LayoutDashboard },
  { label: 'רשתות חברתיות', href: '/crm/social', icon: Instagram },
  { label: 'אנליטיקס', href: '/crm/analytics', icon: BarChart3 },
  { label: 'קופונים', href: '/crm/coupons', icon: Ticket },
];

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState('');
  const [members, setMembers] = useState<Member[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounce = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 40);
    else {
      setQ('');
      setMembers([]);
    }
  }, [open]);

  useEffect(() => {
    clearTimeout(debounce.current);
    if (q.trim().length < 2) {
      setMembers([]);
      return;
    }
    debounce.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/crm/search?q=${encodeURIComponent(q.trim())}`);
        const j = await res.json();
        setMembers(j.members ?? []);
      } catch {
        setMembers([]);
      }
    }, 180);
  }, [q]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-full border border-gold/20 bg-white/5 px-4 py-2 text-sm text-cream/50 transition-colors hover:border-gold/50 hover:text-cream"
      >
        <Search className="h-4 w-4" /> חיפוש
        <kbd className="rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-cream/60" dir="ltr">⌘K</kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-start justify-center bg-black/60 pt-[12vh] backdrop-blur-sm"
      onClick={() => setOpen(false)}
    >
      <div
        className="w-full max-w-xl overflow-hidden rounded-2xl border border-gold/25 bg-[#0B132B] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 border-b border-white/10 px-4">
          <Search className="h-4 w-4 text-cream/40" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="חיפוש לקוח, קוד הטבה, מסך…"
            className="flex-1 bg-transparent py-4 text-cream outline-none placeholder:text-cream/40"
          />
        </div>
        <div className="max-h-80 overflow-y-auto p-2">
          {members.map((m) => (
            <div
              key={m.couponCode}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 hover:bg-white/5"
            >
              <User className="h-4 w-4 text-gold" />
              <span className="flex-1 text-sm text-cream/90" dir="ltr">{m.email}</span>
              <span className="font-mono text-xs text-gold" dir="ltr">{m.couponCode}</span>
              <span className={`text-[11px] ${m.couponUsed ? 'text-emerald-300' : 'text-cream/40'}`}>
                {m.couponUsed ? 'מומש' : 'פעיל'}
              </span>
            </div>
          ))}
          {q.trim().length >= 2 && members.length === 0 && (
            <p className="px-3 py-6 text-center text-sm text-cream/40">לא נמצאו תוצאות</p>
          )}
          {q.trim().length < 2 && (
            <>
              <p className="px-3 py-2 text-[11px] uppercase text-cream/30">ניווט</p>
              {NAV.map((n) => (
                <a
                  key={n.href}
                  href={n.href}
                  className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/80 hover:bg-white/5"
                >
                  <n.icon className="h-4 w-4 text-gold" /> {n.label}
                  <CornerDownLeft className="ms-auto h-3.5 w-3.5 text-cream/30" />
                </a>
              ))}
              <div className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/40">
                <Ticket className="h-4 w-4" /> הקלד לפחות 2 תווים לחיפוש לקוחות
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
