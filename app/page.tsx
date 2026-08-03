import Link from 'next/link';
import { Building2, Gift, PenLine, Sparkles } from 'lucide-react';
import { TrustSection } from '@/components/home/TrustSection';
import { TrustAndSocialProof } from '@/components/cro/TrustAndSocialProof';
import { CategoriesShowcase } from '@/components/home/CategoriesShowcase';
import { LivingTradition } from '@/components/home/LivingTradition';
import { NewsletterClub } from '@/components/home/NewsletterClub';
import { ProductCard } from '@/components/products/ProductCard';
import { getHomepageContext } from '@/lib/hebcal';
import { PRODUCTS } from '@/lib/catalog';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
const pick = (list: typeof PRODUCTS, n = 4) => (list.length >= n ? list : PRODUCTS).slice(0, n);
const bestsellers = pick(PRODUCTS.filter((p) => p.badges.includes('bestseller')));
const newArrivals = pick(PRODUCTS.filter((p) => p.isNew));
const recommended = pick(PRODUCTS.filter((p) => p.badges.includes('recommended')));

const HOME_FAQ = [
  { q: 'כמה זמן לוקח להכין מוצר בהתאמה אישית?', a: 'רוב מוצרים מוכנים תוך 3–10 ימי עסקים.' },
  { q: 'האם אפשר להזמין כמויות לאירוע או לעסק?', a: 'כן — עם הנחות כמות ומיתוג מלא.' },
  { q: 'מה מדיניות ההחזרות?', a: 'מוצרים רגילים ניתנים להחזרה תוך 30 יום.' },
  { q: 'המוצרים מגיעים עם אישורי כשרות?', a: 'כן — עם תעודות מהגורמים המוסמכים.' },
];

function SectionTitle({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-8 text-center">
      <span className="text-sm font-medium text-gold-soft">{eyebrow}</span>
      <h2 className="mt-1 font-display text-3xl font-bold text-navy">{title}</h2>
    </div>
  );
}

export default async function HomePage() {
  const context = await getHomepageContext();

  return (
    <>
      <section className="min-h-screen bg-navy-deep px-4 py-12">
        <div className="mx-auto max-w-6xl text-center">
          <span className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-navy">
            <Gift className="h-6 w-6 text-gold" />
          </span>
          <h1 className="font-display text-4xl font-bold text-cream mb-3">מאתר המתנה המושלמת</h1>
          <p className="text-cream/70">ארבע שאלות קצרות — ותמצאו בדיוק את המתנה שתרצו לתת</p>
        </div>
      </section>

      <CategoriesShowcase />

      <section className="mx-auto max-w-7xl px-4 pb-14">
        <SectionTitle eyebrow="הלקוחות בחרו" title="רבי-המכר שלנו" />
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {bestsellers.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      </section>

      <TrustAndSocialProof />

      <section className="border-y border-gold/15 bg-white py-14">
        <div className="mx-auto max-w-7xl px-4">
          <SectionTitle eyebrow="נבחרו בקפידה" title="מומלצים במיוחד" />
          <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
            {recommended.map((p) => <ProductCard key={p.id} product={p} />)}
          </div>
        </div>
      </section>

      <LivingTradition />
      <TrustSection />
      <NewsletterClub />
    </>
  );
}
