'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeftRight, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

interface HomeFloatingHeaderProps {
  /** Account ID for profile avatar */
  accountId?: string;
  /** Display name to show in header */
  displayName?: string;
  /** VF token balance to display */
  vfBalance?: string;
  /** VF token icon */
  vfIcon?: string;
  /** Whether user is a DAO member */
  isMember?: boolean;
  /** Callback when Join DAO is clicked */
  onJoinClick?: () => void;
}

export function HomeFloatingHeader({
  accountId,
  displayName,
  vfBalance,
  vfIcon,
  isMember = false,
  onJoinClick,
}: HomeFloatingHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  // Track scroll for header background opacity and collapse effect
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      setScrolled(scrollY > 50);
      // Calculate progress for fade animation (0-1 over 150px scroll after 100px)
      const progress = Math.min(1, Math.max(0, (scrollY - 100) / 150));
      setScrollProgress(progress);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleScrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAvatarClick = () => {
    // Dispatch custom event to open sidebar
    window.dispatchEvent(new CustomEvent('open-sidebar'));
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
        {/* Left: Profile Avatar - Mobile only (desktop has sidebar) */}
        <button
          onClick={handleAvatarClick}
          className="md:hidden rounded-full transition-all z-10"
          aria-label="Open sidebar"
        >
          <ProfileAvatar
            accountId={accountId || ''}
            size="sm"
            className={`ring-2 ring-background transition-all duration-300 ${scrolled ? 'w-7 h-7' : 'w-9 h-9'}`}
          />
        </button>
        
        {/* Desktop: Empty spacer for left side */}
        <div className="hidden md:block w-10" />

        {/* Center: Greeting (fades in on scroll) - centered to viewport, not header */}
        <button
          onClick={handleScrollToTop}
          className="fixed left-1/2 -translate-x-1/2 focus:outline-none border-none outline-none transition-all duration-300 z-10"
          style={{
            opacity: scrollProgress,
            transform: `translateX(-50%) translateY(${(1 - scrollProgress) * -10}px)`,
            pointerEvents: scrollProgress > 0.5 ? 'auto' : 'none',
          }}
        >
          <span className={`font-semibold transition-all duration-300 whitespace-nowrap ${scrolled ? 'text-base' : 'text-lg'}`}>
            <span className="text-primary">Hello</span>{' '}
            <span className="text-verified">{displayName || ''}</span>
          </span>
        </button>

        {/* Right: VF Balance + Action (fades in on scroll) */}
        <div 
          className="flex items-center gap-2 transition-all duration-300"
          style={{
            opacity: scrollProgress,
            transform: `translateX(${(1 - scrollProgress) * 20}px)`,
            pointerEvents: scrollProgress > 0.5 ? 'auto' : 'none',
          }}
        >
          {/* VF Balance */}
          {vfBalance && (
            <Link href="/vf" className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-card/80 border border-border">
              {vfIcon && (
                <img src={vfIcon} alt="VF" className="w-4 h-4 rounded-full" />
              )}
              <span className="text-xs font-semibold text-foreground">{vfBalance}</span>
            </Link>
          )}

          {/* Swap Button / Join DAO */}
          {isMember ? (
            <Link href="/vf">
              <Button variant="verified" size="sm" className="gap-1 px-2">
                <ArrowLeftRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          ) : (
            <Button variant="verified" size="sm" className="gap-1 px-2" onClick={onJoinClick}>
              <UserPlus className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
