'use client';

import { use } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LotBundleView, useLotBundle } from '@/features/tracking';

export default function LotPage({
  params,
}: {
  params: Promise<{ productId: string; lotId: string }>;
}) {
  const { productId, lotId } = use(params);
  const { data, loading, error } = useLotBundle(lotId);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:py-12">
      <Button asChild variant="ghost" size="sm">
        <Link href={`/products/${productId}`}>
          <ArrowLeft className="h-4 w-4" />
          Back to product
        </Link>
      </Button>
      {loading && <p className="text-muted-foreground">Loading lot…</p>}
      {error && <p className="text-orange">{error}</p>}
      {data && <LotBundleView bundle={data} showProductLink={false} />}
    </div>
  );
}
