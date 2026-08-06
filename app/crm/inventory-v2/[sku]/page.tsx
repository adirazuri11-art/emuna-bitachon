import { notFound } from 'next/navigation';
import { getInvV2Item } from '@/lib/crm/inventory-v2/item';
import { ProductCard } from '@/components/crm/ProductCard';

export const dynamic = 'force-dynamic';

export default async function ProductCardPage({ params }: { params: { sku: string } }) {
  const item = await getInvV2Item(decodeURIComponent(params.sku));
  if (!item) notFound();
  return <ProductCard item={item} />;
}
