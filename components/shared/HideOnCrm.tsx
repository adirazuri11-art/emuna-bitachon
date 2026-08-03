'use client';

// Renders storefront chrome everywhere EXCEPT the /crm area, so the CRM
// gets a clean standalone shell. On storefront pages behaviour is identical
// (children render as before) — no impact on static generation.

import { usePathname } from 'next/navigation';

export function HideOnCrm({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname?.startsWith('/crm')) return null;
  return <>{children}</>;
}
