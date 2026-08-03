'use client';

import { LogOut } from 'lucide-react';

export function LogoutButton() {
  const logout = async () => {
    try {
      await fetch('/api/crm/auth', { method: 'DELETE' });
    } finally {
      window.location.href = '/crm/login';
    }
  };
  return (
    <button
      onClick={logout}
      className="flex items-center gap-2 rounded-full px-4 py-2 text-cream/60 transition-colors hover:bg-white/5 hover:text-gold"
    >
      <LogOut className="h-4 w-4" /> התנתקות
    </button>
  );
}
