'use client';

import { useState } from 'react';
import { getClientTracker } from '../api/resolve-tracker';
import type {
  AddEventInput,
  CreateLotInput,
  IssueCertificateInput,
  RecordScanInput,
  RegisterProductInput,
} from '../types';

export function useTrackingMutations() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run<T>(work: () => Promise<T>): Promise<T> {
    setPending(true);
    setError(null);
    try {
      return await work();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Tracking write failed';
      setError(message);
      throw err;
    } finally {
      setPending(false);
    }
  }

  return {
    pending,
    error,
    registerProduct: (input: RegisterProductInput) => run(() => getClientTracker().registerProduct(input)),
    createLot: (input: CreateLotInput) => run(() => getClientTracker().createLot(input)),
    addEvent: (input: AddEventInput) => run(() => getClientTracker().addEvent(input)),
    issueCertificate: (input: IssueCertificateInput) =>
      run(() => getClientTracker().issueCertificate(input)),
    recordScan: (input: RecordScanInput) => run(() => getClientTracker().recordScan(input)),
  };
}
