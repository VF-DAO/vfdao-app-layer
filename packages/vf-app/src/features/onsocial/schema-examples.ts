/**
 * Example core Set payloads. The SDK swap is `os.social.set(data)`
 * with the same keys. Indexed as dataType=apps, dataId=vf-tracker.
 * Keep this file as the contract, not a runtime import.
 */
export const productSetExample = {
  'apps/vf-tracker/product/prd-oatmilk-nordic': JSON.stringify({
    id: 'prd-oatmilk-nordic',
    name: 'Barista Oat Drink',
    brand: 'Nordic Plant',
    producerAccountId: 'green-valley.near',
  }),
};

export const lotSetExample = {
  'apps/vf-tracker/lot/lot-oatmilk-nordic-2403': JSON.stringify({
    id: 'lot-oatmilk-nordic-2403',
    productId: 'prd-oatmilk-nordic',
    label: 'Spring harvest 2026 · Lot 2403',
    producerAccountId: 'green-valley.near',
  }),
};

export const profileSetExample = {
  'profile/kind': 'org',
  'profile/name': 'Green Valley Farms',
  'profile/industry': 'Agriculture',
};

export const sproutSetExample = {
  'apps/vf-tracker/sprout/product/prd-oatmilk-nordic/cafe.near': JSON.stringify({
    id: 'product/prd-oatmilk-nordic/cafe.near',
    subjectType: 'product',
    subjectId: 'prd-oatmilk-nordic',
    accountId: 'cafe.near',
    at: '2026-09-04T11:00:00.000Z',
  }),
};

export const noteSetExample = {
  'apps/vf-tracker/note/note-taste-1': JSON.stringify({
    id: 'note-taste-1',
    subjectType: 'lot',
    subjectId: 'lot-oatmilk-nordic-2403',
    body: 'Steams well for cappuccinos.',
    accountId: 'cafe.near',
    at: '2026-09-04T11:05:00.000Z',
  }),
};
