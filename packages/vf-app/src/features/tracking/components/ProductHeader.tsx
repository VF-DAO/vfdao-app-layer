import { Badge } from '@/components/ui/badge';
import type { Org, Product } from '../types';
import type { VerificationStatus } from '../lib/status';

const toneToVariant = {
  verified: 'verified',
  primary: 'primary',
  muted: 'muted',
  orange: 'orange',
} as const;

export function ProductHeader({
  product,
  producer,
  status,
}: {
  product: Product;
  producer?: Org;
  status?: VerificationStatus;
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-medium text-muted-foreground">{product.brand}</p>
        {status && <Badge variant={toneToVariant[status.tone]}>{status.label}</Badge>}
      </div>
      <h1 className="text-3xl font-bold text-foreground sm:text-4xl md:text-5xl">{product.name}</h1>
      <p className="max-w-2xl text-muted-foreground">{product.description}</p>
      {producer && (
        <p className="text-sm text-muted-foreground">
          Producer: <span className="font-medium text-foreground">{producer.name}</span> · {producer.accountId}
        </p>
      )}
    </div>
  );
}
