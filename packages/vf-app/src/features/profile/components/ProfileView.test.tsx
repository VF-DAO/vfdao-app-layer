import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileView } from './ProfileView';

vi.mock('@/features/shell', () => ({
  useAppDrawer: () => ({ openDrawer: vi.fn() }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({
    profile: {
      accountId: 'green-valley.near',
      name: 'Green Valley Farms',
      kind: 'org',
      industry: 'Agriculture',
      bio: 'Family farm in Kalmar. We grow oats and log every lot from field to carton.',
      lead: 'Oats from Kalmar. Logged, not claimed.',
      about:
        'We grow oats in Kalmar County and log every lot from field to carton. A café scan shows the farm, the mill, and the vegan stamp — not a brand story.',
      location: 'Kalmar County, Sweden',
    },
    loading: false,
    refetch: vi.fn(),
    kind: 'org',
  }),
}));

vi.mock('@/hooks/use-standing', () => ({
  useStanding: () => ({
    incoming: 2,
    outgoing: 1,
    viewerStandsWith: false,
    isLoading: false,
    isToggling: false,
    canInteract: true,
    toggle: vi.fn(),
  }),
}));

vi.mock('@/features/tracking', async () => {
  const actual = await vi.importActual<typeof import('@/features/tracking')>('@/features/tracking');
  return {
    ...actual,
    useOrgRole: () => ({ data: { accountId: 'green-valley.near', role: 'producer' }, loading: false }),
    useVfListed: () => ({ data: true, loading: false }),
    useScanHistory: () => ({ data: [], loading: false }),
    useCertificates: () => ({
      data: [
        {
          id: 'cert-vegcert-green-valley-org',
          subjectType: 'org',
          subjectId: 'green-valley.near',
          standard: 'VegCert Facility Standard 2026',
          issuerAccountId: 'vegcert.near',
          issuedAt: '2026-03-01T08:00:00.000Z',
          expiresAt: '2027-03-01T08:00:00.000Z',
          status: 'active',
        },
      ],
      loading: false,
    }),
  };
});

describe('ProfileView', () => {
  it('shows the OnSocial face, standing, and VF shelf — not activity or inventory', () => {
    render(<ProfileView accountId="green-valley.near" />);

    expect(screen.getByRole('heading', { name: 'Green Valley Farms' })).toBeInTheDocument();
    expect(
      screen.getByText('Family farm in Kalmar. We grow oats and log every lot from field to carton.')
    ).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'About' })).toBeInTheDocument();
    expect(screen.getByText('Oats from Kalmar. Logged, not claimed.')).toBeInTheDocument();
    expect(
      screen.getByText(
        'We grow oats in Kalmar County and log every lot from field to carton. A café scan shows the farm, the mill, and the vegan stamp — not a brand story.'
      )
    ).toBeInTheDocument();
    expect(screen.getByText('Agriculture')).toBeInTheDocument();
    expect(screen.getByText('Kalmar County, Sweden')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stand with' })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('stand with them')).toBeInTheDocument();
    expect(screen.getByText('On the VF shelf')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Company review' })).toBeInTheDocument();
    expect(screen.getByText('VegCert Facility Standard 2026')).toBeInTheDocument();
    expect(screen.getByText(/Until /)).toBeInTheDocument();
    expect(
      screen.getByText('About this producer — not every product. A company review does not certify every SKU.')
    ).toBeInTheDocument();

    expect(screen.queryByText('Activity')).not.toBeInTheDocument();
    expect(screen.queryByText('DAO Votes')).not.toBeInTheDocument();
    expect(screen.queryByText('Barista Oat Drink')).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Studio' })).not.toBeInTheDocument();
  });

  it('opens Studio on your own writer profile, without a Stand with button', () => {
    render(<ProfileView accountId="green-valley.near" isOwnProfile />);

    expect(screen.queryByRole('button', { name: 'Stand with' })).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Studio' })).toHaveAttribute('href', '/studio');
    expect(screen.getByText('stand with you')).toBeInTheDocument();
  });
});
