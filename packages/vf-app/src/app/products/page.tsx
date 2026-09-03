'use client';

import Link from 'next/link';
import { ScanLine, Warehouse } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProductCard, TrackingBackendBadge, useProducts } from '@/features/tracking';
import { useAppDrawer } from '@/features/shell';

export default function ProductsPage() {
  const { data, loading, error } = useProducts();
  const { openDrawer } = useAppDrawer();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-3">
          <h1 className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">Verified products</h1>
          <p className="max-w-2xl text-muted-foreground">
            Scan a carton or open a lot to see every stamp, labeled with the writer.
          </p>
          <TrackingBackendBadge />
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="verified" onClick={() => openDrawer({ id: 'scan' })}>
            <ScanLine className="h-4 w-4" />
            Scan
          </Button>
          <Button asChild variant="outline">
            <Link href="/studio">
              <Warehouse className="h-4 w-4" />
              Studio
            </Link>
          </Button>
        </div>
      </div>

      {loading && <p className="text-muted-foreground">Loading products…</p>}
      {error && <p className="text-orange">{error}</p>}

      <div className="grid gap-6 md:grid-cols-2">
        {data?.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </div>
  );
}
