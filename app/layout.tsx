import type { Metadata } from 'next';
import { Assistant, Frank_Ruhl_Libre } from 'next/font/google';
import { Providers } from '@/components/providers/Providers';
import { Navbar } from '@/components/header/Navbar';
import { CartSlideOver } from '@/components/cart/CartSlideOver';
import { WhatsAppButton } from '@/components/shared/WhatsAppButton';
import { GiftFinderBubble } from '@/components/shared/GiftFinderBubble';
import { AccessibilityWidget } from '@/components/shared/AccessibilityWidget';
import { NewsletterPopup } from '@/components/shared/NewsletterPopup';
import { WebVitalsReporter } from '@/components/analytics/WebVitalsReporter';
import { ConsentBanner } from '@/components/consent/ConsentBanner';
import { SiteFooter } from '@/components/shared/SiteFooter';
import { Toaster } from '@/components/ui/Toaster';
import { HideOnCrm } from '@/components/shared/HideOnCrm';
import './globals.css';

const assistant = Assistant({
  subsets: ['hebrew', 'latin'],
  variable: '--font-assistant',
  display: 'swap',
});

const frankRuhl = Frank_Ruhl_Libre({
  subsets: ['hebrew', 'latin'],
  weight: ['400', '500', '700'],
  variable: '--font-frank',
  display: 'swap',
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const GA_ID = process.env.NEXT_PUBLIC_GA_ID; // Google Analytics 4 — מזהה מדידה

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'אמונה וביטחון | יודאיקה יוקרתית בהתאמה אישית',
    template: '%s | אמונה וביטחון',
  },
  description:
    'חנות יודאיקה יוקרתית — כיפות לאירועים בהתאמה אישית (בר מצווה, חתונה, ברית), גביעי קידוש מכסף, מזוזות מהודרות, טליתות, פמוטי שבת ומתנות יהודיות. הטבעה ורקמה אישית, כשרות מאומתת ומשלוח מהיר לכל הארץ.',
  keywords: [
    'יודאיקה', 'חנות יודאיקה', 'תשמישי קדושה', 'כלי קודש',
    'כיפות לאירועים', 'כיפות בהתאמה אישית', 'כיפות לבר מצווה', 'כיפות ממותגות', 'הדפסה על כיפות', 'רקמה על כיפות',
    'כוס קידוש', 'גביע קידוש כסף', 'מזוזה מהודרת', 'מזוזה מעוצבת',
    'טלית', 'פמוטי שבת', 'כיסוי חלה', 'נטלה', 'הבדלה',
    'מתנות לבר מצווה', 'מתנה לחתונה', 'מתנות יהודיות', 'מתנה לברית', 'מתנות יודאיקה',
    'יודאיקה בהתאמה אישית', 'עיצוב יהודי',
  ],
  robots: { index: true, follow: true, nocache: false },
  openGraph: {
    type: 'website',
    locale: 'he_IL',
    siteName: 'אמונה וביטחון',
    title: 'אמונה וביטחון | יודאיקה יוקרתית בהתאמה אישית',
    description: 'כיפות לאירועים בהתאמה אישית, גביעי קידוש מכסף, מזוזות מהודרות, טליתות ומתנות יהודיות — הטבעה ורקמה אישית, כשרות מאומתת ומשלוח מהיר לכל הארץ.',
  },
  alternates: { canonical: '/' },
  // האתר כתוב עברית תקנית; מונע מ-Google Translate/Chrome לתרגם אותו
  // עברית→עברית ולשבש מילים (למשל "מטפחות"→"מפות", "כוסות"→"כושות").
  other: { google: 'notranslate' },
};

const orgJsonLd = {
  '@context': 'https://schema.org',
  '@type': ['Organization', 'Store'],
  '@id': `${SITE_URL}#organization`,
  name: 'אמונה וביטחון',
  alternateName: 'אמונה וביטחון יודאיקה',
  url: SITE_URL,
  description:
    'חנות יודאיקה יוקרתית — כלי קודש, כיפות בהתאמה אישית, גביעי קידוש, מזוזות, טליתות ומתנות יהודיות בעבודת יד, עם כשרות מאומתת.',
  contactPoint: {
    '@type': 'ContactPoint',
    telephone: '+972503096969',
    contactType: 'customer service',
    areaServed: 'IL',
    availableLanguage: ['he'],
  },
  sameAs: [
    'https://www.instagram.com/emunavebitachon',
    'https://www.facebook.com/profile.php?id=61593009291594',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${SITE_URL}#website`,
  url: SITE_URL,
  name: 'אמונה וביטחון',
  inLanguage: 'he-IL',
  publisher: { '@id': `${SITE_URL}#organization` },
  potentialAction: {
    '@type': 'SearchAction',
    target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/search?q={search_term_string}` },
    'query-input': 'required name=search_term_string',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl" translate="no" className={`notranslate ${assistant.variable} ${frankRuhl.variable}`}>
      <body className="font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(orgJsonLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }} />
        <Providers>
          <HideOnCrm>
            <ConsentBanner />
          </HideOnCrm>
          <WebVitalsReporter />
          <HideOnCrm>
            <Navbar />
          </HideOnCrm>
          <main>{children}</main>
          <HideOnCrm>
            <CartSlideOver />
            <WhatsAppButton />
            <GiftFinderBubble />
            <AccessibilityWidget />
            <NewsletterPopup />
          </HideOnCrm>
          <Toaster />
          <HideOnCrm>
            <SiteFooter />
          </HideOnCrm>
        </Providers>
      </body>
    </html>
  );
}
