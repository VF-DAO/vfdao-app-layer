'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Copy, Edit3, Github, Globe, MapPin, Send, Share2 } from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { Button } from '@/components/ui/button';
import { Divider } from '@/components/ui/divider';
import { FloatingHeader } from '@/components/ui/floating-header';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { StandingCount, StandWithButton } from '@/components/ui/stand-with-button';
import {
  profileAvatarShapeForAccount,
  profileKindFaceLabel,
  profileOrgLineLabel,
} from '@/features/onsocial/profile';
import { getBannerUrl } from '@/features/onsocial/profile-service';
import { useAppDrawer } from '@/features/shell';
import { CertificateBadge } from '@/features/tracking/components/CertificateBadge';
import { splitOrgReviews, useCertificates, useOrgRole, useScanHistory, useVfListed } from '@/features/tracking';
import { useProfile } from '@/hooks/use-profile';

interface ProfileViewProps {
  accountId: string;
  isOwnProfile?: boolean;
}

function truncateAddress(address: string) {
  if (address.length <= 20) return address;
  return `${address.slice(0, 8)}...${address.slice(-6)}`;
}

function profileLinks(links: Record<string, string> | undefined) {
  const website = links?.website;
  return [
    links?.twitter && {
      icon: FaXTwitter,
      href: `https://x.com/${links.twitter}`,
      label: links.twitter,
    },
    links?.github && {
      icon: Github,
      href: `https://github.com/${links.github}`,
      label: links.github,
    },
    links?.telegram && {
      icon: Send,
      href: `https://t.me/${links.telegram}`,
      label: links.telegram,
    },
    website && {
      icon: Globe,
      href: website.startsWith('http') ? website : `https://${website}`,
      label: new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace(
        'www.',
        ''
      ),
    },
  ].filter(Boolean) as {
    icon: React.ComponentType<{ className?: string; size?: number }>;
    href: string;
    label: string;
  }[];
}

export function ProfileView({ accountId, isOwnProfile = false }: ProfileViewProps) {
  const { profile, loading, refetch, kind } = useProfile(accountId);
  const org = useOrgRole(accountId);
  const listed = useVfListed(accountId);
  const scans = useScanHistory(accountId);
  const certificates = useCertificates(accountId);
  const [copied, setCopied] = useState(false);
  const { openDrawer } = useAppDrawer();
  const faceShape = profileAvatarShapeForAccount(kind, accountId);
  const faceRadius =
    faceShape === 'squircle' ? 'rounded-[28%]' : faceShape === 'square' ? 'rounded-[18%]' : 'rounded-full';
  const displayName = profile?.name ?? truncateAddress(accountId);
  const orgLine = kind === 'org' ? profileOrgLineLabel(profile?.industry) : profileKindFaceLabel(kind);
  const socialLinksList = profileLinks(profile?.links);
  const tags = profile?.tags?.slice(0, 6) ?? [];
  const bannerUrl = getBannerUrl(profile);
  const recentScans = isOwnProfile ? (scans.data?.slice(0, 3) ?? []) : [];
  const { current: currentReview, earlier: earlierReviews } = splitOrgReviews(
    certificates.data ?? [],
    accountId
  );
  const showStudio = isOwnProfile && Boolean(org.data);
  const showShelf = Boolean(listed.data);
  const showTrail = recentScans.length > 0;
  const showReview = Boolean(currentReview);
  const showVfMarks = showShelf || showStudio || showTrail || showReview;

  const handleCopyAddress = () => {
    void navigator.clipboard.writeText(accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${encodeURIComponent(accountId)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: displayName, url });
      } catch {
        void navigator.clipboard.writeText(url);
      }
    } else {
      void navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <div className="h-40 md:h-56 bg-muted/30 animate-pulse" />
        <div className="max-w-2xl mx-auto px-6 -mt-16">
          <div className={`w-28 h-28 md:w-32 md:h-32 ${faceRadius} bg-muted border-4 border-background animate-pulse`} />
          <div className="mt-6 space-y-3">
            <div className="h-9 w-56 bg-muted rounded-lg animate-pulse" />
            <div className="h-4 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full max-w-md bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      <FloatingHeader
        accountId={accountId}
        displayName={profile?.name}
        showCollapsedProfile={true}
        fadeActions={false}
        actions={
          <>
            {isOwnProfile && (
              <Button
                variant="floating"
                size="sm"
                className="gap-2"
                onClick={() => openDrawer({ id: 'edit-profile', onSuccess: () => refetch() })}
              >
                <Edit3 className="w-4 h-4" />
                <span className="hidden sm:inline">Edit</span>
              </Button>
            )}
            <Button
              variant="floating"
              size="icon"
              onClick={() => {
                void handleShare();
              }}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </>
        }
      />

      <div className="relative h-40 md:h-56 overflow-hidden">
        {bannerUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- remote OnSocial / IPFS banners
          <img src={bannerUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-muted/30 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted-foreground)/0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
        )}
      </div>

      <div className="max-w-2xl mx-auto px-6">
        <div className="-mt-16 md:-mt-20 mb-6 relative z-10">
          <ProfileAvatar
            accountId={accountId}
            size="xl"
            className={`w-28 h-28 md:w-32 md:h-32 ${faceRadius} shadow-xl ring-4 ring-background`}
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">{displayName}</h1>

          <button
            type="button"
            onClick={handleCopyAddress}
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <span className="text-sm font-mono border border-border bg-muted/30 px-3 py-1.5 rounded-full">
              {truncateAddress(accountId)}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-verified" />
            ) : (
              <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          {orgLine && <p className="text-sm text-muted-foreground">{orgLine}</p>}

          {profile?.bio && (
            <p className="text-base md:text-lg text-foreground/85 leading-relaxed max-w-xl whitespace-pre-wrap">
              {profile.bio}
            </p>
          )}

          {(profile?.location || socialLinksList.length > 0) && (
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {profile?.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  {profile.location}
                </span>
              )}
              {socialLinksList.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                >
                  <link.icon className="w-4 h-4" />
                  <span className="underline-offset-4 hover:underline">{link.label}</span>
                </a>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1 text-xs font-medium border border-verified/30 bg-verified/10 text-primary rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-1">
            {!isOwnProfile && <StandWithButton targetAccountId={accountId} showCount={false} size="md" />}
            <StandingCount targetAccountId={accountId} subject={isOwnProfile ? 'you' : 'them'} />
          </div>
        </div>

        {showVfMarks && (
          <>
            <div className="py-8">
              <Divider />
            </div>

            <div className="space-y-5">
              {showReview && currentReview && (
                <section className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Company review
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    About this producer — not every product. A company review does not certify every SKU.
                  </p>
                  <CertificateBadge certificate={currentReview} />
                  {earlierReviews.length > 0 && (
                    <details className="group">
                      <summary className="cursor-pointer text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                        Earlier reviews
                      </summary>
                      <div className="mt-3 space-y-3">
                        {earlierReviews.map((certificate) => (
                          <CertificateBadge key={certificate.id} certificate={certificate} />
                        ))}
                      </div>
                    </details>
                  )}
                </section>
              )}

              {(showShelf || showStudio) && (
                <div className="flex flex-wrap items-center gap-3">
                  {showShelf && (
                    <span className="px-3 py-1 text-xs font-medium border border-verified/30 bg-verified/10 text-primary rounded-full">
                      On the VF shelf
                    </span>
                  )}
                  {showStudio && (
                    <Link
                      href="/studio"
                      className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline underline-offset-4"
                    >
                      Studio
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              )}

              {showTrail && (
                <section className="space-y-3">
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Your trail
                  </h2>
                  <ul className="space-y-2">
                    {recentScans.map((scan) => (
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
            </div>
          </>
        )}
      </div>
    </div>
  );
}
