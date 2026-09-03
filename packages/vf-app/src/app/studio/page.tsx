'use client';

import Link from 'next/link';
import { DeskView } from '@/features/tracking';

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-8 md:py-12">
      <DeskView />
      <p className="text-sm text-muted-foreground">
        Writes stay in the shared drawer. Lot rows open the same scan compose as a QR.
      </p>
      <Link href="/products" className="text-sm text-primary">
        All products
      </Link>
    </div>
  );
}
