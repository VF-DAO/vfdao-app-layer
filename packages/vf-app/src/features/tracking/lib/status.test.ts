import { describe, expect, it } from 'vitest';
import type { Certificate } from '../types';
import { isCertificateActive } from './status';

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
});
