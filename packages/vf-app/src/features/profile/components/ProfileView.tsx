'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { useAppDrawer } from '@/features/shell';
import { FloatingHeader } from '@/components/ui/floating-header';
import { Divider } from '@/components/ui/divider';
import { WithYouButton, WithYouCount } from '@/components/ui/with-you-button';
import { 
  Copy, 
  Check, 
  MapPin, 
  Globe,
  Github,
  Send,
  Edit3,
  Share2,
} from 'lucide-react';
import { FaXTwitter } from 'react-icons/fa6';
import { useProfile } from '@/hooks/use-profile';

interface ProfileViewProps {
  accountId: string;
  isOwnProfile?: boolean;
}

export function ProfileView({ accountId, isOwnProfile = false }: ProfileViewProps) {
  const { profile: profileData, loading, refetch } = useProfile(accountId);
  const [copied, setCopied] = useState(false);
  const { openDrawer } = useAppDrawer();

  // Extract the nested profile object
  const profile = profileData?.profile;

  const handleCopyAddress = () => {
    navigator.clipboard.writeText(accountId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    const url = `${window.location.origin}/profile/${encodeURIComponent(accountId)}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: profile?.name || accountId, url });
      } catch {
        navigator.clipboard.writeText(url);
      }
    } else {
      navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  // Get social links from profile
  const socialLinks = profile?.linktree || {};
  const website = profile?.website || socialLinks.website;

  // Get banner image URL (supports both IPFS and direct URL)
  const getBannerUrl = () => {
    const bg = profile?.backgroundImage;
    if (!bg) return null;
    if (bg.ipfs_cid) return `https://ipfs.near.social/ipfs/${bg.ipfs_cid}`;
    if (bg.url) return bg.url;
    return null;
  };
  const bannerUrl = getBannerUrl();

  // Count social links for layout
  const socialLinksList = [
    socialLinks.twitter && { icon: FaXTwitter, href: `https://x.com/${socialLinks.twitter}`, label: socialLinks.twitter },
    socialLinks.github && { icon: Github, href: `https://github.com/${socialLinks.github}`, label: socialLinks.github },
    socialLinks.telegram && { icon: Send, href: `https://t.me/${socialLinks.telegram}`, label: socialLinks.telegram },
    website && { icon: Globe, href: website.startsWith('http') ? website : `https://${website}`, label: new URL(website.startsWith('http') ? website : `https://${website}`).hostname.replace('www.', '') },
  ].filter(Boolean) as { icon: React.ComponentType<{ className?: string; size?: number }>; href: string; label: string }[];

  // Get tags as array
  const tags = profile?.tags ? Object.keys(profile.tags).slice(0, 6) : [];

  if (loading) {
    return (
      <div className="min-h-screen">
        {/* Banner skeleton */}
        <div className="h-48 md:h-64 lg:h-72 bg-gradient-to-br from-primary/10 via-muted/20 to-verified/10 animate-pulse" />
        
        <div className="max-w-3xl mx-auto px-6 -mt-20">
          {/* Avatar skeleton */}
          <div className="w-28 h-28 md:w-36 md:h-36 rounded-full bg-muted border-4 border-background animate-pulse" />
          
          <div className="mt-6 space-y-4">
            <div className="h-10 w-56 bg-muted rounded-lg animate-pulse" />
            <div className="h-5 w-40 bg-muted rounded animate-pulse" />
            <div className="h-4 w-full max-w-md bg-muted rounded animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Floating Header */}
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
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
            </Button>
          </>
        }
      />

      {/* Banner - Full bleed */}
      <div className="relative h-48 md:h-64 lg:h-72 overflow-hidden">
        {bannerUrl ? (
          <img 
            src={bannerUrl} 
            alt="" 
            className="w-full h-full object-cover"
          />
        ) : (
          /* Subtle fallback with dot pattern */
          <div className="w-full h-full bg-muted/30 relative">
            <div className="absolute inset-0 bg-[radial-gradient(circle,hsl(var(--muted-foreground)/0.08)_1px,transparent_1px)] bg-[size:24px_24px]" />
          </div>
        )}
      </div>

      {/* Profile Content */}
      <div className="max-w-3xl mx-auto px-6">
        {/* Avatar - Overlapping banner */}
        <div className="-mt-20 md:-mt-24 mb-6 relative z-10">
          <div className="relative inline-block">
            <ProfileAvatar
              accountId={accountId}
              size="xl"
              className="w-28 h-28 md:w-36 md:h-36 rounded-full shadow-xl ring-4 ring-background"
            />
          </div>
        </div>

        {/* Name & Identity */}
        <div className="space-y-4">
          {/* Display Name */}
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight">
            {profile?.name || truncateAddress(accountId)}
          </h1>

          {/* Account ID - Clickable */}
          <button 
            onClick={handleCopyAddress}
            className="group flex items-center gap-2 text-muted-foreground hover:text-foreground transition-all"
          >
            <span className="text-sm font-mono border border-border bg-muted/30 px-3 py-1.5 rounded-full group-hover:border-verified/50 group-hover:bg-verified/5 transition-all">
              {truncateAddress(accountId)}
            </span>
            {copied ? (
              <Check className="w-4 h-4 text-verified" />
            ) : (
              <Copy className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity" />
            )}
          </button>

          {/* Tagline */}
          {profile?.tagline && (
            <p className="text-lg text-muted-foreground max-w-xl">
              {profile.tagline}
            </p>
          )}

          {/* Meta row - Location + Links */}
          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
            {profile?.location && (
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4" />
                {profile.location}
              </span>
            )}
            
            {/* Social Links - Inline icons */}
            {socialLinksList.map((link, i) => (
              <a
                key={i}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 hover:text-foreground transition-colors group"
              >
                <link.icon className="w-4 h-4" />
                <span className="group-hover:underline underline-offset-4">{link.label}</span>
              </a>
            ))}
          </div>

          {/* Tags */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
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

          {/* I'm With You Section */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 pt-4">
            {/* Button only on other people's profiles */}
            {!isOwnProfile && (
              <WithYouButton 
                targetAccountId={accountId} 
                context={{ type: 'profile' }}
                size="md"
              />
            )}
            {/* Count shows on all profiles */}
            <WithYouCount targetAccountId={accountId} />
          </div>
        </div>

        {/* Divider */}
        <div className="py-8">
          <Divider />
        </div>

        {/* Bio Section */}
        {profile?.description && (
          <section className="mb-12">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              About
            </h2>
            <p className="text-foreground/90 leading-relaxed whitespace-pre-wrap max-w-2xl">
              {profile.description}
            </p>
          </section>
        )}

        {/* Stats Grid - Placeholder for future */}
        <section className="relative">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-6">
            Activity
          </h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: 'DAO Votes', value: '—' },
              { label: 'Proposals', value: '—' },
              { label: 'Transactions', value: '—' },
              { label: 'Reputation', value: '—' },
            ].map((stat) => (
              <div 
                key={stat.label} 
                className="text-center p-4 rounded-xl border border-border/50 bg-muted/20 hover:border-verified/30 hover:bg-verified/5 transition-all"
              >
                <div className="text-2xl md:text-3xl font-bold text-muted-foreground/40">
                  {stat.value}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
          
          <p className="text-sm text-muted-foreground mt-6 text-center">
            Activity stats coming soon
          </p>
        </section>
      </div>

    </div>
  );
}
