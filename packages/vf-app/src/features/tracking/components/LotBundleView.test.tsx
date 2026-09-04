import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FIXTURE_LOT_ID, FIXTURE_PRODUCT_ID } from '../api/fixtures';
import type { LotBundle } from '../types';
import { LotBundleView } from './LotBundleView';

vi.mock('./LotQrCard', () => ({
  LotQrCard: () => <div>QR card</div>,
}));

vi.mock('@/components/ui/stand-with-button', () => ({
  StandWithButton: ({ targetAccountId }: { targetAccountId: string }) => (
    <button type="button">Stand with {targetAccountId}</button>
  ),
}));

vi.mock('./SproutButton', () => ({
  SproutButton: () => <button type="button">Sprout</button>,
}));

vi.mock('./LotNotes', () => ({
  LotNotes: () => (
    <section>
      <h3>Notes on this lot</h3>
    </section>
  ),
}));

const listedBundle: LotBundle = {
  lot: {
    id: FIXTURE_LOT_ID,
    productId: FIXTURE_PRODUCT_ID,
    label: 'Spring harvest',
    harvestedAt: '2026-03-12',
    quantity: '12 000',
    site: 'Kalmar',
    producerAccountId: 'green-valley.near',
    createdAt: '2026-03-12T10:00:00.000Z',
  },
  product: {
    id: FIXTURE_PRODUCT_ID,
    name: 'Barista Oat Drink',
    brand: 'Nordic Plant',
    description: 'Oat drink',
    ingredients: ['Oats'],
    claims: ['Vegan'],
    producerAccountId: 'green-valley.near',
    createdAt: '2026-03-01T08:00:00.000Z',
  },
  events: [
    {
      id: 'evt-1',
      lotId: FIXTURE_LOT_ID,
      kind: 'tested',
      at: '2026-03-14T09:00:00.000Z',
      note: 'Mill lab',
      orgAccountId: 'nordic-mill.near',
    },
    {
      id: 'evt-2',
      lotId: FIXTURE_LOT_ID,
      kind: 'tested',
      at: '2026-03-14T15:30:00.000Z',
      note: 'Independent lab',
      orgAccountId: 'plant-lab.near',
    },
  ],
  certificates: [
    {
      id: 'cert-1',
      subjectType: 'lot',
      subjectId: FIXTURE_LOT_ID,
      standard: 'VegCert Vegan Standard 2026',
      issuerAccountId: 'vegcert.near',
      issuedAt: '2026-03-15T16:20:00.000Z',
      status: 'active',
    },
  ],
  orgCertificates: [
    {
      id: 'cert-org-1',
      subjectType: 'org',
      subjectId: 'green-valley.near',
      standard: 'VegCert Facility Standard 2026',
      issuerAccountId: 'vegcert.near',
      issuedAt: '2026-03-01T08:00:00.000Z',
      expiresAt: '2027-03-01T08:00:00.000Z',
      status: 'active',
    },
  ],
  producer: {
    accountId: 'green-valley.near',
    name: 'Green Valley Farms',
    role: 'producer',
    status: 'active',
  },
  vfListed: true,
};

describe('LotBundleView', () => {
  it('shows every stamp with its writer and a VF shelf badge when listed', () => {
    render(<LotBundleView bundle={listedBundle} />);

    expect(screen.getByText('On the VF shelf')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Green Valley Farms' })).toHaveAttribute(
      'href',
      '/profile/green-valley.near'
    );
    expect(screen.getByRole('button', { name: 'Stand with green-valley.near' })).toBeInTheDocument();
    const vegcertLinks = screen.getAllByRole('link', { name: 'vegcert.near' });
    expect(vegcertLinks).toHaveLength(2);
    expect(vegcertLinks.every((link) => link.getAttribute('href') === '/profile/vegcert.near')).toBe(true);
    expect(screen.getByRole('link', { name: 'nordic-mill.near' })).toHaveAttribute(
      'href',
      '/profile/nordic-mill.near'
    );
    expect(screen.getByRole('link', { name: 'plant-lab.near' })).toHaveAttribute(
      'href',
      '/profile/plant-lab.near'
    );
    expect(screen.getByRole('heading', { name: 'Company review' })).toBeInTheDocument();
    expect(screen.getByText('VegCert Facility Standard 2026')).toBeInTheDocument();
    expect(
      screen.getByText('About the producer — not this lot. A company review does not certify every SKU.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lot certificates' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Sprout' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Notes on this lot' })).toBeInTheDocument();
    expect(screen.getByText('VegCert Vegan Standard 2026')).toBeInTheDocument();
    expect(screen.queryByText('Not recorded yet')).not.toBeInTheDocument();
    expect(screen.queryByText('Verified vegan')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'All lots for this product' })).not.toBeInTheDocument();
  });

  it('still resolves an unlisted lot without a shelf badge', () => {
    render(
      <LotBundleView
        bundle={{
          ...listedBundle,
          vfListed: false,
          certificates: [],
          orgCertificates: [],
          events: [],
          lot: { ...listedBundle.lot, producerAccountId: 'cashew.near' },
        }}
      />
    );

    expect(screen.queryByText('On the VF shelf')).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Company review' })).not.toBeInTheDocument();
    expect(screen.getByText('Spring harvest')).toBeInTheDocument();
    expect(screen.getByText('No stamps on this lot yet.')).toBeInTheDocument();
  });
});
