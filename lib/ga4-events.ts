// GA4 Events Configuration

export const GA4_EVENTS = {
  // Product Events
  VIEW_PRODUCT: 'view_product',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  VIEW_CART: 'view_cart',
  BEGIN_CHECKOUT: 'begin_checkout',
  ADD_SHIPPING_INFO: 'add_shipping_info',
  ADD_PAYMENT_INFO: 'add_payment_info',
  PURCHASE: 'purchase',
  REFUND: 'refund',

  // Engagement
  SEARCH: 'search',
  VIEW_ITEM_LIST: 'view_item_list',
  SELECT_ITEM: 'select_item',

  // Club & Newsletter
  SIGN_UP: 'sign_up',
  JOIN_CLUB: 'join_club',
  VIEW_PROMOTION: 'view_promotion',
  SELECT_PROMOTION: 'select_promotion',

  // Custom Events
  CONTACT_WHATSAPP: 'contact_whatsapp',
  USE_COUPON: 'use_coupon',
  CUSTOMIZE_PRODUCT: 'customize_product',
  VIEW_HALACHIC_INFO: 'view_halachic_info',
};

// Helper function to send GA4 events
export function trackEvent(
  eventName: string,
  eventData: Record<string, any> = {}
) {
  if (typeof window === 'undefined') return;

  const gtag = (window as any).gtag;
  if (!gtag) return;

  gtag('event', eventName, eventData);
}

// Product view tracking
export function trackProductView(productId: string, productName: string, category: string, price: number) {
  trackEvent(GA4_EVENTS.VIEW_PRODUCT, {
    items: [
      {
        item_id: productId,
        item_name: productName,
        item_category: category,
        price: price,
        currency: 'ILS',
      },
    ],
  });
}

// Add to cart tracking
export function trackAddToCart(productId: string, productName: string, price: number, quantity: number = 1) {
  trackEvent(GA4_EVENTS.ADD_TO_CART, {
    items: [
      {
        item_id: productId,
        item_name: productName,
        price: price,
        quantity: quantity,
        currency: 'ILS',
      },
    ],
    value: price * quantity,
  });
}

// Purchase tracking (checkout conversion)
export function trackPurchase(
  transactionId: string,
  items: Array<{ id: string; name: string; price: number; quantity: number }>,
  totalValue: number,
  shippingCost: number = 0,
  couponCode?: string
) {
  trackEvent(GA4_EVENTS.PURCHASE, {
    transaction_id: transactionId,
    affiliation: 'emuna-bitachon',
    value: totalValue,
    currency: 'ILS',
    tax: 0,
    shipping: shippingCost,
    items: items.map((item) => ({
      item_id: item.id,
      item_name: item.name,
      price: item.price,
      quantity: item.quantity,
      currency: 'ILS',
    })),
    coupon: couponCode,
  });
}

// Club signup tracking
export function trackClubSignup(email: string) {
  trackEvent(GA4_EVENTS.JOIN_CLUB, {
    email: email,
    method: 'newsletter_popup',
  });
}

// Search tracking
export function trackSearch(searchQuery: string, resultsCount: number) {
  trackEvent(GA4_EVENTS.SEARCH, {
    search_term: searchQuery,
    results_count: resultsCount,
  });
}

// Coupon tracking
export function trackCouponUsed(couponCode: string, discountValue: number) {
  trackEvent(GA4_EVENTS.USE_COUPON, {
    coupon_code: couponCode,
    discount_value: discountValue,
    currency: 'ILS',
  });
}

// WhatsApp contact tracking
export function trackWhatsAppContact(productName?: string) {
  trackEvent(GA4_EVENTS.CONTACT_WHATSAPP, {
    product_name: productName || 'general_inquiry',
  });
}

// Customization tracking
export function trackCustomizeProduct(productId: string, productName: string, customizationType: string) {
  trackEvent(GA4_EVENTS.CUSTOMIZE_PRODUCT, {
    item_id: productId,
    item_name: productName,
    customization_type: customizationType,
  });
}
