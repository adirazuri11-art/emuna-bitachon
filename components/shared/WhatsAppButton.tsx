'use client';

import { MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { trackEvent } from '@/lib/analytics';

// ערוץ ההמרה החזק ביותר בשוק הישראלי — חייב להיות זמין מכל מסך
const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '972503096969';
const MESSAGE = encodeURIComponent('שלום, אשמח לייעוץ אישי על מוצר מהאתר 🙏');

export function WhatsAppButton() {
  // נעלם בגלילה למטה (בזמן עיון) וחוזר בגלילה למעלה או ליד ראש העמוד —
  // כדי לא להסתיר מוצרים/קטגוריות במובייל.
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      if (y > last + 8 && y > 220) setHidden(true);
      else if (y < last - 8 || y < 140) setHidden(false);
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <a
      href={`https://wa.me/${PHONE}?text=${MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('whatsapp_click')}
      className={
        'fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-all duration-300 hover:scale-110 ' +
        (hidden ? 'pointer-events-none translate-y-24 opacity-0' : 'opacity-100')
      }
      aria-label="דברו איתנו בוואטסאפ"
    >
      <MessageCircle className="h-7 w-7 fill-white text-white" />
    </a>
  );
}
