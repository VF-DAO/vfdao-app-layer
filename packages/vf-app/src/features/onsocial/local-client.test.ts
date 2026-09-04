import { beforeEach, describe, expect, it } from 'vitest';
import { FIXTURE_LOT_ID, FIXTURE_PRODUCT_ID } from '@/features/tracking/api/fixtures';
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

  it('indexes scan compose by JSON fields across writers', async () => {
    const client = createLocalOnSocialClient();
    await client.set(
      coreSetPayload('apps/vf-tracker/event/lot-scan/evt-mill', {
        id: 'evt-mill',
        lotId: 'lot-scan',
        kind: 'processed',
        at: '2026-04-01T00:00:00.000Z',
        note: 'Milled',
        orgAccountId: 'nordic-mill.near',
      }).data
    );
    await client.set(
      coreSetPayload('apps/vf-tracker/certificate/cert-scan', {
        id: 'cert-scan',
        subjectType: 'lot',
        subjectId: 'lot-scan',
        standard: 'VegCert',
        issuerAccountId: 'vegcert.near',
        issuedAt: '2026-04-02T00:00:00.000Z',
        status: 'active',
      }).data
    );

    const events = await client.queryByJsonContains({ lotId: 'lot-scan' });
    const certs = await client.queryByJsonContains({ subjectId: 'lot-scan' });
    const lotsOnly = await client.queryByPrefix('lot');
    expect(events.some((row) => (row.value as { id?: string }).id === 'evt-mill')).toBe(true);
    expect(certs.some((row) => (row.value as { id?: string }).id === 'cert-scan')).toBe(true);
    expect(lotsOnly.every((row) => row.path.includes('/lot/'))).toBe(true);
    expect(lotsOnly.some((row) => row.path.includes('/lottery/'))).toBe(false);

    const tracker = createOnSocialTracker(client);
    const bundle = await tracker.getLotBundle(FIXTURE_LOT_ID);
    expect(bundle?.lot.id).toBe(FIXTURE_LOT_ID);
    expect(bundle?.events.length).toBeGreaterThan(0);
    expect(bundle?.certificates.length).toBeGreaterThan(0);
    expect(bundle?.vfListed).toBe(true);
    expect(bundle?.events.filter((event) => event.kind === 'tested').map((event) => event.orgAccountId)).toEqual(
      expect.arrayContaining(['nordic-mill.near', 'plant-lab.near'])
    );
  });

  it('lists desk rows by account through the same json-contains path', async () => {
    const tracker = createOnSocialTracker(createLocalOnSocialClient());
    const lots = await tracker.listLotsForAccount('green-valley.near');
    const certs = await tracker.listCertificatesForAccount('vegcert.near');
    const mill = await tracker.listEventsForAccount('nordic-mill.near');
    expect(lots[0]?.id).toBe(FIXTURE_LOT_ID);
    expect(certs[0]?.issuerAccountId).toBe('vegcert.near');
    expect(mill.every((event) => event.orgAccountId === 'nordic-mill.near')).toBe(true);
  });

  it('sprouts a product and notes a lot on the app path, not the feed', async () => {
    const tracker = createOnSocialTracker(createLocalOnSocialClient());
    const first = await tracker.toggleSprout({
      subjectType: 'product',
      subjectId: FIXTURE_PRODUCT_ID,
      accountId: 'cafe.near',
    });
    expect(first.count).toBe(1);
    expect(first.viewerSprouted).toBe(true);
    const again = await tracker.toggleSprout({
      subjectType: 'product',
      subjectId: FIXTURE_PRODUCT_ID,
      accountId: 'cafe.near',
    });
    expect(again.count).toBe(0);
    await tracker.toggleSprout({
      subjectType: 'product',
      subjectId: FIXTURE_PRODUCT_ID,
      accountId: 'cafe.near',
    });
    await tracker.toggleSprout({
      subjectType: 'product',
      subjectId: FIXTURE_PRODUCT_ID,
      accountId: 'shop.near',
    });
    expect((await tracker.getSproutStats('product', FIXTURE_PRODUCT_ID, 'cafe.near')).count).toBe(2);

    const note = await tracker.addNote({
      subjectType: 'lot',
      subjectId: FIXTURE_LOT_ID,
      accountId: 'cafe.near',
      body: 'Steams well',
    });
    await tracker.addNote({
      subjectType: 'lot',
      subjectId: FIXTURE_LOT_ID,
      accountId: 'green-valley.near',
      body: 'Glad it held',
      parentId: note.id,
    });
    await expect(
      tracker.addNote({
        subjectType: 'org',
        subjectId: 'green-valley.near',
        accountId: 'cafe.near',
        body: 'Fans',
      })
    ).rejects.toThrow(/Stand with the org/);
    const notes = await tracker.listNotes('lot', FIXTURE_LOT_ID);
    expect(notes).toHaveLength(2);
    expect(notes[0]?.body).toBe('Steams well');
    expect(notes[1]?.parentId).toBe(note.id);
  });

  it('rejects writes from the wrong org role', async () => {
    const tracker = createOnSocialTracker(createLocalOnSocialClient());
    await expect(
      tracker.registerProduct({
        name: 'Fake Stamp',
        brand: 'VegCert',
        description: 'Should not publish',
        ingredients: [],
        claims: [],
        producerAccountId: 'vegcert.near',
      })
    ).rejects.toThrow(/Producer role required/);
    await expect(
      tracker.issueCertificate({
        subjectType: 'lot',
        subjectId: 'lot-oatmilk-nordic-2403',
        standard: 'VegCert Vegan Standard 2026',
        issuerAccountId: 'green-valley.near',
      })
    ).rejects.toThrow(/Certifier role required/);
  });

  it('revokes a company review on the certifier path', async () => {
    const tracker = createOnSocialTracker(createLocalOnSocialClient());
    const issued = await tracker.issueCertificate({
      subjectType: 'org',
      subjectId: 'green-valley.near',
      standard: 'VegCert Facility Standard 2026',
      issuerAccountId: 'vegcert.near',
      expiresAt: '2028-03-01T00:00:00.000Z',
      evidenceCid: 'bafytestevidencecid0000000000000000000000000000',
    });
    await expect(
      tracker.revokeCertificate({
        certificateId: issued.id,
        issuerAccountId: 'green-valley.near',
        revokeReason: 'Not VegCert',
      })
    ).rejects.toThrow(/Certifier role required/);
    const revoked = await tracker.revokeCertificate({
      certificateId: issued.id,
      issuerAccountId: 'vegcert.near',
      revokeReason: 'Site closed',
    });
    expect(revoked.status).toBe('revoked');
    const reviews = await tracker.getCertificates('green-valley.near');
    expect(reviews.find((item) => item.id === issued.id)?.revokeReason).toBe('Site closed');
  });
});
