import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FIXTURE_LOT_ID, FIXTURE_PRODUCT_ID } from '../api/fixtures';
import type { LotBundle } from '../types';
import { LotBundleView } from './LotBundleView';

vi.mock('./LotQrCard', () => ({
  LotQrCard: () => <div>QR card</div>,
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
    expect(screen.getByText('Stamped by vegcert.near')).toBeInTheDocument();
    expect(screen.getByText(/stamped by nordic-mill.near/i)).toBeInTheDocument();
    expect(screen.getByText(/stamped by plant-lab.near/i)).toBeInTheDocument();
    expect(screen.queryByText('Not recorded yet')).not.toBeInTheDocument();
    expect(screen.queryByText('Verified vegan')).not.toBeInTheDocument();
  });

  it('still resolves an unlisted lot without a shelf badge', () => {
    render(
      <LotBundleView
        bundle={{
          ...listedBundle,
          vfListed: false,
          certificates: [],
          events: [],
          lot: { ...listedBundle.lot, producerAccountId: 'cashew.near' },
        }}
      />
    );

    expect(screen.queryByText('On the VF shelf')).not.toBeInTheDocument();
    expect(screen.getByText('Spring harvest')).toBeInTheDocument();
    expect(screen.getByText('No stamps on this lot yet.')).toBeInTheDocument();
  });
});
