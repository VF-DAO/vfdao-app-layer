import { describe, expect, it } from 'vitest';
import type { Certificate } from '../types';
import {
  assertOrgCertificateExpiry,
  assertRevokeReason,
  certificateReviewState,
  certificateStateLabel,
  certificateUntilLabel,
  formatReviewDay,
  groupCertificatesByReview,
  isCertificateActive,
  orgCertificatesFor,
  scanCompanyReview,
  splitOrgReviews,
} from './status';

const cert = (overrides: Partial<Certificate> = {}): Certificate => ({
  id: 'cert-1',
  subjectType: 'lot',
  subjectId: 'lot-1',
  standard: 'VegCert',
  issuerAccountId: 'vegcert.near',
  issuedAt: '2026-03-15T00:00:00.000Z',
  expiresAt: '2027-03-15T00:00:00.000Z',
  status: 'active',
  ...overrides,
});

describe('certificate activity', () => {
  it('treats an unexpired active stamp as live', () => {
    expect(isCertificateActive(cert(), Date.parse('2026-06-01'))).toBe(true);
  });

  it('treats expired certificates as inactive', () => {
    const expired = cert({ expiresAt: '2020-01-01T00:00:00.000Z' });
    expect(isCertificateActive(expired, Date.parse('2026-01-01'))).toBe(false);
  });

  it('keeps company review certs off the lot subject', () => {
    const org = cert({
      id: 'cert-org',
      subjectType: 'org',
      subjectId: 'green-valley.near',
      expiresAt: '2027-03-01T00:00:00.000Z',
    });
    expect(orgCertificatesFor([org, cert()], 'green-valley.near')).toEqual([org]);
    expect(formatReviewDay('2027-03-01T08:00:00.000Z')).toBe('1 Mar 2027');
    expect(certificateUntilLabel(org, Date.parse('2026-06-01'))).toBe('Until 1 Mar 2027');
    expect(() => assertOrgCertificateExpiry('org')).toThrow(/expiry/);
    expect(() => assertOrgCertificateExpiry('org', '2027-03-01')).not.toThrow();
    expect(() => assertOrgCertificateExpiry('lot')).not.toThrow();
  });

  it('splits the review clock into due, lapsed, and revoked', () => {
    const now = Date.parse('2026-09-04T12:00:00.000Z');
    const due = cert({
      id: 'due',
      subjectType: 'org',
      expiresAt: '2026-09-20T00:00:00.000Z',
    });
    const lapsed = cert({
      id: 'lapsed',
      subjectType: 'org',
      expiresAt: '2026-03-01T00:00:00.000Z',
    });
    const revoked = cert({
      id: 'revoked',
      subjectType: 'org',
      status: 'revoked',
      revokeReason: 'Site closed',
    });
    expect(certificateReviewState(due, now)).toBe('due');
    expect(isCertificateActive(due, now)).toBe(true);
    expect(certificateUntilLabel(due, now)).toBe('Due 20 Sep 2026');
    expect(certificateStateLabel(certificateReviewState(lapsed, now), 'org')).toBe('Lapsed');
    expect(certificateStateLabel(certificateReviewState(lapsed, now), 'lot')).toBe('Expired');
    expect(certificateUntilLabel(lapsed, now)).toBe('Review lapsed 1 Mar 2026');
    expect(certificateUntilLabel(revoked, now)).toBe('Revoked — Site closed');
    expect(assertRevokeReason('  Site closed  ')).toBe('Site closed');
    expect(() => assertRevokeReason('   ')).toThrow(/reason/);
    const groups = groupCertificatesByReview([due, lapsed, revoked, cert()], now);
    expect(groups.due.map((item) => item.id)).toEqual(['due']);
    expect(groups.lapsed.map((item) => item.id)).toEqual(['lapsed']);
    expect(groups.revoked.map((item) => item.id)).toEqual(['revoked']);
    expect(groups.active).toHaveLength(1);
  });

  it('picks one live company review for scan, and splits profile history', () => {
    const now = Date.parse('2026-09-04T12:00:00.000Z');
    const live = cert({
      id: 'live',
      subjectType: 'org',
      subjectId: 'green-valley.near',
      issuedAt: '2026-03-01T00:00:00.000Z',
      expiresAt: '2027-03-01T00:00:00.000Z',
    });
    const olderLive = cert({
      id: 'older-live',
      subjectType: 'org',
      subjectId: 'green-valley.near',
      issuedAt: '2025-09-01T00:00:00.000Z',
      expiresAt: '2026-12-01T00:00:00.000Z',
    });
    const lapsed = cert({
      id: 'lapsed',
      subjectType: 'org',
      subjectId: 'green-valley.near',
      issuedAt: '2025-03-01T00:00:00.000Z',
      expiresAt: '2026-03-01T00:00:00.000Z',
    });
    expect(scanCompanyReview([lapsed, live, olderLive], now)?.id).toBe('live');
    expect(scanCompanyReview([lapsed], now)?.id).toBe('lapsed');
    expect(scanCompanyReview([], now)).toBeNull();
    expect(splitOrgReviews([lapsed, live, olderLive], 'green-valley.near', now)).toEqual({
      current: live,
      earlier: [olderLive, lapsed],
    });
    expect(splitOrgReviews([lapsed], 'green-valley.near', now)).toEqual({
      current: lapsed,
      earlier: [],
    });
  });
});
