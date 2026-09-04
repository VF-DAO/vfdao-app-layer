import type { OnSocialClient, OnSocialRecord, OnSocialSession } from './types';
import { cloneFixtures } from '@/features/tracking/api/fixtures';
import {
  DEFAULT_APP_ID,
  jsonContains,
  matchesRecordType,
  pathMatchesAppPrefix,
  recordPath,
} from '@/features/tracking/api/onsocial/paths';
import { ensureLocalSession } from './session';

export const LOCAL_KV_KEY = 'vf.onsocial.kv.v1';
const LEGACY_KEY = 'vf.tracking.v1';

type KvStore = Record<string, OnSocialRecord>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readJson<T>(key: string, fallback: T): T {
  if (!canUseStorage()) return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

function put(store: KvStore, path: string, value: unknown, accountId?: string): void {
  store[path] = { path, value, accountId };
}

function seedFromFixtures(appId: string): KvStore {
  const fixtures = cloneFixtures();
  const store: KvStore = {};
  fixtures.orgs.forEach((org) => put(store, recordPath('org', org.accountId, appId), org, org.accountId));
  fixtures.products.forEach((product) =>
    put(store, recordPath('product', product.id, appId), product, product.producerAccountId)
  );
  fixtures.lots.forEach((lot) => put(store, recordPath('lot', lot.id, appId), lot, lot.producerAccountId));
  fixtures.events.forEach((event) =>
    put(store, recordPath('event', `${event.lotId}/${event.id}`, appId), event, event.orgAccountId)
  );
  fixtures.certificates.forEach((certificate) =>
    put(store, recordPath('certificate', certificate.id, appId), certificate, certificate.issuerAccountId)
  );
  fixtures.listings.forEach((listing) =>
    put(store, recordPath('listed', listing.orgAccountId, appId), listing, listing.orgAccountId)
  );
  return store;
}

function importLegacy(store: KvStore, appId: string): void {
  const legacy = readJson<{
    orgs?: { accountId: string }[];
    products?: { id: string; producerAccountId?: string }[];
    lots?: { id: string; producerAccountId?: string }[];
    events?: { id: string; lotId: string; orgAccountId?: string }[];
    certificates?: { id: string; issuerAccountId?: string }[];
  } | null>(LEGACY_KEY, null);
  if (!legacy) return;
  legacy.orgs?.forEach((org) => put(store, recordPath('org', org.accountId, appId), org, org.accountId));
  legacy.products?.forEach((product) =>
    put(store, recordPath('product', product.id, appId), product, product.producerAccountId)
  );
  legacy.lots?.forEach((lot) =>
    put(store, recordPath('lot', lot.id, appId), lot, lot.producerAccountId)
  );
  legacy.events?.forEach((event) =>
    put(store, recordPath('event', `${event.lotId}/${event.id}`, appId), event, event.orgAccountId)
  );
  legacy.certificates?.forEach((certificate) =>
    put(store, recordPath('certificate', certificate.id, appId), certificate, certificate.issuerAccountId)
  );
}

function loadKv(appId: string): KvStore {
  const saved = readJson<KvStore | null>(LOCAL_KV_KEY, null);
  if (saved && Object.keys(saved).length > 0) return saved;
  const seeded = seedFromFixtures(appId);
  importLegacy(seeded, appId);
  writeJson(LOCAL_KV_KEY, seeded);
  return seeded;
}

export function createLocalOnSocialClient(appId = DEFAULT_APP_ID): OnSocialClient {
  const session: OnSocialSession = ensureLocalSession(appId);

  return {
    session,
    async queryByType(type: string) {
      return Object.values(loadKv(appId)).filter((row) => matchesRecordType(row.path, type, appId));
    },
    async queryByPath(path: string) {
      const store = loadKv(appId);
      return store[path] ?? Object.values(store).find((row) => row.path.endsWith(`/${path}`)) ?? null;
    },
    async queryByPrefix(prefix: string) {
      return Object.values(loadKv(appId)).filter((row) => pathMatchesAppPrefix(row.path, prefix, appId));
    },
    async queryByJsonContains(contains: Record<string, unknown>) {
      return Object.values(loadKv(appId)).filter((row) => jsonContains(row.value, contains));
    },
    async set(data) {
      const store = loadKv(appId);
      Object.entries(data).forEach(([path, raw]) => {
        let value: unknown = raw;
        try {
          value = JSON.parse(raw);
        } catch {
          value = raw;
        }
        if (value === null) {
          delete store[path];
          return;
        }
        put(store, path, value, session.actorId);
      });
      writeJson(LOCAL_KV_KEY, store);
      return { ok: true };
    },
  };
}
