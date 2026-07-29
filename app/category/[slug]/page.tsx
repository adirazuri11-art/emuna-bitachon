import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import { ACTIVE_CATEGORIES, getCategory, getProductsByCategory, getSubcategories } from '@/lib/catalog';
import { CategoryClient } from '@/components/category/CategoryClient';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// מפת SEO פר-קטגוריה — כותרות ותיאורים עשירי מילות-מפתח (מבוססי מחקר שוק אמיתי).
// הכותרת מקבלת אוטומטית " | אמונה וביטחון" מתבנית ה-root, לכן לא כוללים כאן את המותג.
type CategorySeo = { title: string; description: string; keywords: string[] };
const CATEGORY_SEO: Record<string, CategorySeo> = {
  kippot: {
    title: 'כיפות לאירועים ובהתאמה אישית — בר מצווה, חתונה, ברית',
    description:
      'מבחר כיפות לאירועים עם הטבעה ורקמה אישית: סאטן, קטיפה, עור וכיפות סרוגות. הדפסת שם, תאריך ולוגו לבר מצווה, חתונה וברית — מינימום נמוך ומשלוח מהיר לכל הארץ.',
    keywords: ['כיפות לאירועים', 'כיפות בהתאמה אישית', 'כיפות לבר מצווה', 'כיפות ממותגות', 'הדפסה על כיפות', 'רקמה על כיפות', 'כיפות סאטן', 'כיפות סרוגות'],
  },
  'kiddush-cups': {
    title: 'כוסות וגביעי קידוש מכסף — לשבת, חג ואירועים',
    description:
      'גביעי קידוש מכסף 925 ומצופים, כוסות קידוש מהודרות עם תחתית תואמת. מתנה מושלמת לחתונה, בר מצווה וברית — עם אפשרות חריטה אישית ומשלוח מהיר.',
    keywords: ['כוס קידוש', 'גביע קידוש כסף', 'גביע קידוש 925', 'כוס קידוש לחתונה', 'כוס קידוש מעוצבת'],
  },
  mezuzot: {
    title: 'מזוזות מהודרות ומעוצבות — בית מזוזה לכל פתח',
    description:
      'מבחר מזוזות מעוצבות ובתי מזוזה מכסף, זכוכית ומתכת בגדלים 7–15 ס״מ. לדלת הכניסה ולמתנה לבית חדש — בעיצוב מהודר ובהתאמה אישית.',
    keywords: ['מזוזה', 'מזוזה מהודרת', 'מזוזה מעוצבת', 'בית מזוזה', 'מזוזה מכסף', 'מתנה לבית חדש'],
  },
  candlesticks: {
    title: 'פמוטי שבת ופמוטים מעוצבים — כסף וקלאסי',
    description:
      'פמוטי שבת מהודרים בעיצוב קלאסי ומודרני, זוגות פמוטים ופמוטרים. מתנה מרגשת לחתונה ולבית — גימור כסף איכותי ומשלוח מהיר.',
    keywords: ['פמוטי שבת', 'פמוטים', 'פמוטי כסף', 'פמוטים לחתונה', 'פמוטרים'],
  },
  'challah-covers': {
    title: 'כיסויי חלה מעוצבים — סאטן, קטיפה ורקמה',
    description:
      'כיסויי חלה מהודרים לשבת וחג בעיצובים קלאסיים ומודרניים, עם רקמה ואפשרות שם אישי. משלימים כל שולחן שבת — במחיר משתלם.',
    keywords: ['כיסוי חלה', 'כיסוי חלה מעוצב', 'כיסוי חלה לשבת', 'מפת חלה'],
  },
  'tzitzit-tallit': {
    title: 'טליתות וציציות — מהודרות ובעיצוב אישי',
    description:
      'מבחר טליתות צמר ומשי, ציציות וכיסויי טלית עם רקמה אישית. טלית לבר מצווה ולחתן — בכשרות מהודרת ומשלוח מהיר לכל הארץ.',
    keywords: ['טלית', 'טלית לבר מצווה', 'ציצית', 'כיסוי טלית', 'טלית צמר', 'טלית משי'],
  },
  havdalah: {
    title: 'סטים ומבזמי הבדלה — כסף ומעוצב',
    description:
      'סטים מלאים להבדלה: בשמים, נר הבדלה ומעמד ומבזמי כסף בעיצוב מהודר. תשמיש קדושה ומתנה משמעותית לכל בית יהודי.',
    keywords: ['הבדלה', 'סט הבדלה', 'מבזם בשמים', 'בשמים להבדלה', 'נר הבדלה'],
  },
  'washing-cups': {
    title: 'נטלות ומים אחרונים — כסף ומעוצב',
    description:
      'נטלות נטילת ידיים וכלי מים אחרונים בעיצוב מהודר מכסף ומתכת. איכותי, עמיד ומתנה מושלמת לבית יהודי — משלוח מהיר.',
    keywords: ['נטלה', 'נטלת ידיים', 'כלי נטילה', 'מים אחרונים'],
  },
  'gifts-events': {
    title: 'מתנות יהודיות לבר מצווה, חתונה וברית',
    description:
      'מתנות יודאיקה מרגשות לכל אירוע — בר מצווה, בת מצווה, חתונה, ברית ובית חדש. עם התאמה אישית, אריזת מתנה ומשלוח מהיר לכל הארץ.',
    keywords: ['מתנות יהודיות', 'מתנות לבר מצווה', 'מתנה לחתונה', 'מתנה לברית', 'מתנות יודאיקה', 'מתנה לבית חדש'],
  },
  'brit-newborn': {
    title: 'מתנות לברית וללידה — יודאיקה לרך הנולד',
    description:
      'מתנות מרגשות לברית מילה וללידה: כיפות, סידורים ותשמישי קדושה בהתאמה אישית לרך הנולד. אריזת מתנה ומשלוח מהיר.',
    keywords: ['מתנות לברית', 'מתנה ללידה', 'יודאיקה לתינוק', 'מתנה לרך הנולד'],
  },
  'books-siddurim': {
    title: 'סידורים וספרי קודש — עם הטבעת שם אישית',
    description:
      'סידורים, תהילים וברכונים מהודרים בכריכת עור עם הטבעת שם. מתנה קלאסית לבר מצווה, חתונה וכל שמחה — משלוח מהיר.',
    keywords: ['סידור', 'סידור עם שם', 'ברכון', 'תהילים', 'ספרי קודש', 'סידור לבר מצווה'],
  },
  blessings: {
    title: 'ברכות ותמונות ברכה — ברכת הבית ומעוצבות',
    description:
      'ברכות מעוצבות לבית ולעסק — ברכת הבית, ברכת העסק ותמונות ברכה. מתנה מרגשת לחנוכת בית ולפתיחת עסק — משלוח מהיר.',
    keywords: ['ברכת הבית', 'ברכות', 'תמונת ברכה', 'ברכה לעסק', 'ברכת הבית מעוצבת'],
  },
  kids: {
    title: 'יודאיקה ומתנות לילדים — כיפות וסידורים',
    description:
      'מוצרי יודאיקה לילדים: כיפות ילדים, סידורים ומתנות לבר/בת מצווה בעיצובים חמים ואיכותיים — בהתאמה אישית ומשלוח מהיר.',
    keywords: ['כיפות ילדים', 'יודאיקה לילדים', 'מתנות לילדים', 'סידור לילד'],
  },
};

export function generateStaticParams() {
  return ACTIVE_CATEGORIES.map((c) => ({ slug: c.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const category = getCategory(params.slug);
  if (!category) return {};
  const seo = CATEGORY_SEO[category.slug];
  const title = seo?.title ?? category.nameHe;
  const description = seo?.description ?? category.description;
  return {
    title,
    description,
    ...(seo?.keywords ? { keywords: seo.keywords } : {}),
    alternates: { canonical: `/category/${category.slug}` },
    openGraph: {
      title: `${title} | אמונה וביטחון`,
      description,
      locale: 'he_IL',
      type: 'website',
    },
  };
}

// שאלות נפוצות לקטגוריה — תוכן אמיתי וגנרי (לא הבטחות מומצאות)
const categoryFaq = (nameHe: string) => [
  {
    q: `כמה זמן לוקח משלוח של ${nameHe}?`,
    a: 'מוצרים במלאי נשלחים תוך 1–3 ימי עסקים. מוצרים בייצור לפי הזמנה או עם התאמה אישית — זמן ההכנה המדויק מופיע בעמוד כל מוצר.',
  },
  {
    q: 'אפשר להוסיף התאמה אישית?',
    a: 'מוצרים עם תג "התאמה אישית" כוללים קסטומייזר מלא בעמוד המוצר — טקסט, גופן, צבע ותצוגה מקדימה חיה. ההתאמה מתומחרת בשקיפות לפני ההוספה לסל.',
  },
  {
    q: 'מזמינים בכמות לאירוע או מוסד?',
    a: 'בשמחה — יש לנו הנחות כמות מדורגות ומסלול הצעת מחיר מהיר. לחצו על "הזמנה בכמות" ותקבלו מענה אישי בוואטסאפ.',
  },
];

export default function CategoryPage({ params }: { params: { slug: string } }) {
  const category = getCategory(params.slug);
  if (!category) notFound();

  const products = getProductsByCategory(params.slug);
  if (products.length === 0) notFound(); // קטגוריה ריקה — לא מוצגת

  const subcategories = getSubcategories(params.slug);
  const faq = categoryFaq(category.nameHe);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ראשי', item: SITE_URL },
          { '@type': 'ListItem', position: 2, name: category.nameHe },
        ],
      },
      {
        '@type': 'FAQPage',
        mainEntity: faq.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero קטגוריה */}
      <section className="relative overflow-hidden bg-navy-deep py-14 text-center">
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute -top-20 start-1/3 h-72 w-72 rounded-full bg-gold/10 blur-[100px]" />
        </div>
        <div className="relative mx-auto max-w-2xl px-4">
          <nav aria-label="ניווט משנה" className="mb-3 text-xs text-cream/50">
            <Link href="/" className="hover:text-gold">ראשי</Link>
            <span className="mx-1.5">/</span>
            <span className="text-cream/80">{category.nameHe}</span>
          </nav>
          <h1 className="font-display text-4xl font-bold text-cream">{category.nameHe}</h1>
          <p className="mt-2 text-gold">{category.tagline}</p>
          <p className="mx-auto mt-3 max-w-xl text-sm leading-relaxed text-cream/60">{category.description}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/quote"
              className="rounded-full border border-gold/40 px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-gold/10">
              הזמנה בכמות לאירועים ↵
            </Link>
            <Link href="/gift-finder"
              className="rounded-full border border-gold/40 px-5 py-2 text-sm font-medium text-cream transition-colors hover:bg-gold/10">
              עזרו לי לבחור מתנה ✨
            </Link>
          </div>
        </div>
      </section>

      <Suspense fallback={<div className="mx-auto max-w-7xl px-4 py-10"><div className="skeleton h-8 w-full rounded-full" /></div>}>
        <CategoryClient products={products} subcategories={subcategories} />
      </Suspense>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <h2 className="mb-6 text-center font-display text-2xl font-bold text-navy">שאלות נפוצות — {category.nameHe}</h2>
        <div className="divide-y divide-navy/10 rounded-2xl border border-gold/20 bg-white px-5 shadow-card">
          {faq.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none font-medium text-navy [&::-webkit-details-marker]:hidden">
                {f.q}
              </summary>
              <p className="pt-2 text-sm leading-relaxed text-navy/70">{f.a}</p>
            </details>
          ))}
        </div>
      </section>
    </>
  );
}
