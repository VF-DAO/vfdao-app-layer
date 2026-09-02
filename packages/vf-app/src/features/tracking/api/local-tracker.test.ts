import { beforeEach, describe, expect, it } from 'vitest';
import { createLocalTracker } from './local-tracker';
import { FIXTURE_LOT_ID, FIXTURE_PRODUCT_ID } from './fixtures';
import { encodeLotQr } from '../lib/qr';

describe('local tracker', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('resolves the fixture oat drink from a VF QR code', async () => {
    const tracker = createLocalTracker();
    const bundle = await tracker.resolveScan(encodeLotQr(FIXTURE_LOT_ID));
    expect(bundle?.product.id).toBe(FIXTURE_PRODUCT_ID);
    expect(bundle?.events.map((event) => event.kind)).toContain('certified');
    expect(bundle?.certificates[0]?.standard).toMatch(/VegCert/);
  });

  it('registers a product and opens a lot', async () => {
    const tracker = createLocalTracker();
    const product = await tracker.registerProduct({
      name: 'Cashew Cream',
      brand: 'CashewCheese',
      description: 'Cultured cashew cream',
      ingredients: ['Cashews', 'Salt'],
      claims: ['Vegan'],
      producerAccountId: 'cashew.near',
    });
    const lot = await tracker.createLot({
      productId: product.id,
      label: 'Pilot lot',
      harvestedAt: '2026-04-01',
      quantity: '200 jars',
      site: 'Portland',
      producerAccountId: 'cashew.near',
    });
    expect(lot.productId).toBe(product.id);
    const listed = await tracker.listProducts();
    expect(listed.some((item) => item.id === product.id)).toBe(true);
  });
});
