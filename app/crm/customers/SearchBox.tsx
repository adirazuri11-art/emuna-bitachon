'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { Search } from 'lucide-react';

export function SearchBox() {
  const router = useRouter();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        router.push(q.trim() ? `/crm/customers?q=${encodeURIComponent(q.trim())}` : '/crm/customers');
      }}
      className="relative w-full max-w-sm"
    >
      <Search className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cream/40" />
      <input
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="חיפוש לפי אימייל או קוד הטבה…"
        className="w-full rounded-full border border-gold/20 bg-white/5 px-4 py-2.5 pe-10 text-sm text-cream outline-none placeholder:text-cream/40 focus:border-gold"
      />
    </form>
  );
}
