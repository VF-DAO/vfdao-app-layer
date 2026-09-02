import { describe, expect, it } from 'vitest';
import { deriveVerificationStatus, isCertificateActive } from './status';
import type { Certificate, ChainEvent } from '../types';

const event = (kind: ChainEvent['kind']): ChainEvent => ({
  id: kind,
  lotId: 'lot-1',
  kind,
  at: '2026-03-15T00:00:00.000Z',
  note: kind,
  orgAccountId: 'org.near',
});

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

describe('verification status', () => {
  it('is unverified with no events', () => {
    expect(deriveVerificationStatus([], []).label).toBe('Unverified');
  });

  it('is in progress before a certificate', () => {
    expect(deriveVerificationStatus([event('sourced'), event('tested')], []).label).toBe('In progress');
  });

  it('is verified when a live certificate and certify event exist', () => {
    const status = deriveVerificationStatus([event('certified')], [cert()]);
    expect(status.label).toBe('Verified vegan');
    expect(status.tone).toBe('verified');
  });

  it('treats expired certificates as inactive', () => {
    const expired = cert({ expiresAt: '2020-01-01T00:00:00.000Z' });
    expect(isCertificateActive(expired, Date.parse('2026-01-01'))).toBe(false);
  });
});
