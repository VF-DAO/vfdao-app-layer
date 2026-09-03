import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cloneFixtures, FIXTURE_LOT_ID, FIXTURE_PRODUCT_BAR_ID } from '../api/fixtures';
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
  it('keeps lots under products, one compose, and writes on the row', async () => {
    const user = userEvent.setup();
    render(<DeskView />);
    expect(screen.getByRole('heading', { name: 'Producer desk' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Register product' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Record event' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Stamps' })).not.toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Recent lots' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: /Spring harvest 2026/ })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Barista Oat Drink/, expanded: false }));
    const lotLink = screen.getByRole('link', { name: /Spring harvest 2026/ });
    expect(lotLink).toHaveAttribute('href', `/scan/${encodeURIComponent(`vf:lot:${FIXTURE_LOT_ID}`)}`);
    expect(screen.queryByRole('link', { name: /scan/i })).not.toBeInTheDocument();

    await user.type(screen.getByLabelText('Search products and lots'), 'cream');
    expect(screen.getByText('Oat Cooking Cream')).toBeInTheDocument();
    expect(screen.queryByText('Barista Oat Drink')).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Winter cook 2026/ })).toBeInTheDocument();

    await user.clear(screen.getByLabelText('Search products and lots'));
    await user.click(screen.getByRole('button', { name: 'Open lot for Kalmar Oat Bar' }));
    expect(openDrawer).toHaveBeenCalledWith({ id: 'create-lot', productId: FIXTURE_PRODUCT_BAR_ID });
  });
});
