import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProfileView } from './ProfileView';

vi.mock('@/features/shell', () => ({
  useAppDrawer: () => ({ openDrawer: vi.fn() }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useProfile: (accountId: string | null | undefined) => {
    if (accountId === 'vegcert.near') {
      return {
        profile: { accountId, name: 'VegCert International', kind: 'org' },
        displayName: 'VegCert International',
        profileImageUrl: null,
        loading: false,
        refetch: vi.fn(),
        kind: 'org',
      };
    }
    return {
      profile: {
        accountId: 'green-valley.near',
        name: 'Green Valley Farms',
        kind: 'org',
        industry: 'Agriculture',
        bio: 'Family farm in Kalmar. We grow oats and log every lot from field to carton.',
        location: 'Kalmar County, Sweden',
      },
      displayName: 'Green Valley Farms',
      profileImageUrl: null,
      loading: false,
      refetch: vi.fn(),
      kind: 'org',
    };
  },
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
        {
          id: 'cert-vegcert-green-valley-org-2025',
          subjectType: 'org',
          subjectId: 'green-valley.near',
          standard: 'VegCert Facility Standard 2025',
          issuerAccountId: 'vegcert.near',
          issuedAt: '2025-03-01T08:00:00.000Z',
          expiresAt: '2026-03-01T08:00:00.000Z',
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
    expect(screen.getByText('Agriculture')).toBeInTheDocument();
    expect(screen.getByText('Kalmar County, Sweden')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Stand with' })).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('stand with them')).toBeInTheDocument();
    expect(screen.getByText('On the VF shelf')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Company review' })).toBeInTheDocument();
    expect(screen.getByText('VegCert Facility Standard 2026')).toBeInTheDocument();
    expect(screen.getByText('Until 1 Mar 2027')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'VegCert International' })).toHaveAttribute(
      'href',
      '/profile/vegcert.near'
    );
    expect(screen.getByText('Earlier reviews')).toBeInTheDocument();
    expect(screen.getByText('VegCert Facility Standard 2025')).toBeInTheDocument();
    expect(
      screen.getByText('About this producer — not every product. A company review does not certify every SKU.')
    ).toBeInTheDocument();

    expect(screen.queryByText('Activity')).not.toBeInTheDocument();
    expect(screen.queryByText('DAO Votes')).not.toBeInTheDocument();
    expect(screen.queryByText('About')).not.toBeInTheDocument();
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
