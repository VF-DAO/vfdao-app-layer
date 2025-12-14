'use client';

import { useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

interface FloatingHeaderProps {
  /** Account ID for collapsed profile display */
  accountId?: string;
  /** Pre-loaded profile image URL (skips fetching) */
  profileImageUrl?: string | null;
  /** Display name for collapsed profile */
  displayName?: string;
  /** Icon to show before display name (instead of avatar) */
  displayIcon?: ReactNode;
  /** Whether to show the collapsed profile info on scroll */
  showCollapsedProfile?: boolean;
  /** Whether collapsed profile should fade in with scroll (default: true) */
  fadeCollapsedProfile?: boolean;
  /** Right side action buttons */
  actions?: ReactNode;
  /** Whether actions should fade in with scroll (default: true) */
  fadeActions?: boolean;
}

export function FloatingHeader({
  accountId,
  profileImageUrl,
  displayName,
  displayIcon,
  showCollapsedProfile = true,
  fadeCollapsedProfile = true,
  actions,
  fadeActions = true,
}: FloatingHeaderProps) {
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll for header background opacity and collapse effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 50);
      // Calculate progress for collapse animation (0-1 over 200px scroll)
      const progress = Math.min(1, Math.max(0, (scrollY - 100) / 150));
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const truncateAddress = (address: string) => {
    if (address.length <= 20) return address;
    return `${address.slice(0, 8)}...${address.slice(-6)}`;
  };

  return (
    <div 
      className="floating-header fixed top-0 left-0 right-0 z-30 transition-all duration-300 ease-out border-b md:left-20"
      style={{
        backgroundColor: scrolled ? 'hsl(var(--background) / 0.95)' : 'transparent',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderColor: scrolled ? 'hsl(var(--border) / 0.5)' : 'transparent',
      }}
    >
      <div className={`max-w-6xl mx-auto px-4 flex items-center justify-between transition-all duration-300 ${scrolled ? 'py-2 h-12' : 'py-3 h-16'}`}>
        {/* Left side: Back button + collapsed profile */}
        <div className="flex items-center gap-3">
          <Button 
            variant="floating" 
            size="sm" 
            className="gap-2"
            onClick={() => router.back()}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          
          {/* Collapsed profile info - fades in on scroll */}
          {showCollapsedProfile && (accountId || profileImageUrl || displayName) && (
            <div 
              className="flex items-center gap-2.5 transition-all duration-300"
              style={fadeCollapsedProfile ? {
                opacity: scrollProgress,
                transform: `translateX(${(1 - scrollProgress) * -20}px)`,
                pointerEvents: scrollProgress > 0.5 ? 'auto' : 'none',
              } : undefined}
            >
              {displayIcon ? (
                <span className="text-muted-foreground">{displayIcon}</span>
              ) : profileImageUrl ? (
                <img
                  src={profileImageUrl}
                  alt={displayName || 'Profile'}
                  className={`rounded-full shadow-sm ring-2 ring-background object-cover transition-all duration-300 ${scrolled ? 'w-7 h-7' : 'w-8 h-8'}`}
                />
              ) : accountId ? (
                <ProfileAvatar
                  accountId={accountId}
                  size="sm"
                  className={`rounded-full shadow-sm ring-2 ring-background transition-all duration-300 ${scrolled ? 'w-7 h-7' : 'w-8 h-8'}`}
                />
              ) : null}
              <span className="font-semibold text-sm">
                {displayName || (accountId ? truncateAddress(accountId) : '')}
              </span>
            </div>
          )}
        </div>
        
        {/* Right side: Actions - fixed position from right edge */}
        {actions && (
          <div 
            className="flex gap-2 transition-all duration-300"
            style={fadeActions ? {
              opacity: scrollProgress,
              transform: `translateX(${(1 - scrollProgress) * 20}px)`,
              pointerEvents: scrollProgress > 0.5 ? 'auto' : 'none',
            } : undefined}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}