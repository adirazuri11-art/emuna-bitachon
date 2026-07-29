import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { ACTIVE_CATEGORIES, getCategoryImage, getProductsByCategory } from '@/lib/catalog';

// חלון קטגוריות אלגנטי — צילום מוצר מלא על רקע בהיר + שם ומונה מוצרים.
export function CategoriesShowcase() {
  const cats = ACTIVE_CATEGORIES.map((c) => ({
    ...c,
    img: getCategoryImage(c.slug),
    count: getProductsByCategory(c.slug).length,
  }));

  return (
    <section className="mx-auto max-w-7xl px-4 py-14">
      <div className="mb-8 text-center">
        <span className="text-sm font-medium text-gold-soft">קונים לפי קטגוריה</span>
        <h2 className="mt-1 font-display text-3xl font-bold text-navy">המחלקות שלנו</h2>
        <div className="mx-auto mt-4 h-px w-24 bg-gradient-to-l from-transparent via-gold to-transparent" />
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {cats.map((cat) => (
          <Link key={cat.slug} href={`/category/${cat.slug}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-navy/5 bg-white shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold">
            <div className="relative aspect-[5/4] overflow-hidden bg-gradient-to-b from-white to-cream">
              {cat.img ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={cat.img} alt={cat.nameHe} loading="lazy"
                  className="h-full w-full object-contain p-4 transition-transform duration-500 group-hover:scale-105" />
              ) : null}
              <span className="absolute end-2 top-2 rounded-full bg-navy/85 px-2 py-0.5 text-[10px] font-medium text-gold backdrop-blur-sm">
                {cat.count} פריטים
              </span>
            </div>
            <div className="flex items-center justify-between gap-1 border-t border-navy/5 bg-white px-3 py-3">
              <span className="font-display text-sm font-bold text-navy sm:text-base">{cat.nameHe}</span>
              <ArrowLeft className="h-4 w-4 shrink-0 text-gold-soft transition-transform group-hover:-translate-x-1" />
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
