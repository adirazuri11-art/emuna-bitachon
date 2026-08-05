'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Heart } from 'lucide-react';
import { useWishlistStore } from '@/store/wishlist';
import { getLiteProduct, type LiteProduct } from '@/lib/catalog-lite';
import { ProductCard } from '@/components/products/ProductCard';

export default function WishlistPage() {
  const slugs = useWishlistStore((s) => s.slugs);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const products = mounted
    ? slugs.map(getLiteProduct).filter((p): p is LiteProduct => Boolean(p))
    : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <h1 className="mb-8 text-center font-display text-3xl font-bold text-navy">
        המועדפים שלי
      </h1>

      {!mounted ? (
        <div className="grid grid-cols-2 gap-6 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="skeleton aspect-[4/5] rounded-2xl" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center gap-4 py-16 text-center">
          <Heart className="h-14 w-14 text-gold/40" strokeWidth={1.2} />
          <p className="font-display text-xl font-bold text-navy">עדיין לא שמרתם מוצרים</p>
          <p className="max-w-sm text-sm text-navy/50">
            לחצו על הלב שבכרטיסי המוצרים כדי לשמור פריטים שאהבתם — הם יחכו לכם כאן.
          </p>
          <Link href="/"
            className="rounded-full bg-gradient-to-l from-gold to-gold-soft px-7 py-2.5 font-bold text-navy shadow-gold">
            לקולקציה
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
          {products.map((p) => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </div>
  );
}
