import { describe, expect, it } from 'vitest';
import type { Certificate } from '../types';
import {
  buildOrgCertSoulboundCollection,
  buildOrgCertSoulboundMint,
  buildOrgCertSoulboundRevoke,
  orgReviewCollectionId,
} from './org-cert-soulbound';

const now = Date.parse('2026-09-04T12:00:00.000Z');

const orgCert = (overrides: Partial<Certificate> = {}): Certificate => ({
  id: 'cert-vegcert-green-valley-org',
  subjectType: 'org',
  subjectId: 'green-valley.near',
  standard: 'VegCert Facility Standard 2026',
  issuerAccountId: 'vegcert.near',
  issuedAt: '2026-03-01T08:00:00.000Z',
  expiresAt: '2027-03-01T08:00:00.000Z',
  status: 'active',
  ...overrides,
});

describe('org cert soulbound mirror', () => {
  it('builds a non-transferable collection and a mint onto the producer wallet', () => {
    const collection = buildOrgCertSoulboundCollection('vegcert.near');
    expect(collection).toMatchObject({
      collectionId: 'vf-org-review-vegcert-near',
      transferable: false,
      renewable: true,
      burnable: true,
      appId: 'vf-tracker',
    });
    expect(orgReviewCollectionId('VegCert.near')).toBe('vf-org-review-vegcert-near');

    const mint = buildOrgCertSoulboundMint(
      orgCert({ evidenceCid: 'bafytestevidencecid0000000000000000000000000000' }),
      now
    );
    expect(mint.receiverId).toBe('green-valley.near');
    expect(mint.collectionId).toBe(collection.collectionId);
    expect(mint.copies).toBe(1);
    expect(mint.expiresAtMs).toBe(Date.parse('2027-03-01T08:00:00.000Z'));
    expect(mint.expiresAtNs).toBe(mint.expiresAtMs * 1_000_000);
    expect(mint.extra.vfTracker).toEqual({
      kind: 'org-cert',
      certificateId: 'cert-vegcert-green-valley-org',
      issuerAccountId: 'vegcert.near',
      subjectId: 'green-valley.near',
      standard: 'VegCert Facility Standard 2026',
      expiresAt: '2027-03-01T08:00:00.000Z',
      evidenceCid: 'bafytestevidencecid0000000000000000000000000000',
    });
    expect(mint.description).toMatch(/not every SKU/);
  });

  it('allows a due review and refuses lot, lapsed, and revoked stamps', () => {
    const due = orgCert({ expiresAt: '2026-09-20T00:00:00.000Z' });
    expect(buildOrgCertSoulboundMint(due, now).receiverId).toBe('green-valley.near');

    expect(() =>
      buildOrgCertSoulboundMint(orgCert({ subjectType: 'lot', subjectId: 'lot-1' }), now)
    ).toThrow(/company reviews only/);
    expect(() => buildOrgCertSoulboundMint(orgCert({ expiresAt: undefined }), now)).toThrow(/expiry/);
    expect(() =>
      buildOrgCertSoulboundMint(orgCert({ expiresAt: '2026-03-01T00:00:00.000Z' }), now)
    ).toThrow(/Lapsed/);
    expect(() =>
      buildOrgCertSoulboundMint(orgCert({ status: 'revoked', revokeReason: 'Site closed' }), now)
    ).toThrow(/Revoked/);
  });

  it('revokes the badge with the certifier collection and the review reason', () => {
    const revoked = orgCert({ status: 'revoked', revokeReason: 'Site closed' });
    expect(buildOrgCertSoulboundRevoke(revoked, 'token-99')).toEqual({
      tokenId: 'token-99',
      collectionId: 'vf-org-review-vegcert-near',
      memo: 'Site closed',
    });
    expect(() => buildOrgCertSoulboundRevoke(orgCert({ subjectType: 'lot' }), 'token-99')).toThrow(
      /company-review/
    );
    expect(() => buildOrgCertSoulboundRevoke(orgCert(), '  ')).toThrow(/token id/);
  });
});
