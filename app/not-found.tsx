import Link from 'next/link';
import { Compass } from 'lucide-react';
import { CATEGORIES } from '@/lib/catalog';

export default function NotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-20 text-center">
      <Compass className="mx-auto h-14 w-14 text-gold/60" strokeWidth={1.2} />
      <h1 className="mt-4 font-display text-4xl font-bold text-navy">הדף הזה יצא לדרך אחרת</h1>
      <p className="mt-3 text-navy/60">
        הקישור שהגעתם אליו לא קיים (או שהמוצר הוחלף). הנה כמה דרכים טובות להמשיך:
      </p>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href="/" className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-7 py-2.5 font-bold text-navy shadow-gold">
          לדף הבית
        </Link>
        <Link href="/search" className="rounded-full border border-gold/40 px-7 py-2.5 font-bold text-navy hover:bg-gold/10">
          חיפוש בקטלוג
        </Link>
        <Link href="/gift-finder" className="rounded-full border border-gold/40 px-7 py-2.5 font-bold text-navy hover:bg-gold/10">
          מאתר המתנות ✨
        </Link>
      </div>

      <div className="mt-10">
        <p className="mb-3 text-sm font-medium text-navy/50">או ישר לקטגוריה:</p>
        <div className="flex flex-wrap justify-center gap-2">
          {CATEGORIES.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`}
              className="rounded-full bg-navy/5 px-4 py-1.5 text-sm text-navy/70 transition-colors hover:bg-gold/15 hover:text-navy">
              {c.nameHe}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
