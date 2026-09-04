import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { OnSocialClient } from '@/features/onsocial';
import { createLocalOnSocialClient } from '@/features/onsocial';
import { FIXTURE_LOT_ID, FIXTURE_PRODUCT_ID } from '../fixtures';
import { encodeLotQr } from '../../lib/qr';
import { createOnSocialTracker } from './onsocial-tracker';

function emptyClient(): OnSocialClient {
  return {
    session: null,
    queryByType: async () => [],
    queryByPath: async () => null,
    queryByPrefix: async () => [],
    queryByJsonContains: async () => [],
    set: async () => ({ ok: false, needsSession: true, message: 'no session' }),
  };
}

function throwingClient(): OnSocialClient {
  const fail = async () => {
    throw new Error('gateway down');
  };
  return {
    session: null,
    queryByType: fail,
    queryByPath: fail,
    queryByPrefix: fail,
    queryByJsonContains: fail,
    set: async () => ({ ok: false, needsSession: true, message: 'no session' }),
  };
}

describe('OnSocial tracker fixture fallback', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('resolves the fixture oat drink when OnSocial is not configured', async () => {
    vi.stubEnv('ONSOCIAL_API_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_BACKEND', 'local');
    const tracker = createOnSocialTracker(createLocalOnSocialClient());
    const bundle = await tracker.getLotBundle(FIXTURE_LOT_ID);
    expect(bundle?.lot.id).toBe(FIXTURE_LOT_ID);
    expect(await tracker.resolveScan(encodeLotQr(FIXTURE_LOT_ID))).not.toBeNull();
    expect((await tracker.status()).note).toMatch(/Local OnSocial seam/);
  });

  it('does not resolve the fixture lot when an OnAPI key is set and core is empty', async () => {
    vi.stubEnv('ONSOCIAL_API_KEY', 'test-key');
    const tracker = createOnSocialTracker(emptyClient());
    expect(await tracker.getLot(FIXTURE_LOT_ID)).toBeNull();
    expect(await tracker.getProduct(FIXTURE_PRODUCT_ID)).toBeNull();
    expect(await tracker.getLotBundle(FIXTURE_LOT_ID)).toBeNull();
    expect(await tracker.resolveScan(`vf:lot:${FIXTURE_LOT_ID}`)).toBeNull();
    expect(await tracker.listProducts()).toEqual([]);
    expect(await tracker.listListed()).toEqual([]);
    expect(await tracker.isListed('green-valley.near')).toBe(false);
    expect((await tracker.status()).note).toMatch(/fixtures are off/);
    await expect(
      tracker.registerProduct({
        name: 'Should not use fixture producer',
        brand: 'Pilot',
        description: 'Prod write',
        ingredients: [],
        claims: [],
        producerAccountId: 'green-valley.near',
      })
    ).rejects.toThrow(/Producer role required/);
  });

  it('does not use fixtures when a live read throws', async () => {
    vi.stubEnv('ONSOCIAL_API_KEY', 'test-key');
    const tracker = createOnSocialTracker(throwingClient());
    expect(await tracker.getLotBundle(FIXTURE_LOT_ID)).toBeNull();
    expect(await tracker.resolveScan(`vf:lot:${FIXTURE_LOT_ID}`)).toBeNull();
    expect(await tracker.listLotsForAccount('green-valley.near')).toEqual([]);
    expect(await tracker.isListed('green-valley.near')).toBe(false);
  });

  it('keeps fixtures when TRACKER_ALLOW_FIXTURES=1 even with a key', async () => {
    vi.stubEnv('ONSOCIAL_API_KEY', 'test-key');
    vi.stubEnv('TRACKER_ALLOW_FIXTURES', '1');
    const tracker = createOnSocialTracker(emptyClient());
    const bundle = await tracker.getLotBundle(FIXTURE_LOT_ID);
    expect(bundle?.lot.id).toBe(FIXTURE_LOT_ID);
    expect(await tracker.isListed('green-valley.near')).toBe(true);
    expect((await tracker.status()).note).toMatch(/TRACKER_ALLOW_FIXTURES/);
  });

  it('does not invent sprouts or notes when a live read is empty', async () => {
    vi.stubEnv('ONSOCIAL_API_KEY', 'test-key');
    const tracker = createOnSocialTracker(emptyClient());
    expect(await tracker.listSprouts('product', FIXTURE_PRODUCT_ID)).toEqual([]);
    expect(await tracker.listNotes('lot', FIXTURE_LOT_ID)).toEqual([]);
    expect((await tracker.getSproutStats('product', FIXTURE_PRODUCT_ID, 'cafe.near')).count).toBe(0);
  });

  it('turns fixtures off with TRACKER_ALLOW_FIXTURES=0', async () => {
    vi.stubEnv('TRACKER_ALLOW_FIXTURES', '0');
    const tracker = createOnSocialTracker(emptyClient());
    expect(await tracker.getLotBundle(FIXTURE_LOT_ID)).toBeNull();
    expect(await tracker.resolveScan(`vf:lot:${FIXTURE_LOT_ID}`)).toBeNull();
  });
});
