// ============================================================
// lib/pricing.ts — מנוע התמחור הדינמי (מקור אמת יחיד)
// כל מחיר שמוצג באתר — בכרטיס, בקסטומייזר, בסל ובצ'קאאוט —
// מחושב כאן בלבד. אין לכתוב חישובי מחיר בקומפוננטות.
// ============================================================

import type { CatalogProduct } from '@/lib/catalog';

export interface CustomizationSelections {
  text?: string;
  symbolId?: string;
  hasLogo?: boolean;
  giftWrap?: boolean;
  matchingBag?: boolean;
}

export interface PriceInput {
  product: CatalogProduct;
  variantSelections?: Record<string, string>; // groupId -> optionId
  customization?: CustomizationSelections;
  quantity?: number;
}

export interface PriceLine {
  label: string;
  amount: number; // ליחידה
}

export interface PriceResult {
  unitPrice: number;
  lines: PriceLine[]; // פירוט ליחידה
  quantity: number;
  bulkDiscountPct: number;
  subtotal: number; // לפני הנחת כמות
  discountAmount: number;
  total: number;
}

export function computePrice({
  product,
  variantSelections = {},
  customization = {},
  quantity = 1,
}: PriceInput): PriceResult {
  const lines: PriceLine[] = [];
  const base = product.discountPrice ?? product.basePrice;
  lines.push({ label: 'מחיר בסיס', amount: base });

  // תוספות וריאציה (מידה / בד / צבע)
  for (const group of product.variantGroups ?? []) {
    const selectedId = variantSelections[group.id];
    const option = group.options.find((o) => o.id === selectedId);
    if (option && option.priceDelta !== 0) {
      lines.push({ label: `${group.label}: ${option.label}`, amount: option.priceDelta });
    }
  }

  // תוספות התאמה אישית
  const cfg = product.customization;
  if (cfg) {
    if (customization.text?.trim() && cfg.surcharges.text > 0) {
      lines.push({ label: 'טקסט אישי', amount: cfg.surcharges.text });
    }
    if (customization.symbolId && cfg.surcharges.symbol > 0) {
      lines.push({ label: 'סמל מהגלריה', amount: cfg.surcharges.symbol });
    }
    if (customization.hasLogo && cfg.allowLogoUpload && cfg.surcharges.logo > 0) {
      lines.push({ label: 'לוגו אישי', amount: cfg.surcharges.logo });
    }
    if (customization.giftWrap && cfg.surcharges.giftWrap > 0) {
      lines.push({ label: 'אריזת מתנה', amount: cfg.surcharges.giftWrap });
    }
    if (customization.matchingBag && cfg.surcharges.matchingBag) {
      lines.push({ label: 'נרתיק עם רקמה תואמת', amount: cfg.surcharges.matchingBag });
    }
  }

  const unitPrice = lines.reduce((s, l) => s + l.amount, 0);

  // הנחת כמות (הגבוהה ביותר שמתקיימת)
  const bulkDiscountPct =
    (cfg?.bulkDiscounts ?? [])
      .filter((d) => quantity >= d.minQty)
      .reduce((max, d) => Math.max(max, d.pct), 0) ?? 0;

  const subtotal = unitPrice * quantity;
  const discountAmount = Math.round((subtotal * bulkDiscountPct) / 100);

  return {
    unitPrice,
    lines,
    quantity,
    bulkDiscountPct,
    subtotal,
    discountAmount,
    total: subtotal - discountAmount,
  };
}

/** ההנחה הבאה שמשתלמת — לחיווי "הוסיפו עוד X יחידות ל-Y% הנחה" */
export function nextBulkTier(product: CatalogProduct, quantity: number) {
  const tiers = product.customization?.bulkDiscounts ?? [];
  return tiers
    .filter((t) => quantity < t.minQty)
    .sort((a, b) => a.minQty - b.minQty)[0];
}
