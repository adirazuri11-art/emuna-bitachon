'use client';

import { MessageCircle } from 'lucide-react';
import { trackEvent } from '@/lib/analytics';

// ערוץ ההמרה החזק ביותר בשוק הישראלי — חייב להיות זמין מכל מסך
const PHONE = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? '972503096969';
const MESSAGE = encodeURIComponent('שלום, אשמח לייעוץ אישי על מוצר מהאתר 🙏');

export function WhatsAppButton() {
  return (
    <a
      href={`https://wa.me/${PHONE}?text=${MESSAGE}`}
      target="_blank"
      rel="noopener noreferrer"
      onClick={() => trackEvent('whatsapp_click')}
      className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] shadow-lg transition-transform hover:scale-110"
      aria-label="דברו איתנו בוואטסאפ"
    >
      <MessageCircle className="h-7 w-7 fill-white text-white" />
    </a>
  );
}
