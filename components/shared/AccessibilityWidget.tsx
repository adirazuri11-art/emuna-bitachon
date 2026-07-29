'use client';

// ווידג'ט נגישות — עומד בדרישות תקנות הנגישות (ת"י 5568 / WCAG 2.0 AA):
// שליטה בגודל טקסט, ניגודיות גבוהה, הדגשת קישורים, גופן קריא ועצירת אנימציות.
// ההעדפות נשמרות ב-localStorage ומוחלות על שורש המסמך.

import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Accessibility, Link2, Minus, Plus, RotateCcw, Type, X, Contrast, Zap } from 'lucide-react';

interface A11yState {
  fontScale: number; // 1 = רגיל
  contrast: boolean;
  links: boolean;
  readable: boolean;
  noMotion: boolean;
}

const DEFAULT: A11yState = { fontScale: 1, contrast: false, links: false, readable: false, noMotion: false };
const KEY = 'emuna-a11y';

function apply(s: A11yState) {
  const root = document.documentElement;
  root.style.setProperty('--a11y-font-scale', String(s.fontScale));
  root.classList.toggle('a11y-contrast', s.contrast);
  root.classList.toggle('a11y-links', s.links);
  root.classList.toggle('a11y-readable', s.readable);
  root.classList.toggle('a11y-no-motion', s.noMotion);
}

export function AccessibilityWidget() {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<A11yState>(DEFAULT);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY);
      if (saved) {
        const parsed = { ...DEFAULT, ...JSON.parse(saved) };
        setState(parsed);
        apply(parsed);
      }
    } catch {
      /* ignore */
    }
  }, []);

  const update = (patch: Partial<A11yState>) => {
    setState((prev) => {
      const next = { ...prev, ...patch };
      apply(next);
      localStorage.setItem(KEY, JSON.stringify(next));
      return next;
    });
  };

  const reset = () => {
    setState(DEFAULT);
    apply(DEFAULT);
    localStorage.removeItem(KEY);
  };

  const Toggle = ({ active, onClick, icon: Icon, label }: { active: boolean; onClick: () => void; icon: typeof Type; label: string }) => (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 text-sm transition-colors ${
        active ? 'border-gold bg-gold/15 font-bold text-navy' : 'border-navy/15 text-navy/70 hover:border-gold/60'
      }`}
    >
      <Icon className="h-4 w-4 shrink-0 text-gold-soft" /> {label}
    </button>
  );

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="הגדרות נגישות"
        aria-expanded={open}
        className="fixed bottom-24 left-6 z-40 flex h-12 w-12 items-center justify-center rounded-full border border-gold/40 bg-white text-navy shadow-card transition-transform hover:scale-110"
      >
        <Accessibility className="h-6 w-6" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.96 }}
            role="dialog"
            aria-label="תפריט נגישות"
            className="fixed bottom-40 left-6 z-40 w-72 rounded-2xl border border-gold/25 bg-white p-4 shadow-2xl"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="flex items-center gap-2 font-display text-base font-bold text-navy">
                <Accessibility className="h-5 w-5 text-gold-soft" /> נגישות
              </h2>
              <button onClick={() => setOpen(false)} aria-label="סגירה" className="rounded-full p-1 text-navy/50 hover:text-navy">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* גודל טקסט */}
            <div className="mb-3 flex items-center justify-between rounded-xl border border-navy/15 px-3 py-2">
              <span className="flex items-center gap-2 text-sm text-navy"><Type className="h-4 w-4 text-gold-soft" /> גודל טקסט</span>
              <div className="flex items-center gap-2">
                <button onClick={() => update({ fontScale: Math.max(1, +(state.fontScale - 0.1).toFixed(2)) })}
                  aria-label="הקטנת טקסט" className="rounded-full border border-navy/15 p-1 hover:border-gold">
                  <Minus className="h-3.5 w-3.5" />
                </button>
                <span className="w-10 text-center text-xs font-bold">{Math.round(state.fontScale * 100)}%</span>
                <button onClick={() => update({ fontScale: Math.min(1.5, +(state.fontScale + 0.1).toFixed(2)) })}
                  aria-label="הגדלת טקסט" className="rounded-full border border-navy/15 p-1 hover:border-gold">
                  <Plus className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Toggle active={state.contrast} onClick={() => update({ contrast: !state.contrast })} icon={Contrast} label="ניגודיות גבוהה" />
              <Toggle active={state.links} onClick={() => update({ links: !state.links })} icon={Link2} label="הדגשת קישורים" />
              <Toggle active={state.readable} onClick={() => update({ readable: !state.readable })} icon={Type} label="גופן קריא" />
              <Toggle active={state.noMotion} onClick={() => update({ noMotion: !state.noMotion })} icon={Zap} label="עצירת אנימציות" />
            </div>

            <button onClick={reset} className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl bg-navy py-2 text-sm font-medium text-cream hover:bg-gold hover:text-navy">
              <RotateCcw className="h-3.5 w-3.5" /> איפוס הגדרות
            </button>

            <a href="/accessibility" className="mt-2 block text-center text-xs text-gold-soft hover:underline">
              להצהרת הנגישות המלאה
            </a>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
