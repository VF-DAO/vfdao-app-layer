import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ExploreShelf } from './ExploreShelf';

vi.mock('@/features/tracking', async () => {
  const listing = await import('@/features/tracking/lib/listing');
  return {
    useVfShelf: () => ({
      data: [{ orgAccountId: 'green-valley.near', listedAt: '2026-03-01T08:00:00.000Z' }],
      loading: false,
    }),
    vfShelfCountLabel: listing.vfShelfCountLabel,
  };
});

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profileImageUrl: null,
    loading: false,
    kind: 'org',
  }),
  useMultipleProfiles: () => ({
    profiles: {
      'green-valley.near': { accountId: 'green-valley.near', name: 'Green Valley Farms', kind: 'org', industry: 'Agriculture' },
    },
    getDisplayName: () => 'Green Valley Farms',
    getProfileImageUrl: () => null,
    loading: false,
  }),
}));

describe('ExploreShelf', () => {
  it('lists listed org faces, not a product catalogue', () => {
    render(<ExploreShelf />);

    expect(screen.getByRole('heading', { name: 'On the VF shelf' })).toBeInTheDocument();
    expect(screen.getByText('1 on the VF shelf')).toBeInTheDocument();
    expect(screen.getByText('VF promo. Unlisted lots still scan.')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /green valley farms/i })).toHaveAttribute(
      'href',
      '/profile/green-valley.near'
    );
    expect(screen.getByText('Agriculture')).toBeInTheDocument();
    expect(screen.queryByText('Verified Products')).not.toBeInTheDocument();
    expect(screen.queryByText('Businesses')).not.toBeInTheDocument();
    expect(screen.queryByText('Barista Oat Drink')).not.toBeInTheDocument();
    expect(screen.queryByText('Coming Soon')).not.toBeInTheDocument();
  });
});
