import type { Certificate, ChainEvent, Listing, Lot, Org, Product } from '../types';

export const FIXTURE_PRODUCER_ID = 'green-valley.near';
export const FIXTURE_CERTIFIER_ID = 'vegcert.near';
export const FIXTURE_PROCESSOR_ID = 'nordic-mill.near';
export const FIXTURE_PRODUCT_ID = 'prd-oatmilk-nordic';
export const FIXTURE_PRODUCT_CREAM_ID = 'prd-oatcream-nordic';
export const FIXTURE_PRODUCT_BAR_ID = 'prd-oatbar-kalmar';
export const FIXTURE_LOT_ID = 'lot-oatmilk-nordic-2403';
export const FIXTURE_LOT_AUTUMN_ID = 'lot-oatmilk-nordic-2311';
export const FIXTURE_LOT_CREAM_ID = 'lot-oatcream-nordic-119';

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
  {
    id: FIXTURE_PRODUCT_CREAM_ID,
    name: 'Oat Cooking Cream',
    brand: 'Nordic Plant',
    description: 'Cooking cream from the same Kalmar oats. Same farm, separate SKU and lots.',
    ingredients: ['Swedish oats', 'Rapeseed oil'],
    claims: ['100% plant-based', 'No animal derivatives'],
    producerAccountId: FIXTURE_PRODUCER_ID,
    createdAt: '2026-02-01T08:00:00.000Z',
  },
  {
    id: FIXTURE_PRODUCT_BAR_ID,
    name: 'Kalmar Oat Bar',
    brand: 'Green Valley',
    description: 'Pressed oat bar. Registered as a SKU; no lot opened yet.',
    ingredients: ['Swedish oats', 'Dates'],
    claims: ['100% plant-based'],
    producerAccountId: FIXTURE_PRODUCER_ID,
    createdAt: '2026-04-01T08:00:00.000Z',
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
  {
    id: FIXTURE_LOT_AUTUMN_ID,
    productId: FIXTURE_PRODUCT_ID,
    label: 'Autumn harvest 2025 · Lot 2311',
    harvestedAt: '2025-11-02',
    quantity: '9 000 cartons',
    site: 'Kalmar County, Sweden',
    producerAccountId: FIXTURE_PRODUCER_ID,
    createdAt: '2025-11-02T10:00:00.000Z',
  },
  {
    id: FIXTURE_LOT_CREAM_ID,
    productId: FIXTURE_PRODUCT_CREAM_ID,
    label: 'Winter cook 2026 · Lot 119',
    harvestedAt: '2026-01-20',
    quantity: '4 000 tubs',
    site: 'Kalmar County, Sweden',
    producerAccountId: FIXTURE_PRODUCER_ID,
    createdAt: '2026-01-20T10:00:00.000Z',
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
    id: 'evt-tested-lab-2403',
    lotId: FIXTURE_LOT_ID,
    kind: 'tested',
    at: '2026-03-14T15:30:00.000Z',
    note: 'Independent lab confirmed the mill result.',
    orgAccountId: 'plant-lab.near',
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
    id: 'cert-vegcert-green-valley-org',
    subjectType: 'org',
    subjectId: FIXTURE_PRODUCER_ID,
    standard: 'VegCert Facility Standard 2026',
    issuerAccountId: FIXTURE_CERTIFIER_ID,
    issuedAt: '2026-03-01T08:00:00.000Z',
    expiresAt: '2027-03-01T08:00:00.000Z',
    status: 'active',
  },
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

export const fixtureListings: Listing[] = [
  {
    orgAccountId: FIXTURE_PRODUCER_ID,
    listedAt: '2026-03-01T08:00:00.000Z',
  },
];

export function cloneFixtures() {
  return {
    orgs: structuredClone(fixtureOrgs),
    products: structuredClone(fixtureProducts),
    lots: structuredClone(fixtureLots),
    events: structuredClone(fixtureEvents),
    certificates: structuredClone(fixtureCertificates),
    listings: structuredClone(fixtureListings),
  };
}
