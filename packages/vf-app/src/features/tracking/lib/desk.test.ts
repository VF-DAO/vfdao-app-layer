import { describe, expect, it } from 'vitest';
import { FIXTURE_CERTIFIER_ID, FIXTURE_LOT_ID, FIXTURE_PROCESSOR_ID, FIXTURE_PRODUCER_ID, cloneFixtures } from '../api/fixtures';
import {
  certificateBundleHref,
  certificatesForAccount,
  deskTitle,
  eventBundleHref,
  eventsForAccount,
  lotBundleHref,
  lotsForAccount,
  productsForAccount,
} from './desk';

describe('desk lists', () => {
  const fixtures = cloneFixtures();

  it('filters products and lots to the producer wallet', () => {
    expect(productsForAccount(fixtures.products, FIXTURE_PRODUCER_ID).map((item) => item.id)).toEqual([
      fixtures.products[0].id,
    ]);
    expect(lotsForAccount(fixtures.lots, FIXTURE_PROCESSOR_ID)).toEqual([]);
    expect(lotsForAccount(fixtures.lots, FIXTURE_PRODUCER_ID)[0]?.id).toBe(FIXTURE_LOT_ID);
    expect(lotBundleHref(FIXTURE_LOT_ID)).toBe(`/scan/${encodeURIComponent(`vf:lot:${FIXTURE_LOT_ID}`)}`);
  });

  it('filters stamps and certs to the writer wallet', () => {
    expect(eventsForAccount(fixtures.events, FIXTURE_PROCESSOR_ID).every((event) => event.orgAccountId === FIXTURE_PROCESSOR_ID)).toBe(
      true
    );
    expect(certificatesForAccount(fixtures.certificates, FIXTURE_CERTIFIER_ID)[0]?.subjectId).toBe(FIXTURE_LOT_ID);
    expect(certificateBundleHref(fixtures.certificates[0])).toBe(lotBundleHref(FIXTURE_LOT_ID));
    expect(eventBundleHref(fixtures.events[0])).toBe(lotBundleHref(fixtures.events[0].lotId));
  });

  it('names the desk from the VF org role, not profile kind', () => {
    expect(deskTitle('producer')).toBe('Producer desk');
    expect(deskTitle('certifier')).toBe('Certifier desk');
    expect(deskTitle('processor')).toBe('Mill desk');
  });
});
