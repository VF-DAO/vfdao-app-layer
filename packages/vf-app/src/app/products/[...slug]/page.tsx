import { redirect } from 'next/navigation';
import { productsAliasHref } from '@/features/tracking/lib/desk';

export default async function ProductsAliasPage({
  params,
}: {
  params: Promise<{ slug: string[] }>;
}) {
  const { slug } = await params;
  redirect(productsAliasHref(slug));
}
