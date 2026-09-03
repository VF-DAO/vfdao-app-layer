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
