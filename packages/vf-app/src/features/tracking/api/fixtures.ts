import type { Certificate, ChainEvent, Lot, Org, Product } from '../types';

export const FIXTURE_PRODUCER_ID = 'green-valley.near';
export const FIXTURE_CERTIFIER_ID = 'vegcert.near';
export const FIXTURE_PROCESSOR_ID = 'nordic-mill.near';
export const FIXTURE_PRODUCT_ID = 'prd-oatmilk-nordic';
export const FIXTURE_LOT_ID = 'lot-oatmilk-nordic-2403';

export const fixtureOrgs: Org[] = [
  {
    accountId: FIXTURE_PRODUCER_ID,
    name: 'Green Valley Farms',
    role: 'producer',
    status: 'active',
  },
  {
    accountId: FIXTURE_PROCESSOR_ID,
    name: 'Nordic Mill',
    role: 'processor',
    status: 'active',
  },
  {
    accountId: FIXTURE_CERTIFIER_ID,
    name: 'VegCert International',
    role: 'certifier',
    status: 'active',
  },
];

export const fixtureProducts: Product[] = [
  {
    id: FIXTURE_PRODUCT_ID,
    name: 'Barista Oat Drink',
    brand: 'Nordic Plant',
    description:
      'Oat drink from Swedish oats. Every lot is logged from field to carton so a café scan shows the farm, mill, and vegan certificate.',
    ingredients: ['Swedish oats', 'Water', 'Rapeseed oil', 'Sea salt'],
    claims: ['100% plant-based', 'No animal derivatives', 'EU organic oats'],
    producerAccountId: FIXTURE_PRODUCER_ID,
    createdAt: '2026-03-01T08:00:00.000Z',
  },
];

export const fixtureLots: Lot[] = [
  {
    id: FIXTURE_LOT_ID,
    productId: FIXTURE_PRODUCT_ID,
    label: 'Spring harvest 2026 · Lot 2403',
    harvestedAt: '2026-03-12',
    quantity: '12 000 cartons',
    site: 'Kalmar County, Sweden',
    producerAccountId: FIXTURE_PRODUCER_ID,
    createdAt: '2026-03-12T10:00:00.000Z',
  },
];

export const fixtureEvents: ChainEvent[] = [
  {
    id: 'evt-sourced-2403',
    lotId: FIXTURE_LOT_ID,
    kind: 'sourced',
    at: '2026-03-12T10:15:00.000Z',
    note: 'Oats harvested from certified vegan fields in Kalmar.',
    orgAccountId: FIXTURE_PRODUCER_ID,
  },
  {
    id: 'evt-tested-2403',
    lotId: FIXTURE_LOT_ID,
    kind: 'tested',
    at: '2026-03-14T09:00:00.000Z',
    note: 'Mill lab confirmed no animal-derived processing aids.',
    orgAccountId: FIXTURE_PROCESSOR_ID,
  },
  {
    id: 'evt-certified-2403',
    lotId: FIXTURE_LOT_ID,
    kind: 'certified',
    at: '2026-03-15T16:20:00.000Z',
    note: 'VegCert issued a vegan standard certificate for this lot.',
    orgAccountId: FIXTURE_CERTIFIER_ID,
  },
  {
    id: 'evt-packed-2403',
    lotId: FIXTURE_LOT_ID,
    kind: 'packed',
    at: '2026-03-16T11:40:00.000Z',
    note: 'Cartons packed and QR-coded at Nordic Mill.',
    orgAccountId: FIXTURE_PROCESSOR_ID,
  },
  {
    id: 'evt-shipped-2403',
    lotId: FIXTURE_LOT_ID,
    kind: 'shipped',
    at: '2026-03-17T07:05:00.000Z',
    note: 'Shipped to Whole Earth Market distribution.',
    orgAccountId: FIXTURE_PROCESSOR_ID,
  },
];

export const fixtureCertificates: Certificate[] = [
  {
    id: 'cert-vegcert-2403',
    subjectType: 'lot',
    subjectId: FIXTURE_LOT_ID,
    standard: 'VegCert Vegan Standard 2026',
    issuerAccountId: FIXTURE_CERTIFIER_ID,
    issuedAt: '2026-03-15T16:20:00.000Z',
    expiresAt: '2027-03-15T16:20:00.000Z',
    status: 'active',
  },
];

export function cloneFixtures() {
  return {
    orgs: structuredClone(fixtureOrgs),
    products: structuredClone(fixtureProducts),
    lots: structuredClone(fixtureLots),
    events: structuredClone(fixtureEvents),
    certificates: structuredClone(fixtureCertificates),
  };
}
