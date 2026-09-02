'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { TrackingBackendBadge } from '@/features/tracking';
import { useAppDrawer } from '@/features/shell';

export default function StudioPage() {
  const { openDrawer } = useAppDrawer();

  useEffect(() => {
    openDrawer({ id: 'studio' });
  }, [openDrawer]);

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:py-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Producer studio</h1>
        <p className="text-muted-foreground">
          Quick actions open in the shared app drawer. Deep views — product pages and lot timelines —
          stay on their own routes.
        </p>
        <TrackingBackendBadge />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="text-sm text-primary" onClick={() => openDrawer({ id: 'studio' })}>
            Open studio actions
          </button>
          <Link href="/products" className="text-sm text-primary">
            Back to catalog
          </Link>
        </div>
      </div>
    </div>
  );
}
