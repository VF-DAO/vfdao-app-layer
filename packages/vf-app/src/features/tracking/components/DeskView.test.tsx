import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { FIXTURE_LOT_ID, FIXTURE_PRODUCT_ID, cloneFixtures } from '../api/fixtures';
import { DeskView } from './DeskView';

const fixtures = cloneFixtures();
const openDrawer = vi.fn();

vi.mock('@/features/shell', () => ({
  useAppDrawer: () => ({ openDrawer }),
}));

vi.mock('../hooks/use-studio-actor', () => ({
  useStudioActor: () => ({
    accountId: 'green-valley.near',
    org: fixtures.orgs[0],
    role: 'producer',
    allowed: true,
    pending: false,
    usingDemoProducer: true,
    reason: null,
  }),
}));

vi.mock('../hooks/use-tracker', () => ({
  useProductsForAccount: () => ({ data: fixtures.products, loading: false }),
  useLotsForAccount: () => ({ data: fixtures.lots, loading: false }),
  useEventsForAccount: () => ({
    data: fixtures.events.filter((event) => event.orgAccountId === 'green-valley.near'),
    loading: false,
  }),
  useCertificatesForAccount: () => ({ data: [], loading: false }),
  useTrackerStatus: () => ({ data: { backend: 'local', note: 'Local fixtures' } }),
}));

describe('DeskView', () => {
  it('lists the producer lots and opens the existing scan compose', () => {
    render(<DeskView />);
    expect(screen.getByRole('heading', { name: 'Producer desk' })).toBeInTheDocument();
    expect(screen.getByText(fixtures.products[0].name)).toBeInTheDocument();
    const lotLink = screen.getByRole('link', { name: new RegExp(fixtures.lots[0].label) });
    expect(lotLink).toHaveAttribute('href', `/scan/${encodeURIComponent(`vf:lot:${FIXTURE_LOT_ID}`)}`);
    expect(screen.getByRole('link', { name: /nordic plant/i })).toHaveAttribute(
      'href',
      `/products/${FIXTURE_PRODUCT_ID}`
    );
  });
});
