import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { LotBundle } from '../types';
import { deriveVerificationStatus } from '../lib/status';
import { encodeLotQr } from '../lib/qr';
import { CertificateBadge } from './CertificateBadge';
import { IngredientList } from './IngredientList';
import { LotQrCard } from './LotQrCard';
import { ProductHeader } from './ProductHeader';
import { SupplyChainTimeline } from './SupplyChainTimeline';

export function LotBundleView({
  bundle,
  showProductLink = true,
}: {
  bundle: LotBundle;
  showProductLink?: boolean;
}) {
  const status = deriveVerificationStatus(bundle.events, bundle.certificates);
  const qr = encodeLotQr(bundle.lot.id);

  return (
    <div className="space-y-6">
      <ProductHeader product={bundle.product} producer={bundle.producer} status={status} />

      <Card className="border border-border p-6">
        <p className="text-sm text-muted-foreground">Lot</p>
        <h2 className="text-2xl font-semibold text-foreground">{bundle.lot.label}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Harvested {bundle.lot.harvestedAt} · {bundle.lot.quantity} · {bundle.lot.site}
        </p>
        <p className="mt-3 font-mono text-xs text-muted-foreground">{qr}</p>
      </Card>

      <LotQrCard lotId={bundle.lot.id} lotLabel={bundle.lot.label} />

      <IngredientList ingredients={bundle.product.ingredients} claims={bundle.product.claims} />

      {bundle.certificates.length > 0 && (
        <div className="space-y-3">
          {bundle.certificates.map((certificate) => (
            <CertificateBadge key={certificate.id} certificate={certificate} />
          ))}
        </div>
      )}

      <Card className="border border-border p-6">
        <h3 className="mb-4 text-lg font-semibold text-foreground">Farm to shelf</h3>
        <SupplyChainTimeline events={bundle.events} />
      </Card>

      {showProductLink && (
        <Button asChild variant="outline">
          <Link href={`/products/${bundle.product.id}`}>All lots for this product</Link>
        </Button>
      )}
    </div>
  );
}
