import type { TrackerApi } from './tracker-api';
import type {
  AddEventInput,
  Certificate,
  ChainEvent,
  CreateLotInput,
  IssueCertificateInput,
  Listing,
  Lot,
  LotBundle,
  Org,
  Product,
  RecordScanInput,
  RegisterProductInput,
  ScanRecord,
  TrackerStatus,
} from '../types';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  if (!response.ok) {
    const body = (await response.json().catch(() => ({ error: response.statusText }))) as {
      error?: string;
    };
    throw new Error(body.error ?? `Tracking API ${response.status}`);
  }
  return (await response.json()) as T;
}

export function createHttpTracker(): TrackerApi {
  return {
    status: () => request<TrackerStatus>('/api/tracking/status'),
    listProducts: () => request<Product[]>('/api/tracking/products'),
    listProductsForAccount: (accountId) =>
      request<Product[]>(`/api/tracking/products?producerAccountId=${encodeURIComponent(accountId)}`),
    getProduct: (productId) => request<Product | null>(`/api/tracking/products/${productId}`),
    listLots: (productId) => request<Lot[]>(`/api/tracking/products/${productId}/lots`),
    listLotsForAccount: (accountId) =>
      request<Lot[]>(`/api/tracking/lots?producerAccountId=${encodeURIComponent(accountId)}`),
    getLot: (lotId) => request<Lot | null>(`/api/tracking/lots/${lotId}`),
    getEvents: (lotId) => request<ChainEvent[]>(`/api/tracking/lots/${lotId}/events`),
    listEventsForAccount: (accountId) =>
      request<ChainEvent[]>(`/api/tracking/events?orgAccountId=${encodeURIComponent(accountId)}`),
    getCertificates: (subjectId) => request<Certificate[]>(`/api/tracking/certificates/${subjectId}`),
    listCertificatesForAccount: (accountId) =>
      request<Certificate[]>(`/api/tracking/certificates?issuerAccountId=${encodeURIComponent(accountId)}`),
    getLotBundle: (lotId) => request<LotBundle | null>(`/api/tracking/lots/${lotId}/bundle`),
    resolveScan: (code) => request<LotBundle | null>(`/api/tracking/scan/${encodeURIComponent(code)}`),
    getOrg: (accountId) => request<Org | null>(`/api/tracking/orgs/${accountId}`),
    isListed: (accountId) => request<boolean>(`/api/tracking/orgs/${accountId}/listed`),
    listListed: () => request<Listing[]>('/api/tracking/listed'),
    listScans: (accountId) =>
      request<ScanRecord[]>(accountId ? `/api/tracking/scans?accountId=${accountId}` : '/api/tracking/scans'),
    registerProduct: (input: RegisterProductInput) =>
      request<Product>('/api/tracking/products', { method: 'POST', body: JSON.stringify(input) }),
    createLot: (input: CreateLotInput) =>
      request<Lot>('/api/tracking/lots', { method: 'POST', body: JSON.stringify(input) }),
    addEvent: (input: AddEventInput) =>
      request<ChainEvent>('/api/tracking/events', { method: 'POST', body: JSON.stringify(input) }),
    issueCertificate: (input: IssueCertificateInput) =>
      request<Certificate>('/api/tracking/certificates', { method: 'POST', body: JSON.stringify(input) }),
    recordScan: (input: RecordScanInput) =>
      request<ScanRecord>('/api/tracking/scans', { method: 'POST', body: JSON.stringify(input) }),
  };
}
