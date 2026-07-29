'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';
import { useToastStore, type Toast } from '@/store/toast';

const ICONS: Record<Toast['variant'], typeof Info> = {
  success: CheckCircle2,
  info: Info,
  error: AlertCircle,
};

const COLORS: Record<Toast['variant'], string> = {
  success: 'text-emerald-500',
  info: 'text-gold-soft',
  error: 'text-red-500',
};

export function Toaster() {
  const { toasts, dismiss } = useToastStore();

  return (
    <div aria-live="polite" className="pointer-events-none fixed bottom-24 left-1/2 z-[60] flex w-full max-w-sm -translate-x-1/2 flex-col items-center gap-2 px-4 lg:bottom-8">
      <AnimatePresence>
        {toasts.map((t) => {
          const Icon = ICONS[t.variant];
          return (
            <motion.div
              key={t.id}
              role="status"
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.95 }}
              className="pointer-events-auto flex w-full items-center gap-2.5 rounded-full border border-gold/25 bg-navy py-2.5 pe-3 ps-4 text-sm text-cream shadow-2xl"
            >
              <Icon className={`h-4 w-4 shrink-0 ${COLORS[t.variant]}`} />
              <span className="flex-1">{t.message}</span>
              <button onClick={() => dismiss(t.id)} aria-label="סגירת הודעה"
                className="rounded-full p-1 text-cream/40 hover:text-cream">
                <X className="h-3.5 w-3.5" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
