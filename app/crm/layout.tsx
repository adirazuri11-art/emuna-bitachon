import type { Metadata } from 'next';
import { LogoutButton } from './LogoutButton';
import { CommandPalette } from '@/components/crm/CommandPalette';
import { Sidebar } from '@/components/crm/Sidebar';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'מרכז השליטה · אמונה וביטחון',
  robots: { index: false, follow: false },
};

export default function CrmLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex bg-[#0F172A] text-cream" dir="rtl">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-gold/10 bg-[#0B132B]/95 px-5 py-3 backdrop-blur">
          <CommandPalette />
          <LogoutButton />
        </header>
        <main className="flex-1 overflow-y-auto px-5 py-8">
          <div className="mx-auto max-w-7xl">{children}</div>
        </main>
      </div>
    </div>
  );
}
