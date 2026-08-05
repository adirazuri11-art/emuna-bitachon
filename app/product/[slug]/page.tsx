import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { PRODUCTS, getProduct, getRelatedProducts, CATEGORIES } from '@/lib/catalog';
import { ProductPageClient } from '@/components/products/ProductPageClient';
import { ProductReviews } from '@/components/products/ProductReviews';
import { getApprovedReviews, getReviewStats } from '@/lib/reviews';

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

// ISR — הביקורות מתעדכנות כל 10 דקות (aggregateRating ב-JSON-LD → כוכבים בגוגל).
export const revalidate = 600;

export function generateStaticParams() {
  return PRODUCTS.map((p) => ({ slug: p.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const product = getProduct(params.slug);
  if (!product) return {};
  const keywords = [
    product.titleHe,
    product.category,
    ...product.materials,
    ...(product.isCustomizable ? ['בהתאמה אישית', 'הטבעה אישית', 'לאירועים'] : []),
    'יודאיקה', 'תשמישי קדושה',
  ].filter(Boolean);
  const titleTemplate = product.isCustomizable
    ? `${product.titleHe} בהתאמה אישית — ${product.category}`
    : product.titleHe;
  return {
    title: titleTemplate,
    description: product.shortDescription,
    keywords,
    alternates: { canonical: `/product/${product.slug}` },
    openGraph: {
      title: `${product.titleHe} | אמונה וביטחון`,
      description: product.shortDescription,
      type: 'website',
      locale: 'he_IL',
      images: product.imageUrl ? [{ url: `${SITE_URL}${product.imageUrl}` }] : undefined,
    },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();

  const related = getRelatedProducts(product);
  const category = CATEGORIES.find((c) => c.nameHe === product.category);
  const price = product.discountPrice ?? product.basePrice;

  // ביקורות מאושרות (מזין aggregateRating + סקשן חוות דעת). נכשל בחן → ריק.
  const [reviewStats, reviews] = await Promise.all([
    getReviewStats(product.slug),
    getApprovedReviews(product.slug),
  ]);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Product',
        '@id': `${SITE_URL}/product/${product.slug}#product`,
        name: product.titleHe,
        sku: product.sku,
        description: product.shortDescription,
        image: `${SITE_URL}${product.imageUrl}`,
        url: `${SITE_URL}/product/${product.slug}`,
        material: product.materials.join(', '),
        category: product.category,
        brand: { '@type': 'Brand', name: 'אמונה וביטחון' },
        ...(product.certification && {
          certificateNumber: product.certification,
          certificationDetails: { '@type': 'Text', value: product.certification },
        }),
        // כוכבי זהב בגוגל — רק כשיש ביקורות אמיתיות מאושרות.
        ...(reviewStats.count > 0
          ? {
              aggregateRating: {
                '@type': 'AggregateRating',
                ratingValue: reviewStats.avg,
                reviewCount: reviewStats.count,
                bestRating: 5,
                worstRating: 1,
              },
              review: reviews.slice(0, 5).map((r) => ({
                '@type': 'Review',
                author: { '@type': 'Person', name: r.authorName },
                datePublished: r.createdAt.slice(0, 10),
                reviewRating: { '@type': 'Rating', ratingValue: r.rating, bestRating: 5, worstRating: 1 },
                ...(r.title ? { name: r.title } : {}),
                reviewBody: r.body,
              })),
            }
          : {}),
        offers: {
          '@type': 'Offer',
          url: `${SITE_URL}/product/${product.slug}`,
          price,
          priceCurrency: 'ILS',
          priceValidUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
          itemCondition: 'https://schema.org/NewCondition',
          availability:
            product.stockStatus === 'coming-soon'
              ? 'https://schema.org/PreOrder'
              : 'https://schema.org/InStock',
          seller: { '@id': `${SITE_URL}#organization` },
          shippingDetails: {
            '@type': 'OfferShippingDetails',
            shippingRate: { '@type': 'MonetaryAmount', value: 29, currency: 'ILS' },
            shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IL' },
            deliveryTime: {
              '@type': 'ShippingDeliveryTime',
              handlingTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
              transitTime: { '@type': 'QuantitativeValue', minValue: 1, maxValue: 3, unitCode: 'DAY' },
            },
          },
          hasMerchantReturnPolicy: {
            '@type': 'MerchantReturnPolicy',
            applicableCountry: 'IL',
            returnPolicyCategory: 'https://schema.org/MerchantReturnFiniteReturnWindow',
            merchantReturnDays: 14,
            returnMethod: 'https://schema.org/ReturnByMail',
            returnFees: 'https://schema.org/ReturnShippingFees',
          },
        },
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'ראשי', item: SITE_URL },
          ...(category
            ? [{ '@type': 'ListItem', position: 2, name: category.nameHe, item: `${SITE_URL}/category/${category.slug}` }]
            : []),
          { '@type': 'ListItem', position: category ? 3 : 2, name: product.titleHe },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <h1 className="sr-only">{product.titleHe}</h1>
      <ProductPageClient product={product} related={related} categorySlug={category?.slug} />
      <ProductReviews
        productSlug={product.slug}
        productId={product.id}
        reviews={reviews.map((r) => ({ id: r.id, authorName: r.authorName, rating: r.rating, title: r.title, body: r.body, createdAt: r.createdAt }))}
        stats={reviewStats}
      />
    </>
  );
}
