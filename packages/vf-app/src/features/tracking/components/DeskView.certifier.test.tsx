import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { cloneFixtures } from '../api/fixtures';
import { DeskView } from './DeskView';

const fixtures = cloneFixtures();
const openDrawer = vi.fn();
const reload = vi.fn();

vi.mock('@/features/shell', () => ({
  useAppDrawer: () => ({ openDrawer }),
}));

vi.mock('../hooks/use-studio-actor', () => ({
  useStudioActor: () => ({
    accountId: 'vegcert.near',
    org: fixtures.orgs.find((org) => org.accountId === 'vegcert.near'),
    role: 'certifier',
    allowed: true,
    pending: false,
    usingDemoProducer: false,
    reason: null,
  }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useProfile: (accountId: string | null | undefined) => ({
    profile:
      accountId === 'vegcert.near'
        ? { accountId, name: 'VegCert International', kind: 'org' }
        : accountId === 'green-valley.near'
          ? { accountId, name: 'Green Valley Farms', kind: 'org' }
          : accountId
            ? { accountId, kind: 'org' }
            : null,
    displayName:
      accountId === 'vegcert.near'
        ? 'VegCert International'
        : accountId === 'green-valley.near'
          ? 'Green Valley Farms'
          : (accountId ?? ''),
    profileImageUrl: null,
    loading: false,
    kind: 'org',
  }),
}));

vi.mock('../hooks/use-tracker', () => ({
  useProductsForAccount: () => ({ data: [], loading: false, reload }),
  useLotsForAccount: () => ({ data: [], loading: false, reload }),
  useEventsForAccount: () => ({ data: [], loading: false, reload }),
  useCertificatesForAccount: () => ({ data: fixtures.certificates, loading: false, reload }),
  useTrackerStatus: () => ({ data: { backend: 'local', note: 'Local fixtures' } }),
}));

describe('Certifier desk reviews', () => {
  it('groups company reviews by the review clock and opens revoke', async () => {
    const user = userEvent.setup();
    render(<DeskView />);

    expect(screen.getByRole('heading', { name: 'Certifier desk' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Company reviews' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Active' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Lapsed' })).toBeInTheDocument();
    expect(screen.getByText('VegCert Facility Standard 2026')).toBeInTheDocument();
    expect(screen.getByText('VegCert Facility Standard 2025')).toBeInTheDocument();
    expect(screen.getByText('Until 1 Mar 2027')).toBeInTheDocument();
    expect(screen.getByText('Review lapsed 1 Mar 2026')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'VegCert International' }).length).toBeGreaterThan(0);
    expect(screen.getAllByRole('link', { name: 'Green Valley Farms' }).length).toBeGreaterThan(0);
    expect(screen.getByRole('heading', { name: 'Lot stamps' })).toBeInTheDocument();
    expect(screen.queryByText('No certificates issued from this wallet yet.')).not.toBeInTheDocument();

    const revokeButtons = screen.getAllByRole('button', { name: 'Revoke' });
    await user.click(revokeButtons[0]);
    expect(openDrawer).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'revoke-certificate',
        certificateId: expect.any(String) as string,
        standard: expect.any(String) as string,
      })
    );
  });
});
