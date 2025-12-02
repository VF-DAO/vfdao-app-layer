'use client';

import { User } from 'lucide-react';
import { useProfile } from '@/hooks/use-profile';
import { cn } from '@/lib/utils';

export type ProfileAvatarSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

interface ProfileAvatarProps {
  /** NEAR account ID */
  accountId: string | null | undefined;
  /** Size preset */
  size?: ProfileAvatarSize;
  /** Custom className for the container */
  className?: string;
  /** Whether to show the fallback icon when no profile image */
  showFallback?: boolean;
  /** Custom fallback icon className */
  fallbackClassName?: string;
  /** Pre-fetched profile image URL (skip fetching if provided) */
  profileImageUrl?: string | null;
}

const sizeClasses: Record<ProfileAvatarSize, { container: string; icon: string }> = {
  xs: { container: 'w-4 h-4', icon: 'w-4 h-4' },
  sm: { container: 'w-5 h-5', icon: 'w-5 h-5' },
  md: { container: 'w-8 h-8', icon: 'w-6 h-6' },
  lg: { container: 'w-10 h-10', icon: 'w-7 h-7' },
  xl: { container: 'w-12 h-12', icon: 'w-8 h-8' },
};

/**
 * ProfileAvatar - A reusable component for displaying NEAR Social profile images
 * 
 * Features:
 * - Fetches profile image from Social DB automatically
 * - Handles IPFS image loading and errors gracefully
 * - Shows a fallback User icon when no image available
 * - Multiple size presets
 * - Can accept pre-fetched profileImageUrl to avoid duplicate fetches
 * 
 * @example
 * // Basic usage - will fetch profile automatically
 * <ProfileAvatar accountId="alice.near" size="md" />
 * 
 * @example
 * // With pre-fetched URL (from useMultipleProfiles)
 * <ProfileAvatar accountId="alice.near" profileImageUrl={url} size="sm" />
 */
export function ProfileAvatar({
  accountId,
  size = 'sm',
  className,
  showFallback = true,
  fallbackClassName,
  profileImageUrl: preloadedImageUrl,
}: ProfileAvatarProps) {
  // Only fetch if we don't have a pre-loaded URL
  const { profileImageUrl: fetchedImageUrl } = useProfile(
    preloadedImageUrl === undefined ? accountId : null
  );

  const imageUrl = preloadedImageUrl ?? fetchedImageUrl;
  const { container, icon } = sizeClasses[size];

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.target as HTMLImageElement;
    img.style.display = 'none';
    // Show the next sibling (fallback icon)
    const fallback = img.nextElementSibling;
    if (fallback) {
      fallback.classList.remove('hidden');
    }
  };

  if (!showFallback && !imageUrl) {
    return null;
  }

  return (
    <div className={cn('relative flex-shrink-0 rounded-full overflow-hidden', container, className)}>
      {imageUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt=""
            className="w-full h-full rounded-full object-cover"
            onError={handleImageError}
          />
          <User
            className={cn(
              'text-muted-foreground hidden absolute inset-0 m-auto',
              icon,
              fallbackClassName
            )}
          />
        </>
      ) : showFallback ? (
        <User
          className={cn('text-muted-foreground', icon, fallbackClassName)}
        />
      ) : null}
    </div>
  );
}

/**
 * ProfileName - A component for displaying NEAR Social profile name with fallback
 * 
 * @example
 * <ProfileName accountId="alice.near" />
 */
interface ProfileNameProps {
  /** NEAR account ID */
  accountId: string | null | undefined;
  /** Custom className */
  className?: string;
  /** Whether to show full account ID as fallback (true) or truncated (false) */
  showFullFallback?: boolean;
  /** Pre-fetched display name (skip fetching if provided) */
  displayName?: string;
}

export function ProfileName({
  accountId,
  className,
  showFullFallback = true,
  displayName: preloadedName,
}: ProfileNameProps) {
  const { displayName: fetchedName } = useProfile(
    preloadedName === undefined ? accountId : null
  );

  const name = preloadedName ?? fetchedName;

  if (!accountId) return null;

  const displayText = name || (showFullFallback ? accountId : truncateAccountId(accountId));

  return <span className={className}>{displayText}</span>;
}

/**
 * ProfileAvatarWithName - Combined avatar and name display
 * 
 * @example
 * <ProfileAvatarWithName accountId="alice.near" size="sm" />
 */
interface ProfileAvatarWithNameProps extends Omit<ProfileAvatarProps, 'showFallback'> {
  /** Custom className for the name */
  nameClassName?: string;
  /** Whether to show full account ID as fallback */
  showFullFallback?: boolean;
  /** Pre-fetched display name */
  displayName?: string;
}

export function ProfileAvatarWithName({
  accountId,
  size = 'sm',
  className,
  fallbackClassName,
  profileImageUrl,
  nameClassName,
  showFullFallback = false,
  displayName: preloadedName,
}: ProfileAvatarWithNameProps) {
  const { displayName: fetchedName, profileImageUrl: fetchedImageUrl } = useProfile(
    (preloadedName === undefined || profileImageUrl === undefined) ? accountId : null
  );

  const name = preloadedName ?? fetchedName;
  const imageUrl = profileImageUrl ?? fetchedImageUrl;

  if (!accountId) return null;

  return (
    <span className={cn('flex items-center gap-2', className)}>
      <ProfileAvatar
        accountId={accountId}
        size={size}
        profileImageUrl={imageUrl}
        fallbackClassName={fallbackClassName}
        showFallback
      />
      <span className={cn('truncate', nameClassName)}>
        {name || (showFullFallback ? accountId : truncateAccountId(accountId))}
      </span>
    </span>
  );
}

/**
 * Utility function to truncate account IDs
 */
function truncateAccountId(accountId: string, maxLength = 20): string {
  if (accountId.length <= maxLength) return accountId;
  const start = accountId.slice(0, 8);
  const end = accountId.slice(-8);
  return `${start}...${end}`;
}
