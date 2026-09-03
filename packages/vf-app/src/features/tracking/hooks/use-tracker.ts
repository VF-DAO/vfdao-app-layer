'use client';

import { useMemo } from 'react';
import { getClientTracker } from '../api/resolve-tracker';
import { useAsyncValue } from './use-async';

export function useTracker() {
  return useMemo(() => getClientTracker(), []);
}

export function useTrackerStatus() {
  const tracker = useTracker();
  return useAsyncValue(() => tracker.status(), [tracker]);
}

export function useProducts() {
  const tracker = useTracker();
  return useAsyncValue(() => tracker.listProducts(), [tracker]);
}

export function useProductsForAccount(accountId: string | null | undefined) {
  const tracker = useTracker();
  return useAsyncValue(
    () => (accountId ? tracker.listProductsForAccount(accountId) : Promise.resolve([])),
    [tracker, accountId]
  );
}

export function useLotsForAccount(accountId: string | null | undefined) {
  const tracker = useTracker();
  return useAsyncValue(
    () => (accountId ? tracker.listLotsForAccount(accountId) : Promise.resolve([])),
    [tracker, accountId]
  );
}

export function useEventsForAccount(accountId: string | null | undefined) {
  const tracker = useTracker();
  return useAsyncValue(
    () => (accountId ? tracker.listEventsForAccount(accountId) : Promise.resolve([])),
    [tracker, accountId]
  );
}

export function useCertificatesForAccount(accountId: string | null | undefined) {
  const tracker = useTracker();
  return useAsyncValue(
    () => (accountId ? tracker.listCertificatesForAccount(accountId) : Promise.resolve([])),
    [tracker, accountId]
  );
}

export function useProduct(productId: string | undefined) {
  const tracker = useTracker();
  return useAsyncValue(() => (productId ? tracker.getProduct(productId) : Promise.resolve(null)), [
    tracker,
    productId,
  ]);
}

export function useLots(productId: string | undefined) {
  const tracker = useTracker();
  return useAsyncValue(() => (productId ? tracker.listLots(productId) : Promise.resolve([])), [
    tracker,
    productId,
  ]);
}

export function useLotBundle(lotId: string | undefined) {
  const tracker = useTracker();
  return useAsyncValue(() => (lotId ? tracker.getLotBundle(lotId) : Promise.resolve(null)), [
    tracker,
    lotId,
  ]);
}

export function useScanResolve(code: string | undefined) {
  const tracker = useTracker();
  return useAsyncValue(() => (code ? tracker.resolveScan(code) : Promise.resolve(null)), [tracker, code]);
}

export function useOrgRole(accountId: string | null | undefined) {
  const tracker = useTracker();
  return useAsyncValue(() => (accountId ? tracker.getOrg(accountId) : Promise.resolve(null)), [
    tracker,
    accountId,
  ]);
}

export function useVfListed(accountId: string | null | undefined) {
  const tracker = useTracker();
  return useAsyncValue(
    () => (accountId ? tracker.isListed(accountId) : Promise.resolve(false)),
    [tracker, accountId]
  );
}

export function useVfShelf() {
  const tracker = useTracker();
  return useAsyncValue(() => tracker.listListed(), [tracker]);
}

export function useScanHistory(accountId?: string) {
  const tracker = useTracker();
  return useAsyncValue(() => tracker.listScans(accountId), [tracker, accountId]);
}
