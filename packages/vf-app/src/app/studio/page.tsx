'use client';

import Link from 'next/link';
import { TrackingBackendBadge } from '@/features/tracking';
import {
  CreateLotForm,
  IssueCertificateForm,
  RecordEventForm,
  RegisterProductForm,
} from '@/features/tracking';

export default function StudioPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 md:py-12">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-foreground sm:text-4xl">Producer studio</h1>
        <p className="text-muted-foreground">
          Register a product, open a lot, append a chain event, or issue a certificate. With an
          OnSocial session these writes go to core without a wallet popup each time. Until the app
          is listed on the OnSocial portal, they stay in the local fixture store.
        </p>
        <TrackingBackendBadge />
        <Link href="/products" className="text-sm text-primary">
          Back to catalog
        </Link>
      </div>

      <RegisterProductForm />
      <CreateLotForm />
      <RecordEventForm />
      <IssueCertificateForm />
    </div>
  );
}
