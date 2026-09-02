import type { TrackerApi } from './tracker-api';
import { cloneFixtures } from './fixtures';
import { createId } from '../lib/ids';
import { parseScanCode } from '../lib/qr';
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

const STORAGE_KEY = 'vf.tracking.v1';
const SCAN_KEY = 'vf.tracking.scans.v1';

interface TrackingStore {
  orgs: Org[];
  products: Product[];
  lots: Lot[];
  events: ChainEvent[];
  certificates: Certificate[];
  listings: Listing[];
}

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function loadStore(): TrackingStore {
  const seeded = cloneFixtures();
  const saved = readJson<Partial<TrackingStore> | null>(STORAGE_KEY, null);
  if (!saved) return seeded;

  return {
    orgs: saved.orgs?.length ? saved.orgs : seeded.orgs,
    products: mergeById(seeded.products, saved.products ?? []),
    lots: mergeById(seeded.lots, saved.lots ?? []),
    events: mergeById(seeded.events, saved.events ?? []),
    certificates: mergeById(seeded.certificates, saved.certificates ?? []),
    listings: mergeListings(seeded.listings, saved.listings ?? []),
  };
}

function mergeListings(base: Listing[], extra: Listing[]): Listing[] {
  const map = new Map(base.map((item) => [item.orgAccountId, item]));
  extra.forEach((item) => map.set(item.orgAccountId, item));
  return [...map.values()];
}

function mergeById<T extends { id: string }>(base: T[], extra: T[]): T[] {
  const map = new Map(base.map((item) => [item.id, item]));
  extra.forEach((item) => map.set(item.id, item));
  return [...map.values()];
}

function persist(store: TrackingStore): void {
  writeJson(STORAGE_KEY, store);
}

function loadScans(): ScanRecord[] {
  return readJson<ScanRecord[]>(SCAN_KEY, []);
}

function persistScans(scans: ScanRecord[]): void {
  writeJson(SCAN_KEY, scans);
}

function toBundle(store: TrackingStore, lot: Lot): LotBundle {
  const product = store.products.find((item) => item.id === lot.productId);
  if (!product) {
    throw new Error(`Product ${lot.productId} missing for lot ${lot.id}`);
  }
  const events = store.events
    .filter((event) => event.lotId === lot.id)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
  const certificates = store.certificates.filter(
    (certificate) => certificate.subjectId === lot.id || certificate.subjectId === product.id
  );
  return {
    lot,
    product,
    events,
    certificates,
    producer: store.orgs.find((org) => org.accountId === product.producerAccountId),
    vfListed: store.listings.some((listing) => listing.orgAccountId === lot.producerAccountId),
  };
}

export function createLocalTracker(): TrackerApi {
  const store = loadStore();

  return {
    async status(): Promise<TrackerStatus> {
      return {
        backend: 'local',
        appId: process.env.NEXT_PUBLIC_ONSOCIAL_APP_ID ?? 'vf-tracker',
        coreContract: 'core.onsocial.near',
        gatewayUrl: process.env.NEXT_PUBLIC_ONSOCIAL_GATEWAY_URL ?? 'https://api.onsocial.id',
        usingOnApi: false,
        needsSession: false,
        note: 'Local fixture store. Add an OnAPI key to read/write the same records on OnSocial core.',
      };
    },

    async listProducts(): Promise<Product[]> {
      return [...store.products].sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    },

    async getProduct(productId: string): Promise<Product | null> {
      return store.products.find((product) => product.id === productId) ?? null;
    },

    async listLots(productId: string): Promise<Lot[]> {
      return store.lots
        .filter((lot) => lot.productId === productId)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
    },

    async getLot(lotId: string): Promise<Lot | null> {
      return store.lots.find((lot) => lot.id === lotId) ?? null;
    },

    async getEvents(lotId: string): Promise<ChainEvent[]> {
      return store.events
        .filter((event) => event.lotId === lotId)
        .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    },

    async getCertificates(subjectId: string): Promise<Certificate[]> {
      return store.certificates.filter((certificate) => certificate.subjectId === subjectId);
    },

    async getLotBundle(lotId: string): Promise<LotBundle | null> {
      const lot = store.lots.find((item) => item.id === lotId);
      if (!lot) return null;
      return toBundle(store, lot);
    },

    async resolveScan(code: string): Promise<LotBundle | null> {
      const parsed = parseScanCode(code);
      if (!parsed) return null;
      const lot = store.lots.find((item) => item.id === parsed.lotId);
      if (!lot) return null;
      return toBundle(store, lot);
    },

    async getOrg(accountId: string): Promise<Org | null> {
      return store.orgs.find((org) => org.accountId === accountId) ?? null;
    },

    async listScans(accountId?: string): Promise<ScanRecord[]> {
      const scans = loadScans();
      return scans
        .filter((scan) => !accountId || scan.accountId === accountId)
        .sort((a, b) => Date.parse(b.scannedAt) - Date.parse(a.scannedAt));
    },

    async registerProduct(input: RegisterProductInput): Promise<Product> {
      const product: Product = {
        id: createId('prd'),
        name: input.name.trim(),
        brand: input.brand.trim(),
        description: input.description.trim(),
        ingredients: input.ingredients.map((item) => item.trim()).filter(Boolean),
        claims: input.claims.map((item) => item.trim()).filter(Boolean),
        imageUrl: input.imageUrl,
        producerAccountId: input.producerAccountId,
        createdAt: new Date().toISOString(),
      };
      store.products.push(product);
      persist(store);
      return product;
    },

    async createLot(input: CreateLotInput): Promise<Lot> {
      const product = store.products.find((item) => item.id === input.productId);
      if (!product) throw new Error('Product not found');
      const lot: Lot = {
        id: createId('lot'),
        productId: input.productId,
        label: input.label.trim(),
        harvestedAt: input.harvestedAt,
        quantity: input.quantity.trim(),
        site: input.site.trim(),
        producerAccountId: input.producerAccountId,
        createdAt: new Date().toISOString(),
      };
      store.lots.push(lot);
      persist(store);
      return lot;
    },

    async addEvent(input: AddEventInput): Promise<ChainEvent> {
      const lot = store.lots.find((item) => item.id === input.lotId);
      if (!lot) throw new Error('Lot not found');
      const event: ChainEvent = {
        id: createId('evt'),
        lotId: input.lotId,
        kind: input.kind,
        at: input.at ?? new Date().toISOString(),
        note: input.note.trim(),
        orgAccountId: input.orgAccountId,
        mediaCid: input.mediaCid,
      };
      store.events.push(event);
      persist(store);
      return event;
    },

    async issueCertificate(input: IssueCertificateInput): Promise<Certificate> {
      const certificate: Certificate = {
        id: createId('cert'),
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        standard: input.standard.trim(),
        issuerAccountId: input.issuerAccountId,
        issuedAt: new Date().toISOString(),
        expiresAt: input.expiresAt,
        status: 'active',
        evidenceCid: input.evidenceCid,
      };
      store.certificates.push(certificate);
      persist(store);
      return certificate;
    },

    async recordScan(input: RecordScanInput): Promise<ScanRecord> {
      const scan: ScanRecord = {
        id: createId('scan'),
        code: input.code,
        lotId: input.lotId,
        productId: input.productId,
        scannedAt: new Date().toISOString(),
        accountId: input.accountId,
      };
      const scans = loadScans();
      scans.unshift(scan);
      persistScans(scans.slice(0, 50));
      return scan;
    },
  };
}
