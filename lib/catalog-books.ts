// ============================================================
// ספרי יהדות — נגזרים מ-lib/books-data.json (155 כותרים).
// ⚠️ כותרים ומחברים אמיתיים; המחירים הערכות שוק להדגמה — לאמת מול הספק.
// כריכות: scripts/generate-book-covers.mjs
// ============================================================

import type { CatalogProduct, ProductBadge } from '@/lib/catalog';
import { EMBOSS_LEATHER } from '@/lib/customization-presets';
import booksData from '@/lib/books-data.json';

interface RawBook {
  id: string;
  t: string;
  a?: string;
  p: number;
  s: string;
  c?: string;
  cust?: boolean;
  b?: string;
}

const RAW = (booksData as { books: RawBook[] }).books;

// עד 3 מוצרים קשורים מאותה תת-קטגוריה
function related(book: RawBook): string[] {
  return RAW.filter((o) => o.s === book.s && o.id !== book.id)
    .slice(0, 3)
    .map((o) => `sefer-${o.id}`);
}

function toProduct(book: RawBook): CatalogProduct {
  const isKids = book.c === 'kids';
  const src = `/images/books/${book.id}.svg`;
  const byline = book.a ? ` מאת ${book.a}` : '';
  const canCustom = Boolean(book.cust);

  const shortDescription = canCustom
    ? `${book.t} — ניתן להוסיף הקדשה אישית מודפסת. מתנה מרגשת ומכובדת לכל אירוע.`
    : `${book.t}${byline} — מהדורה איכותית בכריכה עמידה, מוכנה למשלוח.`;

  const longDescription = [
    `${book.t}${byline}. מהדורה איכותית עם הדפסה ברורה ונעימה לקריאה, בכריכה עמידה לאורך שנים.`,
    canCustom
      ? 'ניתן להוסיף הקדשה אישית מודפסת — שם, תאריך וברכה — ולהפוך את הספר למתנה אישית שנשמרת לדורות.'
      : 'מתאים ללימוד יומי, לשולחן השבת ולמתנה. ניתן לצרף אריזת מתנה.',
  ];

  return {
    id: book.id,
    sku: `EB-SEF-${book.id.replace('bk', '')}`,
    slug: `sefer-${book.id}`,
    titleHe: book.t,
    imageUrl: src,
    category: isKids ? 'מוצרים לילדים' : 'ספרים וסידורים',
    subcategory: book.s,
    material: 'כריכה איכותית, נייר משובח',
    basePrice: book.p,
    isCustomizable: canCustom,
    iconKey: 'gift',
    isNew: false,
    shortDescription,
    longDescription,
    materials: ['כריכה איכותית', 'נייר משובח'],
    prepTimeDays: [1, 3],
    careInstructions: 'להרחיק מלחות ושמש ישירה.',
    tags: [book.s, 'ספר', ...(book.a ? [book.a] : []), ...(canCustom ? ['הקדשה אישית'] : [])],
    relatedSlugs: related(book),
    stockStatus: 'in-stock',
    badges: (book.b ? [book.b as ProductBadge] : []),
    audience: isKids ? ['kids'] : ['men', 'family'],
    ...(canCustom ? { customization: { ...EMBOSS_LEATHER, method: 'print' as const } } : {}),
    gallery: [
      { src, label: 'כריכה' },
      { src, label: 'תקריב', zoom: 1.6 },
    ],
    isPlaceholderImage: true,
  };
}

export const BOOK_PRODUCTS: CatalogProduct[] = RAW.map(toProduct);
