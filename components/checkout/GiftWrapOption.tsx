'use client';

import { Gift } from 'lucide-react';
import { GIFT_WRAP_MAX_WORDS, GIFT_WRAP_PRICE } from '@/lib/gift-wrap';
import { formatPrice } from '@/lib/utils';

interface Props {
  selected: boolean;
  message: string;
  wordCount: number;
  error: string | null;
  onToggle: (selected: boolean) => void;
  onMessage: (message: string) => void;
}

export function GiftWrapOption({ selected, message, wordCount, error, onToggle, onMessage }: Props) {
  const over = wordCount > GIFT_WRAP_MAX_WORDS;

  return (
    <section className="mt-8 rounded-2xl border border-gold/25 bg-white p-5 shadow-card">
      <label className="flex cursor-pointer items-start gap-3">
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => onToggle(e.target.checked)}
          className="mt-1 h-5 w-5 shrink-0 accent-gold-soft"
        />
        <span className="flex-1">
          <span className="flex items-center gap-2 font-display text-base font-bold text-navy">
            <Gift className="h-4 w-4 text-gold-soft" />
            אריזת מתנה + כרטיס ברכה אישי
            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-sm font-bold text-navy">
              {formatPrice(GIFT_WRAP_PRICE)}
            </span>
          </span>
          <span className="mt-1 block text-sm text-navy/60">
            נארוז את ההזמנה כמתנה ונצרף כרטיס עם הברכה האישית שלכם.
          </span>
        </span>
      </label>

      {selected && (
        <div className="mt-4">
          <label htmlFor="gift-message" className="mb-1 block text-sm font-medium text-navy">
            מה תרצו שנכתוב בכרטיס הברכה?
          </label>
          <textarea
            id="gift-message"
            value={message}
            onChange={(e) => onMessage(e.target.value)}
            rows={4}
            dir="rtl"
            placeholder="כתבו כאן את הברכה האישית שלכם..."
            aria-describedby="gift-message-counter gift-message-help gift-message-error"
            aria-invalid={!!error}
            className={
              'gold-ring w-full resize-y rounded-xl border bg-white px-4 py-3 text-sm text-navy outline-none ' +
              (error ? 'border-red-400' : 'border-navy/15')
            }
          />
          <div className="mt-1.5 flex items-center justify-between text-xs">
            <span id="gift-message-help" className="text-navy/45">עד {GIFT_WRAP_MAX_WORDS} מילים</span>
            <span
              id="gift-message-counter"
              aria-live="polite"
              className={over ? 'font-bold text-red-600' : 'text-navy/55'}
            >
              {wordCount} מתוך {GIFT_WRAP_MAX_WORDS} מילים
            </span>
          </div>
          <p
            id="gift-message-error"
            role="alert"
            className={'mt-1 text-xs text-red-600 ' + (error ? '' : 'sr-only')}
          >
            {error ?? ''}
          </p>
        </div>
      )}
    </section>
  );
}
