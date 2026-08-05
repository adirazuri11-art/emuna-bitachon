'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Sparkles, Ticket, Gift, Instagram, BarChart3, ShoppingBag, ShoppingCart, Star, RotateCcw, Coins, PackageSearch } from 'lucide-react';

const NAV = [
  { href: '/crm', label: 'סקירה', icon: LayoutDashboard, exact: true },
  { href: '/crm/orders', label: 'הזמנות', icon: ShoppingBag },
  { href: '/crm/abandoned', label: 'שחזור קופות', icon: RotateCcw },
  { href: '/crm/profit', label: 'רווח', icon: Coins },
  { href: '/crm/insights', label: 'תובנות מוצרים', icon: PackageSearch },
  { href: '/crm/customers', label: 'לקוחות', icon: Users },
  { href: '/crm/reviews', label: 'חוות דעת', icon: Star },
  { href: '/crm/merchant', label: 'Google Shopping', icon: ShoppingCart },
  { href: '/crm/gift-finder', label: 'מאתר המתנה', icon: Sparkles },
  { href: '/crm/social', label: 'רשתות חברתיות', icon: Instagram },
  { href: '/crm/analytics', label: 'אנליטיקס', icon: BarChart3 },
  { href: '/crm/promotions', label: 'מבצעים וקופונים', icon: Ticket },
];

export function Sidebar() {
  const pathname = usePathname();
  const active = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-s border-gold/10 bg-[#0B132B] md:flex">
      <div className="flex items-center gap-3 border-b border-gold/10 px-5 py-4">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-navy">
          <Gift className="h-4 w-4 text-gold" />
        </span>
        <div className="leading-tight">
          <div className="font-display text-base font-bold text-cream">אמונה וביטחון</div>
          <div className="text-[10px] text-cream/40">מרכז שליטה</div>
        </div>
      </div>
      <nav className="flex-1 space-y-1 p-3">
        {NAV.map((n) => {
          const on = active(n.href, n.exact);
          return (
            <Link
              key={n.href}
              href={n.href}
              className={
                'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm transition-colors ' +
                (on
                  ? 'bg-gold/15 font-bold text-gold'
                  : 'text-cream/70 hover:bg-white/5 hover:text-cream')
              }
            >
              <n.icon className="h-4 w-4" />
              {n.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-gold/10 p-3 text-[11px] text-cream/30">
        נתונים אמיתיים · Supabase
      </div>
    </aside>
  );
}
