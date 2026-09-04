'use client';

import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, ScanLine, Warehouse } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { StandingCount } from '@/components/ui/stand-with-button';
import { useAppDrawer } from '@/features/shell';
import { useOrgRole, useScanHistory, useVfListed, useVfShelf } from '@/features/tracking';
import { useMultipleProfiles, useProfile } from '@/hooks/use-profile';
import { useStandingOutgoing } from '@/hooks/use-standing';

function ActionCard({
  title,
  description,
  icon,
  onClick,
}: {
  title: string;
  description: string;
  icon: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/30"
    >
      <div className="mt-0.5 text-primary">{icon}</div>
      <div>
        <p className="font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </button>
  );
}

function AccountRow({
  accountId,
  name,
  imageUrl,
}: {
  accountId: string;
  name: string;
  imageUrl?: string | null;
}) {
  return (
    <Link
      href={`/profile/${encodeURIComponent(accountId)}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
    >
      <span className="flex min-w-0 items-center gap-3">
        <ProfileAvatar
          accountId={accountId}
          size="md"
          {...(imageUrl ? { profileImageUrl: imageUrl } : {})}
        />
        <span className="truncate font-medium text-foreground">{name}</span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}

function bioLine(bio: string | null | undefined): string | null {
  const text = bio?.trim();
  if (!text) return null;
  const first = text.split('\n').find((line) => line.trim())?.trim() ?? text;
  return first.length > 140 ? `${first.slice(0, 137)}…` : first;
}

export function HomeHub({ accountId }: { accountId?: string | null }) {
  const signedIn = Boolean(accountId);
  const { openDrawer } = useAppDrawer();
  const profile = useProfile(accountId);
  const org = useOrgRole(accountId);
  const listed = useVfListed(accountId);
  const scans = useScanHistory(accountId ?? undefined);
  const outgoing = useStandingOutgoing(accountId ?? undefined);
  const shelf = useVfShelf();
  const standWith = outgoing.accounts.slice(0, 6);
  const teaser = signedIn ? [] : (shelf.data?.slice(0, 3) ?? []);
  const faces = useMultipleProfiles([
    ...standWith,
    ...teaser.map((item) => item.orgAccountId),
  ]);
  const recent = signedIn ? (scans.data?.slice(0, 3) ?? []) : [];
  const showStudio = signedIn && Boolean(org.data);
  const showShelfMark = signedIn && Boolean(listed.data);
  const line = bioLine(profile.description);

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 text-left">
      {signedIn && accountId && (
        <section className="flex flex-col items-center gap-3 text-center">
          <Link href={`/profile/${encodeURIComponent(accountId)}`} className="rounded-full">
            <ProfileAvatar
              accountId={accountId}
              size="xl"
              className="h-24 w-24 shadow-xl ring-4 ring-background"
            />
          </Link>
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              <Link
                href={`/profile/${encodeURIComponent(accountId)}`}
                className="text-foreground hover:text-primary"
              >
                {profile.displayName}
              </Link>
            </h1>
            {line && <p className="mx-auto max-w-xl text-base text-muted-foreground">{line}</p>}
            <div className="flex flex-wrap items-center justify-center gap-3">
              <StandingCount targetAccountId={accountId} subject="you" />
              {showShelfMark && (
                <span className="rounded-full border border-verified/30 bg-verified/10 px-3 py-1 text-xs font-medium text-primary">
                  On the VF shelf
                </span>
              )}
            </div>
          </div>
        </section>
      )}

      <div className={`grid grid-cols-1 gap-3 ${showStudio ? 'sm:grid-cols-2' : ''}`}>
        <ActionCard
          icon={<ScanLine className="h-5 w-5" />}
          title="Scan a product"
          description="Camera or lot code"
          onClick={() => openDrawer({ id: 'scan' })}
        />
        {showStudio && (
          <Link
            href="/studio"
            className="flex w-full items-start gap-3 rounded-2xl border border-border bg-card p-4 text-left transition-colors hover:border-primary/30 hover:bg-muted/30"
          >
            <div className="mt-0.5 text-primary">
              <Warehouse className="h-5 w-5" />
            </div>
            <div>
              <p className="font-semibold text-foreground">Studio</p>
              <p className="text-sm text-muted-foreground">Register, open lots, and stamp</p>
            </div>
          </Link>
        )}
      </div>

      {standWith.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">Who you stand with</h2>
          <ul className="space-y-2">
            {standWith.map((id) => (
              <li key={id}>
                <AccountRow
                  accountId={id}
                  name={faces.getDisplayName(id)}
                  imageUrl={faces.getProfileImageUrl(id)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {recent.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your trail</h2>
            <Link href="/dashboard/history" className="text-sm text-primary">
              History
            </Link>
          </div>
          <ul className="space-y-2">
            {recent.map((scan) => (
              <li key={scan.id}>
                <Link
                  href={`/scan/${encodeURIComponent(scan.code)}`}
                  className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
                >
                  <span className="font-mono text-sm text-foreground">{scan.code}</span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {teaser.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground">On the VF shelf</h2>
          <ul className="space-y-2">
            {teaser.map((item) => (
              <li key={item.orgAccountId}>
                <AccountRow
                  accountId={item.orgAccountId}
                  name={faces.getDisplayName(item.orgAccountId)}
                  imageUrl={faces.getProfileImageUrl(item.orgAccountId)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
