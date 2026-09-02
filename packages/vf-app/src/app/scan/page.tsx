'use client';

import { useEffect } from 'react';
import { TrackingBackendBadge } from '@/features/tracking';
import { useAppDrawer } from '@/features/shell';

export default function ScanPage() {
  const { openDrawer } = useAppDrawer();

  useEffect(() => {
    openDrawer({ id: 'scan' });
  }, [openDrawer]);

  return (
    <div className="mx-auto max-w-xl space-y-6 px-4 py-8 md:py-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Scan a product</h1>
        <p className="text-muted-foreground">
          Scanning is a quick action in the shared drawer. The lot page shows every stamp, labeled
          with the writer. VF listing is optional.
        </p>
        <TrackingBackendBadge />
        <button type="button" className="text-sm text-primary" onClick={() => openDrawer({ id: 'scan' })}>
          Open scanner
        </button>
      </div>
    </div>
  );
}
