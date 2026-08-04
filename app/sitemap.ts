import type { MetadataRoute } from 'next';
import { ACTIVE_CATEGORIES as CATEGORIES, PRODUCTS } from '@/lib/catalog';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

const BLOG_SLUGS = [
  'jewish-wedding-gifts',
  'challah-cover-guide',
  'havdalah-set-guide',
  'netilat-yadayim-cup-guide',
  'brit-newborn-gifts',
  'kiddush-cup-guide',
  'mezuzah-design-guide',
  'home-blessing-guide',
  'custom-kippot-events',
  'shabbat-candlesticks-guide',
  'choosing-tallit-guide',
  'bar-mitzvah-gifts-budget',
  'hanukkiah-silver-care',
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE, changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/blog`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/search`, changeFrequency: 'weekly', priority: 0.5 },
    { url: `${BASE}/gift-finder`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/gift-card`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/quote`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${BASE}/accessibility`, changeFrequency: 'yearly', priority: 0.3 },
    ...BLOG_SLUGS.map((s) => ({
      url: `${BASE}/blog/${s}`,
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    })),
    ...CATEGORIES.map((c) => ({
      url: `${BASE}/category/${c.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })),
    ...PRODUCTS.map((p) => ({
      url: `${BASE}/product/${p.slug}`,
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })),
  ];
}
