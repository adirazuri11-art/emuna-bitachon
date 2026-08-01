import Link from 'next/link';
import { Building2, Gift, PenLine, Sparkles } from 'lucide-react';
import { Hero } from '@/components/home/Hero';
import { TrustSection } from '@/components/home/TrustSection';
import { TrustAndSocialProof } from '@/components/cro/TrustAndSocialProof';
import { CategoriesShowcase } from '@/components/home/CategoriesShowcase';
import { LivingTradition } from '@/components/home/LivingTradition';
import { NewsletterClub } from '@/components/home/NewsletterClub';
import { ProductCard } from '@/components/products/ProductCard';
import { getHomepageContext } from '@/lib/hebcal';
import { PRODUCTS } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// דף הבית הדינמי: התוכן מוכתב ע"י הלוח העברי (Hebcal).
// כל הרצועות נגזרות מהקטלוג — אפס מוצרים קשיחים בקומפוננטה.

const pick = (list: typeof PRODUCTS, n = 4) => (list.length >= n ? list : PRODUCTS).slice(0, n);
const bestsellers = pick(PRODUCTS.filter((p) => p.badges.includes('bestseller')));
const newArrivals = pick(PRODUCTS.filter((p) => p.isNew));
const recommended = pick(PRODUCTS.filter((p) => p.badges.includes('recommended')));

const HOME_FAQ = [
  {
    q: 'כמה זמן לוקח להכין מוצר בהתאמה אישית?',
    a: 'רוב מוצרי הרקמה, החריטה וההטבעה מוכנים תוך 3–10 ימי עסקים. זמן מדויק מופיע בעמוד כל מוצר, ובאירועים דחופים אפשר לבדוק זירוז בוואטסאפ.',
  },
  {
    q: 'האם אפשר להזמין כמויות לאירוע או לעסק?',
    a: 'כן — כיפות לאירועים, מתנות לעובדים והזמנות מרוכזות למוסדות, עם הנחות כמות מדורגות ומיתוג מלא. ממלאים בקשת הצעת מחיר ואנחנו חוזרים אליכם.',
  },
  {
    q: 'מה מדיניות ההחזרות?',
    a: 'מוצרים רגילים ניתנים להחזרה תוך 30 יום. מוצרים בהתאמה אישית (שם, תאריך, לוגו) מיוצרים במיוחד עבורכם ואינם ניתנים להחזרה — למעט פגם בייצור, שמזכה בתיקון או החלפה.',
  },
  {
    q: 'המוצרים מגיעים עם אישורי כשרות?',
    a: 'מוצרים הדורשים אישור הלכתי (סת"ם, ציציות, תפילין) מגיעים עם תעודה מהגורם המוסמך, ששמו מופיע בעמוד המוצר.',
  },
];

function buildJsonLd() {
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': `${SITE_URL}/#organization`,
        name: 'אמונה וביטחון',
        url: SITE_URL,
        logo: `${SITE_URL}/brand/emuna-vebitachon-logo.png`,
        description:
          'חנות יודאיקה יוקרתית בהתאמה אישית — כיפות לאירועים, גביעי קידוש מכסף, מזוזות מהודרות, טליתות, פמוטי שבת ומתנות יהודיות',
        sameAs: [
          'https://www.instagram.com/emunavebitachon',
          'https://www.whatsapp.com',
        ],
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'Customer Support',
          telephone: process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ? `+${process.env.NEXT_PUBLIC_WHATSAPP_NUMBER.replace(/^972/, '972')}` : '+972-50-3096969',
          email: 'support@emunavebitachon.co.il',
        },
      },
      {
        '@type': 'OnlineStore',
        '@id': `${SITE_URL}/#store`,
        name: 'אמונה וביטחון',
        url: SITE_URL,
        logo: `${SITE_URL}/brand/emuna-vebitachon-logo.png`,
        image: `${SITE_URL}/brand/emuna-vebitachon-logo.png`,
        description:
          'חנות יודאיקה יוקרתית בהתאמה אישית — כיפות לאירועים, גביעי קידוש מכסף, מזוזות מהודרות, טליתות, פמוטי שבת ומתנות יהודיות',
        areaServed: 'IL',
        currenciesAccepted: 'ILS',
      },
      {
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#website`,
        name: 'אמונה וביטחון',
        url: SITE_URL,
        inLanguage: 'he-IL',
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'ItemList',
        itemListElement: bestsellers.map((p, i) => ({
          '@type': 'ListItem',
          position: i + 1,
          item: {
            '@type': 'Product',
            name: p.titleHe,
            url: `${SITE_URL}/product/${p.slug}`,
            image: `${SITE_URL}${p.imageUrl}`,
            offers: {
              '@type': 'Offer',
              price: p.discountPrice ?? p.basePrice,
              priceCurrency: 'ILS',
              availability: 'https://schema.org/InStock',
            },
          },
        })),
      },
      {
        '@type': 'FAQPage',
        mainEntity: HOME_FAQ.map((f) => ({
          '@type': 'Question',
          name: f.q,
          acceptedAnswer: { '@type': 'Answer', text: f.a },
        })),
      },
    ],
  };
}

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8 text-center">
      <span className="text-sm font-medium text-gold-soft">{eyebrow}</span>
      <h2 className="mt-1 font-display text-3xl font-bold text-navy">{title}</h2>
      <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-l from-transparent via-gold to-transparent" />
    </div>
  );
}

export default async function HomePage() {
  const context = await getHomepageContext();

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(buildJsonLd()) }} />
      <Hero {...context.hero} />

      {/* פס דינמי לפי הלוח העברי */}
      {context.mode === 'shabbat' && context.shabbat?.candleLighting && (
        <div className="border-b border-gold/20 bg-gold/10 py-2.5 text-center text-sm font-medium text-navy">
          🕯️ {context.shabbat.parsha ? `שבת ${context.shabbat.parsha} · ` : ''}
          הדלקת נרות בירושלים: {context.shabbat.candleLighting} · הזמנות עד חמישי 14:00 יגיעו לפני שבת
        </div>
      )}
      {context.mode === 'holiday' && context.holiday && (
        <div className="border-b border-gold/20 bg-gold/10 py-2.5 text-center text-sm font-medium text-navy">
          ✨ {context.holiday.titleHe} בעוד {context.holiday.daysUntil} ימים — הקולקציה המיוחדת כבר כאן
        </div>
      )}

      {/* מאתר המתנות — ראשון באתר */}
      <section className="mx-auto max-w-7xl px-4 pt-8 pb-12">
        <div className="relative overflow-hidden rounded-3xl bg-navy-deep px-6 py-12 text-center">
          <div className="pointer-events-none absolute -top-16 start-1/4 h-64 w-64 rounded-full bg-gold/15 blur-[90px]" />
          <Gift className="mx-auto h-10 w-10 text-gold" strokeWidth={1.4} />
          <h2 className="mt-3 font-display text-3xl font-bold text-cream md:text-4xl">לא יודעים מה לקנות?</h2>
          <p className="mx-auto mt-2 max-w-md text-cream/60">
            עונים על 4 שאלות קצרות — למי, לאיזה אירוע, באיזה תקציב — ומקבלים את המתנות המדויקות מתוך הקטלוג.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href="/gift-finder"
              className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-8 py-3.5 text-lg font-bold text-navy shadow-gold transition-transform hover:scale-[1.03]">
              למאתר המתנה המושלמת ✨
            </Link>
          </div>
          {/* מתנות לפי תקציב */}
          <div className="mt-6 flex flex-wrap justify-center gap-2 text-sm">
            <span className="py-1.5 text-cream/50">או לפי תקציב:</span>
            {[['עד ₪100', 'מתנה עד 100'], ['עד ₪250', 'מתנה עד 250'], ['יוקרתי', 'יוקרתי']].map(([label, q]) => (
              <Link key={label} href={`/search?q=${encodeURIComponent(q)}`}
                className="rounded-full border border-gold/30 px-4 py-1.5 text-cream/80 transition-colors hover:bg-gold/10">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <CategoriesShowcase />

      {/* רבי-מכר */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <SectionTitle eyebrow="הלקוחות בחרו" title="רבי-המכר שלנו" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* שובר מתנה — באנר */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <Link href="/gift-card"
          className="group flex flex-col items-center justify-between gap-5 overflow-hidden rounded-3xl border border-gold/25 bg-white p-6 shadow-card transition-shadow hover:shadow-gold md:flex-row md:p-8 md:text-start">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy to-navy-light">
              <Gift className="h-7 w-7 text-gold" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-navy md:text-2xl">שובר מתנה דיגיטלי</h2>
              <p className="mt-1 text-sm text-navy/60">
                לא בטוחים מה יאהבו? תנו להם לבחור — שובר לכל מוצר באתר, עם ברכה אישית.
              </p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-gradient-to-l from-gold to-gold-soft px-7 py-3 font-bold text-navy shadow-gold transition-transform group-hover:scale-[1.03]">
            להזמנת שובר 🎁
          </span>
        </Link>
      </section>

      {/* חדשים */}
      <section className="mx-auto max-w-7xl px-4 pb-14">
        <SectionTitle eyebrow="הצטרפו עכשיו לקטלוג" title="חדשים על המדף" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {newArrivals.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      {/* Trust & Social Proof */}
      <TrustAndSocialProof />

      {/* מומלצים במיוחד */}
      <section className="border-y border-gold/15 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle eyebrow="נבחרו בקפידה" title="מומלצים במיוחד" />
          <p className="mx-auto -mt-4 mb-8 max-w-xl text-center text-sm text-navy/60">
            הפריטים שהלקוחות שלנו הכי אוהבים — כלי קודש ומתנות באיכות מהודרת, מוכנים למשלוח.
          </p>
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {recommended.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
          <div className="mt-8 text-center">
            <Link href="/search"
              className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-7 py-2.5 font-bold text-navy hover:bg-gold/10">
              <PenLine className="h-4 w-4 text-gold-soft" /> לכל הקטלוג
            </Link>
          </div>
        </div>
      </section>

      {/* סיפור המותג */}
      <section className="mx-auto max-w-3xl px-4 py-16 text-center">
        <SectionTitle eyebrow="הסיפור שלנו" title="יודאיקה עם נשמה" />
        <p className="leading-relaxed text-navy/70">
          "אמונה וביטחון" נולד מאהבה לחפצים שמלווים רגעים קדושים: הגביע שעובר בקידוש מיד ליד,
          הטלית שמתעטפים בה בפעם הראשונה, המזוזה שנקבעת בבית חדש. אנחנו עובדים עם אומנים ובתי
          מלאכה שמבינים שכלי קודש הוא לא עוד מוצר — ומוסיפים לו את השם, התאריך וההקדשה שהופכים
          אותו לשלכם. מהכיפה הראשונה של הילד ועד רימוני ספר התורה של הקהילה.
        </p>
      </section>

      <LivingTradition />

      <TrustSection />

      {/* מוסדות ועסקים */}
      <section className="mx-auto max-w-7xl px-4 py-14">
        <div className="flex flex-col items-center justify-between gap-6 rounded-3xl border border-gold/25 bg-white p-8 shadow-card md:flex-row md:text-start">
          <div className="flex items-center gap-4">
            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-navy">
              <Building2 className="h-6 w-6 text-gold" />
            </span>
            <div>
              <h2 className="font-display text-xl font-bold text-navy">מוסדות, בתי כנסת ועסקים</h2>
              <p className="mt-1 text-sm text-navy/60">
                כיפות ממותגות, מתנות לעובדים והזמנות מרוכזות — עם הנחות כמות ומיתוג מלא.
              </p>
            </div>
          </div>
          <Link href="/quote"
            className="shrink-0 rounded-full bg-navy px-7 py-3 font-bold text-cream transition-colors hover:bg-gold hover:text-navy">
            לקבלת הצעת מחיר
          </Link>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-16">
        <SectionTitle eyebrow="לפני שקונים" title="שאלות נפוצות" />
        <div className="divide-y divide-navy/10 rounded-2xl border border-gold/20 bg-white px-5 shadow-card">
          {HOME_FAQ.map((f) => (
            <details key={f.q} className="group py-4">
              <summary className="cursor-pointer list-none font-medium text-navy [&::-webkit-details-marker]:hidden">
                {f.q}
              </summary>
              <p className="pt-2 text-sm leading-relaxed text-navy/70">{f.a}</p>
            </details>
          ))}
        </div>
        <div className="mt-8 text-center">
          <Link href="/search"
            className="inline-flex items-center gap-2 rounded-full border border-gold/40 px-8 py-3 font-bold text-navy transition-colors hover:bg-gold/10">
            <Sparkles className="h-4 w-4 text-gold-soft" /> לכל הקטלוג — {PRODUCTS.length} מוצרים
          </Link>
        </div>
      </section>

      <NewsletterClub />
    </>
  );
}
