import { describe, expect, it } from 'vitest';
import {
  cloneFixtures,
  FIXTURE_CERTIFIER_ID,
  FIXTURE_LOT_ID,
  FIXTURE_PROCESSOR_ID,
  FIXTURE_PRODUCER_ID,
  FIXTURE_PRODUCT_BAR_ID,
  FIXTURE_PRODUCT_CREAM_ID,
  FIXTURE_PRODUCT_ID,
} from '../api/fixtures';
import {
  certificateBundleHref,
  certificatesForAccount,
  deskTitle,
  eventBundleHref,
  eventsForAccount,
  filterProductDeskRows,
  lotBundleHref,
  lotsForAccount,
  productDeskRows,
  productsForAccount,
} from './desk';

describe('desk lists', () => {
  const fixtures = cloneFixtures();

  it('filters products and lots to the producer wallet', () => {
    expect(productsForAccount(fixtures.products, FIXTURE_PRODUCER_ID).map((item) => item.id)).toEqual([
      FIXTURE_PRODUCT_BAR_ID,
      FIXTURE_PRODUCT_ID,
      FIXTURE_PRODUCT_CREAM_ID,
    ]);
    expect(lotsForAccount(fixtures.lots, FIXTURE_PROCESSOR_ID)).toEqual([]);
    expect(lotsForAccount(fixtures.lots, FIXTURE_PRODUCER_ID)[0]?.id).toBe(FIXTURE_LOT_ID);
    expect(lotBundleHref(FIXTURE_LOT_ID)).toBe(`/scan/${encodeURIComponent(`vf:lot:${FIXTURE_LOT_ID}`)}`);
  });

  it('groups lots under each product and searches across SKU fields', () => {
    const rows = productDeskRows(
      productsForAccount(fixtures.products, FIXTURE_PRODUCER_ID),
      lotsForAccount(fixtures.lots, FIXTURE_PRODUCER_ID)
    );
    const barista = rows.find((row) => row.product.id === FIXTURE_PRODUCT_ID);
    const bar = rows.find((row) => row.product.id === FIXTURE_PRODUCT_BAR_ID);
    expect(barista?.lots).toHaveLength(2);
    expect(bar?.lots).toHaveLength(0);
    expect(filterProductDeskRows(rows, 'cream').map((row) => row.product.id)).toEqual([FIXTURE_PRODUCT_CREAM_ID]);
    expect(filterProductDeskRows(rows, '2403').map((row) => row.product.id)).toEqual([FIXTURE_PRODUCT_ID]);
  });

  it('filters stamps and certs to the writer wallet', () => {
    expect(eventsForAccount(fixtures.events, FIXTURE_PROCESSOR_ID).every((event) => event.orgAccountId === FIXTURE_PROCESSOR_ID)).toBe(
      true
    );
    expect(certificatesForAccount(fixtures.certificates, FIXTURE_CERTIFIER_ID).map((item) => item.subjectType)).toEqual(
      ['lot', 'org']
    );
    expect(certificateBundleHref(fixtures.certificates.find((item) => item.subjectType === 'lot')!)).toBe(
      lotBundleHref(FIXTURE_LOT_ID)
    );
    expect(certificateBundleHref(fixtures.certificates.find((item) => item.subjectType === 'org')!)).toBe(
      `/profile/${FIXTURE_PRODUCER_ID}`
    );
    expect(eventBundleHref(fixtures.events[0])).toBe(lotBundleHref(fixtures.events[0].lotId));
  });

  it('names the desk from the VF org role, not profile kind', () => {
    expect(deskTitle('producer')).toBe('Producer desk');
    expect(deskTitle('certifier')).toBe('Certifier desk');
    expect(deskTitle('processor')).toBe('Mill desk');
  });
});
