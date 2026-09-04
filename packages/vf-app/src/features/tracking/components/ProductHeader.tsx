'use client';

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { StandWithButton } from '@/components/ui/stand-with-button';
import { SproutButton } from './SproutButton';
import type { Org, Product } from '../types';

export function ProductHeader({
  product,
  producer,
  vfListed = false,
}: {
  product: Product;
  producer?: Org;
  vfListed?: boolean;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
        {vfListed && <Badge variant="primary">On the VF shelf</Badge>}
      </div>
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">{product.name}</h1>
      <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex flex-wrap items-center gap-2">
          <SproutButton subjectType="product" subjectId={product.id} />
          <p className="text-sm text-muted-foreground">this drink</p>
        </div>
        {producer && (
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm text-muted-foreground">
              <Link
                href={`/profile/${encodeURIComponent(producer.accountId)}`}
                className="font-medium text-foreground hover:text-primary"
              >
                {producer.name}
              </Link>
            </p>
            <StandWithButton targetAccountId={producer.accountId} showCount size="sm" />
          </div>
        )}
      </div>
      <p className="max-w-2xl text-muted-foreground">{product.description}</p>
    </div>
  );
}
