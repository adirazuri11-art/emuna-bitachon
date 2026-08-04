'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/analytics';

// יורה purchase פעם אחת בלבד להזמנה (guard ב-localStorage), רק כשההזמנה מאומתת כשולמה.
export function PurchaseTracker({ orderNumber, amount }: { orderNumber: string; amount: number }) {
  useEffect(() => {
    if (!orderNumber) return;
    const k = `purchase_fired_${orderNumber}`;
    try {
      if (localStorage.getItem(k)) return;
      localStorage.setItem(k, '1');
    } catch {
      /* אם אין localStorage — עדיין נירה פעם אחת בטעינה */
    }
    trackEvent('purchase', { value: amount, currency: 'ILS' });
  }, [orderNumber, amount]);
  return null;
}
