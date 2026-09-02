import Link from 'next/link';
import { ArrowRight, Package } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Product } from '../types';

export function ProductCard({ product }: { product: Product }) {
  return (
    <Link href={`/products/${product.id}`} className="block">
      <Card className="group h-full border border-border/50 p-6 transition-all hover:border-primary/30">
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Package className="h-6 w-6" />
          </div>
          <Badge variant="verified">Tracked</Badge>
        </div>
        <p className="text-sm text-muted-foreground">{product.brand}</p>
        <h3 className="mb-2 text-xl font-semibold text-foreground">{product.name}</h3>
        <p className="mb-4 line-clamp-3 text-sm text-muted-foreground">{product.description}</p>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-primary">
          View supply chain
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </span>
      </Card>
    </Link>
  );
}
