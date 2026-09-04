import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { Certificate } from '../types';
import { CertificateBadge } from './CertificateBadge';

const cert = (overrides: Partial<Certificate> = {}): Certificate => ({
  id: 'cert-org',
  subjectType: 'org',
  subjectId: 'green-valley.near',
  standard: 'VegCert Facility Standard 2026',
  issuerAccountId: 'vegcert.near',
  issuedAt: '2026-03-01T08:00:00.000Z',
  expiresAt: '2027-03-01T08:00:00.000Z',
  status: 'active',
  ...overrides,
});

describe('CertificateBadge', () => {
  it('shows an active company review without a vegan-on-pack mark', () => {
    render(<CertificateBadge certificate={cert()} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText(/Until /)).toBeInTheDocument();
    expect(screen.queryByText('Verified vegan')).not.toBeInTheDocument();
  });

  it('shows a lapsed review as context, not a live stamp', () => {
    render(
      <CertificateBadge
        certificate={cert({
          expiresAt: '2026-03-01T08:00:00.000Z',
        })}
      />
    );
    expect(screen.getByText('Lapsed')).toBeInTheDocument();
    expect(screen.getByText(/Review lapsed /)).toBeInTheDocument();
    expect(screen.queryByText('Active')).not.toBeInTheDocument();
  });

  it('shows a revoke reason and an evidence link', () => {
    render(
      <CertificateBadge
        certificate={cert({
          status: 'revoked',
          revokeReason: 'Site closed',
          evidenceCid: 'bafytestevidencecid0000000000000000000000000000',
        })}
      />
    );
    expect(screen.getByText('Revoked')).toBeInTheDocument();
    expect(screen.getByText('Revoked — Site closed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Evidence' })).toHaveAttribute(
      'href',
      'https://cdn.onsocial.id/ipfs/bafytestevidencecid0000000000000000000000000000'
    );
  });
});
