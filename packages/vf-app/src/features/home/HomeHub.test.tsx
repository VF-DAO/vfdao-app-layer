import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeHub } from './HomeHub';

const openDrawer = vi.fn();
const org = { current: null as { accountId: string; role: string } | null };
const outgoing = { current: [] as string[] };
const scans = {
  current: [] as { id: string; code: string }[],
};
const listings = {
  current: [{ orgAccountId: 'green-valley.near', listedAt: '2026-03-01T08:00:00.000Z' }],
};

vi.mock('@/features/shell', () => ({
  useAppDrawer: () => ({ openDrawer, closeDrawer: vi.fn() }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useProfile: (accountId: string | null | undefined) => {
    if (accountId === 'alice.near') {
      return {
        profile: { accountId, name: 'Alice', bio: 'I scan lots and stand with farms.' },
        displayName: 'Alice',
        description: 'I scan lots and stand with farms.',
        loading: false,
        kind: 'person',
      };
    }
    if (accountId) {
      return {
        profile: { accountId, name: 'Green Valley Farms', bio: 'Family farm in Kalmar.' },
        displayName: 'Green Valley Farms',
        description: 'Family farm in Kalmar.',
        loading: false,
        kind: 'org',
      };
    }
    return { profile: null, displayName: '', description: null, loading: false, kind: 'person' };
  },
  useMultipleProfiles: () => ({
    getDisplayName: (id: string) =>
      id === 'vegcert.near' ? 'VegCert International' : 'Green Valley Farms',
    getProfileImageUrl: () => null,
    loading: false,
  }),
}));

vi.mock('@/hooks/use-standing', () => ({
  useStandingOutgoing: () => ({ accounts: outgoing.current, count: outgoing.current.length, isLoading: false }),
  useStanding: () => ({
    incoming: 2,
    outgoing: outgoing.current.length,
    viewerStandsWith: false,
    isLoading: false,
  }),
}));

vi.mock('@/features/tracking', () => ({
  useOrgRole: () => ({ data: org.current, loading: false }),
  useVfListed: () => ({ data: Boolean(org.current), loading: false }),
  useVfShelf: () => ({ data: listings.current, loading: false }),
  useScanHistory: () => ({ data: scans.current, loading: false }),
}));

describe('HomeHub', () => {
  it('signed out: scan and listed faces, not studio or other farms’ lots', async () => {
    const user = userEvent.setup();
    org.current = null;
    outgoing.current = [];
    scans.current = [];
    render(<HomeHub />);

    await user.click(screen.getByRole('button', { name: /scan a product/i }));
    expect(openDrawer).toHaveBeenCalledWith({ id: 'scan' });

    expect(screen.getByRole('heading', { name: 'On the VF shelf' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Explore' })).toHaveAttribute('href', '/explore');
    expect(screen.getByRole('link', { name: /green valley farms/i })).toHaveAttribute(
      'href',
      '/profile/green-valley.near'
    );
    expect(screen.queryByRole('link', { name: /studio/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Verified products')).not.toBeInTheDocument();
    expect(screen.queryByText('Barista Oat Drink')).not.toBeInTheDocument();
    expect(screen.queryByText('Oat Drink')).not.toBeInTheDocument();
  });

  it('signed-in person: face, standing, trail — no studio door', () => {
    org.current = null;
    outgoing.current = ['vegcert.near'];
    scans.current = [{ id: 'scan-1', code: 'vf:lot:lot-oatmilk-nordic-2403' }];
    render(<HomeHub accountId="alice.near" />);

    expect(screen.getByRole('heading', { name: 'Alice' })).toBeInTheDocument();
    expect(screen.getByText('I scan lots and stand with farms.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Who you stand with' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /vegcert international/i })).toHaveAttribute(
      'href',
      '/profile/vegcert.near'
    );
    expect(screen.getByRole('heading', { name: 'Your trail' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all' })).toHaveAttribute('href', '/trail');
    expect(screen.getByRole('link', { name: 'vf:lot:lot-oatmilk-nordic-2403' })).toHaveAttribute(
      'href',
      '/scan/vf%3Alot%3Alot-oatmilk-nordic-2403'
    );
    expect(screen.queryByRole('link', { name: /studio/i })).not.toBeInTheDocument();
    expect(screen.queryByText('Verified products')).not.toBeInTheDocument();
  });

  it('signed-in writer: one Studio door, still no inventory grid', () => {
    org.current = { accountId: 'green-valley.near', role: 'producer' };
    outgoing.current = [];
    scans.current = [];
    render(<HomeHub accountId="green-valley.near" />);

    expect(screen.getByRole('link', { name: /studio/i })).toHaveAttribute('href', '/studio');
    expect(screen.getByText(/^On the VF shelf$/)).toBeInTheDocument();
    expect(screen.queryByText('Barista Oat Drink')).not.toBeInTheDocument();
    expect(screen.queryByText('All products')).not.toBeInTheDocument();
  });
});
