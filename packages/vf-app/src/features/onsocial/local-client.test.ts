import { beforeEach, describe, expect, it } from 'vitest';
import { FIXTURE_PRODUCT_ID } from '@/features/tracking/api/fixtures';
import { createOnSocialTracker } from '@/features/tracking/api/onsocial/onsocial-tracker';
import { coreSetPayload, recordPath } from '@/features/tracking/api/onsocial/paths';
import { createLocalOnSocialClient, LOCAL_KV_KEY } from './local-client';

describe('local OnSocial client', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('seeds fixture products and matches kind or data type', async () => {
    const client = createLocalOnSocialClient();
    const byKind = await client.queryByType('product');
    const byDataType = await client.queryByType('vf-tracker-product');
    expect(byKind.some((row) => (row.value as { id?: string }).id === FIXTURE_PRODUCT_ID)).toBe(true);
    expect(byDataType).toHaveLength(byKind.length);
    expect(client.session?.source).toBe('local');
    expect(client.session?.token).toBe('local.vf-tracker');
  });

  it('writes through set on the same path the SDK will use', async () => {
    const client = createLocalOnSocialClient();
    const path = recordPath('product', 'prd-cashew');
    const payload = coreSetPayload(path, { id: 'prd-cashew', name: 'Cashew Cream' });
    const result = await client.set(payload.data);
    expect(result.ok).toBe(true);
    const row = await client.queryByPath(path);
    expect(row?.value).toMatchObject({ id: 'prd-cashew', name: 'Cashew Cream' });
    expect(window.localStorage.getItem(LOCAL_KV_KEY)).toContain('prd-cashew');
  });

  it('registers a product through the tracker seam', async () => {
    const tracker = createOnSocialTracker(createLocalOnSocialClient());
    const product = await tracker.registerProduct({
      name: 'Cashew Cream',
      brand: 'CashewCheese',
      description: 'Cultured cashew cream',
      ingredients: ['Cashews', 'Salt'],
      claims: ['Vegan'],
      producerAccountId: 'green-valley.near',
    });
    expect((await tracker.getProduct(product.id))?.name).toBe('Cashew Cream');
    const listed = await tracker.listProducts();
    expect(listed.some((item) => item.id === product.id)).toBe(true);
  });
});
