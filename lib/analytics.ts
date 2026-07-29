// ============================================================
// שכבת אנליטיקס המרות אחידה — GA4 + Meta Pixel
// כל אירוע מכירתי באתר עובר דרך trackEvent, כך שהוספת
// פלטפורמה (TikTok Pixel וכו') נעשית במקום אחד בלבד.
// ============================================================

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    fbq?: (...args: unknown[]) => void;
  }
}

export interface EcommerceItem {
  id: string;
  name: string;
  price: number;
  quantity?: number;
}

export type EventName =
  | 'view_item'
  | 'add_to_cart'
  | 'begin_checkout'
  | 'add_payment_info'
  | 'purchase'
  | 'search'
  | 'ai_assistant_open'
  | 'whatsapp_click'
  | 'gift_finder'
  | 'quote_request'
  | 'coupon_applied'
  | 'newsletter_signup';

// מיפוי לאירועים הסטנדרטיים של Meta (קריטי לאופטימיזציית קמפיינים)
const META_EVENTS: Partial<Record<EventName, string>> = {
  view_item: 'ViewContent',
  add_to_cart: 'AddToCart',
  begin_checkout: 'InitiateCheckout',
  add_payment_info: 'AddPaymentInfo',
  purchase: 'Purchase',
  search: 'Search',
  whatsapp_click: 'Contact',
};

export function trackEvent(
  name: EventName,
  params: { value?: number; items?: EcommerceItem[]; query?: string } = {}
) {
  if (typeof window === 'undefined') return;

  window.gtag?.('event', name, { currency: 'ILS', ...params });

  const metaEvent = META_EVENTS[name];
  if (metaEvent) {
    window.fbq?.('track', metaEvent, { currency: 'ILS', value: params.value });
  }

  if (process.env.NODE_ENV === 'development') {
    console.debug('[analytics]', name, params);
  }
}
