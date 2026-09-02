'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { encodeLotQr, FIXTURE_LOT_ID, QrScanner, TrackingBackendBadge } from '@/features/tracking';

export default function ScanPage() {
  const router = useRouter();
  const demoCode = encodeLotQr(FIXTURE_LOT_ID);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8 md:py-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Scan a product</h1>
        <p className="text-muted-foreground">
          Point the camera at a VF QR code or paste the lot code. The record is resolved from OnSocial
          core when an OnAPI key is configured.
        </p>
        <TrackingBackendBadge />
      </div>

      <QrScanner onCode={(code) => router.push(`/scan/${encodeURIComponent(code)}`)} />

      <p className="text-sm text-muted-foreground">
        Try the demo oat drink:{' '}
        <Link href={`/scan/${encodeURIComponent(demoCode)}`} className="font-mono text-primary">
          {demoCode}
        </Link>
      </p>
    </div>
  );
}
