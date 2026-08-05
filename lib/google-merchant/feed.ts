// ============================================================
// פיד מוצרים ל-Google Merchant Center (RSS 2.0 / Google Product Feed).
// מקור אמת יחיד: PRODUCTS (lib/catalog) → נגזר מ-supplier-products.json.
// נבנה דינמית בכל בקשה/revalidate — אין רשימה ידנית, אין Mock.
//
// החלטות תקן (ראו reports/GOOGLE_MERCHANT_BASELINE_AUDIT.md):
// - brand = "אמונה וביטחון" (מותג הקמעונאי; אין מותג יצרן נפרד ליודאיקה גנרית).
// - mpn   = SKU הספק (קוד קטלוג ART Judaica) — מזהה חלק אמיתי; אין GTIN.
// - price = basePrice בלבד (מחיר לכלל הציבור). הטבת מועדון/קופון חלה ב-checkout
//   ואינה מחיר מבצע ציבורי → לא נשלח sale_price. אם בעתיד יוגדר discountPrice
//   ציבורי אמיתי — הוא ייכנס אוטומטית כ-sale_price.
// ============================================================

import { PRODUCTS, type CatalogProduct } from '@/lib/catalog';
import { googleCategoryForHe, productTypeFor } from '@/lib/google-merchant/category-map';

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://emunavebitachon.co.il').replace(/\/$/, '');
export const FEED_PATH = '/feeds/google-merchant.xml';
const BRAND = 'אמונה וביטחון';

export interface FeedItem {
  id: string;
  title: string;
  description: string;
  link: string;
  imageLink: string;
  availability: 'in_stock' | 'out_of_stock' | 'preorder';
  price: string; // "59.00 ILS"
  salePrice?: string;
  brand: string;
  mpn: string;
  condition: 'new';
  googleCategory: number;
  productType: string;
  color?: string;
  size?: string;
  material?: string;
}

function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return `${SITE_URL}${path.startsWith('/') ? '' : '/'}${path}`;
}

// ניקוי טקסט לפיד — הסרת תווי בקרה, כיווץ רווחים, בלי HTML. שומר עברית ופיסוק.
function cleanText(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/[\u0000-\u001F\u007F]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function availabilityFor(p: CatalogProduct): FeedItem['availability'] {
  if (p.stockStatus === 'coming-soon') return 'preorder';
  return 'in_stock';
}

function money(n: number): string {
  return `${n.toFixed(2)} ILS`;
}

// זכאות לפיד — רק מוצר אמיתי, פעיל, ניתן לרכישה, עם מחיר>0, קישור ותמונה.
export function isEligible(p: CatalogProduct): boolean {
  if (!p.slug || !p.sku) return false;
  if (!p.titleHe || !p.titleHe.trim()) return false;
  if (!p.imageUrl || !p.imageUrl.trim()) return false;
  if (!(p.basePrice > 0) || Number.isNaN(p.basePrice)) return false;
  return true;
}

export function toFeedItem(p: CatalogProduct): FeedItem {
  const gcat = googleCategoryForHe(p.category);
  const desc = cleanText(p.shortDescription || p.longDescription?.[0] || p.titleHe);
  const hasSale =
    typeof p.discountPrice === 'number' && p.discountPrice > 0 && p.discountPrice < p.basePrice;
  return {
    id: p.id, // "art-UK67651" — יציב וייחודי
    title: cleanText(p.titleHe).slice(0, 150),
    description: desc || cleanText(p.titleHe),
    link: `${SITE_URL}/product/${p.slug}`,
    imageLink: absoluteUrl(p.imageUrl ?? ''),
    availability: availabilityFor(p),
    price: money(p.basePrice),
    ...(hasSale ? { salePrice: money(p.discountPrice as number) } : {}),
    brand: BRAND,
    mpn: p.sku,
    condition: 'new',
    googleCategory: gcat.id,
    productType: productTypeFor(p.category, p.subcategory),
    ...(p.colors?.[0] ? { color: cleanText(p.colors[0]).slice(0, 100) } : {}),
    ...(p.dimensions ? { size: cleanText(p.dimensions).slice(0, 100) } : {}),
    ...(p.materials?.[0] && p.materials[0] !== '—' ? { material: cleanText(p.materials[0]).slice(0, 100) } : {}),
  };
}

export function buildFeedItems(): FeedItem[] {
  return PRODUCTS.filter(isEligible).map(toFeedItem);
}

// ---------- XML ----------

function xmlEscape(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function tag(name: string, value: string): string {
  return `<${name}>${xmlEscape(value)}</${name}>`;
}

function itemXml(it: FeedItem): string {
  const parts = [
    tag('g:id', it.id),
    tag('g:title', it.title),
    tag('g:description', it.description),
    tag('g:link', it.link),
    tag('g:image_link', it.imageLink),
    tag('g:availability', it.availability),
    tag('g:price', it.price),
    ...(it.salePrice ? [tag('g:sale_price', it.salePrice)] : []),
    tag('g:brand', it.brand),
    tag('g:mpn', it.mpn),
    tag('g:condition', it.condition),
    tag('g:google_product_category', String(it.googleCategory)),
    tag('g:product_type', it.productType),
    ...(it.color ? [tag('g:color', it.color)] : []),
    ...(it.size ? [tag('g:size', it.size)] : []),
    ...(it.material ? [tag('g:material', it.material)] : []),
  ];
  return `<item>\n    ${parts.join('\n    ')}\n  </item>`;
}

export function buildFeedXml(items: FeedItem[] = buildFeedItems()): string {
  const now = new Date().toUTCString();
  const head =
    `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<rss version="2.0" xmlns:g="http://base.google.com/ns/1.0">\n` +
    `<channel>\n` +
    `  ${tag('title', 'אמונה וביטחון — קטלוג מוצרים')}\n` +
    `  ${tag('link', SITE_URL)}\n` +
    `  ${tag('description', 'פיד מוצרים אוטומטי ל-Google Merchant Center — יודאיקה יוקרתית')}\n` +
    `  ${tag('lastBuildDate', now)}\n`;
  const body = items.map((it) => `  ${itemXml(it)}`).join('\n');
  return `${head}${body}\n</channel>\n</rss>\n`;
}

// ---------- Validation (מזין ניטור + Tests) ----------

export interface FeedIssue {
  id: string;
  field: string;
  problem: string;
}

export function validateFeed(items: FeedItem[] = buildFeedItems()): {
  count: number;
  issues: FeedIssue[];
  duplicates: string[];
} {
  const issues: FeedIssue[] = [];
  const seen = new Set<string>();
  const duplicates: string[] = [];

  for (const it of items) {
    if (seen.has(it.id)) duplicates.push(it.id);
    seen.add(it.id);
    if (!it.title) issues.push({ id: it.id, field: 'title', problem: 'ריק' });
    if (!it.description) issues.push({ id: it.id, field: 'description', problem: 'ריק' });
    if (!/^https:\/\//.test(it.link)) issues.push({ id: it.id, field: 'link', problem: 'לא HTTPS' });
    if (!/^https?:\/\//.test(it.imageLink)) issues.push({ id: it.id, field: 'image_link', problem: 'לא URL מלא' });
    const priceNum = parseFloat(it.price);
    if (!(priceNum > 0) || Number.isNaN(priceNum)) issues.push({ id: it.id, field: 'price', problem: 'מחיר לא תקין' });
    if (!/ ILS$/.test(it.price)) issues.push({ id: it.id, field: 'price', problem: 'מטבע לא ILS' });
    if (it.salePrice) {
      const saleNum = parseFloat(it.salePrice);
      if (!(saleNum < priceNum)) issues.push({ id: it.id, field: 'sale_price', problem: 'מבצע לא קטן מהמחיר' });
    }
    if (!it.brand) issues.push({ id: it.id, field: 'brand', problem: 'ריק' });
    if (!it.mpn) issues.push({ id: it.id, field: 'mpn', problem: 'ריק' });
  }

  return { count: items.length, issues, duplicates };
}
