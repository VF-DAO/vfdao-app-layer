'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft, QrCode } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  encodeLotQr,
  IngredientList,
  ProductHeader,
  scanHref,
  useLots,
  useProduct,
} from '@/features/tracking';

export default function ProductDetailPage({ params }: { params: Promise<{ productId: string }> }) {
  const { productId } = use(params);
  const { data: product, loading, error } = useProduct(productId);
  const lots = useLots(productId);

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-muted-foreground">Loading product…</div>;
  }
  if (error || !product) {
    return <div className="mx-auto max-w-4xl px-4 py-12 text-orange">{error ?? 'Product not found'}</div>;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 px-4 py-8 md:py-12">
      <div className="flex flex-wrap gap-2">
        <Button asChild variant="ghost" size="sm">
          <Link href="/studio">
            <ArrowLeft className="h-4 w-4" />
            Studio
          </Link>
        </Button>
      </div>

      <ProductHeader product={product} />
      <IngredientList ingredients={product.ingredients} claims={product.claims} />

      <div>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Lots</h2>
          <p className="text-sm text-muted-foreground">Open a lot in Studio. Scan still composes the graph.</p>
        </div>
        <div className="space-y-3">
          {lots.data?.map((lot) => (
            <Card key={lot.id} className="border border-border p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="text-lg font-semibold">{lot.label}</h3>
                  <p className="text-sm text-muted-foreground">
                    {lot.harvestedAt} · {lot.quantity} · {lot.site}
                  </p>
                  <p className="mt-1 font-mono text-xs text-muted-foreground">{encodeLotQr(lot.id)}</p>
                </div>
                <Button asChild variant="verified" size="sm">
                  <Link href={scanHref(lot.id)}>
                    <QrCode className="h-4 w-4" />
                    Scan view
                  </Link>
                </Button>
              </div>
            </Card>
          ))}
          {!lots.data?.length && <p className="text-muted-foreground">No lots yet. Open one in Studio.</p>}
        </div>
      </div>
    </div>
  );
}
