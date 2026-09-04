import { describe, expect, it } from 'vitest';
import type { Certificate } from '../types';
import { assertOrgCertificateExpiry, certificateUntilLabel, isCertificateActive, orgCertificatesFor } from './status';

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
    expect(certificateUntilLabel(org)).toMatch(/^Until /);
    expect(() => assertOrgCertificateExpiry('org')).toThrow(/expiry/);
    expect(() => assertOrgCertificateExpiry('org', '2027-03-01')).not.toThrow();
    expect(() => assertOrgCertificateExpiry('lot')).not.toThrow();
  });
});
