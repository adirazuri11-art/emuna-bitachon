import type { Metadata } from 'next';
import Link from 'next/link';
import { Gift, LayoutDashboard } from 'lucide-react';
import { LogoutButton } from './LogoutButton';
import { CommandPalette } from '@/components/crm/CommandPalette';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'מרכז השליטה · אמונה וביטחון',
  robots: { index: false, follow: false },
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0F172A] text-cream" dir="rtl">
      <header className="sticky top-0 z-10 border-b border-gold/15 bg-[#0B132B]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl border border-gold/25 bg-navy">
              <Gift className="h-4 w-4 text-gold" />
            </span>
            <div className="leading-tight">
              <div className="font-display text-lg font-bold text-cream">אמונה וביטחון</div>
              <div className="text-[11px] text-cream/50">מרכז שליטה · CRM</div>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-sm">
            <CommandPalette />
            <Link
              href="/crm"
              className="flex items-center gap-2 rounded-full px-4 py-2 text-cream/80 transition-colors hover:bg-white/5 hover:text-gold"
            >
              <LayoutDashboard className="h-4 w-4" /> סקירה
            </Link>
            <LogoutButton />
          </nav>
        </div>
      </header>
      <div className="mx-auto max-w-7xl px-4 py-8">{children}</div>
    </div>
  );
}
