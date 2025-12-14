'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useWithYou } from '@/hooks/use-with-you';
import { cn } from '@/lib/utils';
import type { WithYouContext } from '@/types/with-you';

interface WithYouButtonProps {
  /** Account or thing to express solidarity with */
  targetAccountId: string;
  /** Optional context for why you're with them */
  context?: WithYouContext;
  /** Show the count */
  showCount?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Additional class names */
  className?: string;
}

/**
 * "I'm With You" Button
 * 
 * Simple. Human. Meaningful.
 * 
 * Usage:
 * <WithYouButton targetAccountId="friend.near" />
 * <WithYouButton targetAccountId="friend.near" context={{ type: 'proposal', proposalId: 42 }} />
 */
export function WithYouButton({
  targetAccountId,
  context,
  showCount = true,
  size = 'md',
  className,
}: WithYouButtonProps) {
  const {
    isWithThem,
    withThem,
    toggleWithYou,
    isLoading,
    isToggling,
    canInteract,
  } = useWithYou(targetAccountId);

  const handleClick = async () => {
    if (!canInteract) return;
    await toggleWithYou(context);
  };

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  if (isLoading) {
    return (
      <Button
        variant="outline"
        size="sm"
        disabled
        className={cn(sizeClasses[size], 'opacity-50', className)}
      >
        <span className="animate-pulse">...</span>
      </Button>
    );
  }

  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      className="inline-flex"
    >
      <Button
        variant={isWithThem ? 'primary' : 'ghost'}
        size="sm"
        onClick={handleClick}
        disabled={!canInteract || isToggling}
        className={cn(
          sizeClasses[size],
          'transition-all duration-300',
          isWithThem && 'bg-primary/20 hover:bg-primary/30',
          !canInteract && 'cursor-not-allowed opacity-50',
          className
        )}
      >
        <AnimatePresence mode="wait">
          <motion.span
            key={isWithThem ? 'with' : 'not-with'}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.15 }}
            className="flex items-center gap-1.5"
          >
            {isWithThem ? (
              <>
                <Heart className={cn(iconSizes[size], 'fill-current')} />
                <span>With You</span>
              </>
            ) : (
              <>
                <Heart className={iconSizes[size]} />
                <span>I'm With You</span>
              </>
            )}
          </motion.span>
        </AnimatePresence>
        
        {showCount && withThem > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className={cn(
              'ml-1 px-1.5 py-0.5 rounded-full text-xs font-medium',
              isWithThem 
                ? 'bg-primary-foreground/20 text-primary-foreground' 
                : 'bg-muted text-muted-foreground'
            )}
          >
            {withThem}
          </motion.span>
        )}
      </Button>
    </motion.div>
  );
}

/**
 * Display-only solidarity count
 * Shows how many are with someone
 */
export function WithYouCount({
  targetAccountId,
  className,
}: {
  targetAccountId: string;
  className?: string;
}) {
  const { withThem, isLoading } = useWithYou(targetAccountId);

  if (isLoading) {
    return <span className={cn('text-muted-foreground', className)}>...</span>;
  }

  if (withThem === 0) {
    return null;
  }

  return (
    <div className={cn('flex items-center gap-1.5 text-muted-foreground', className)}>
      <Users className="w-4 h-4" />
      <span className="text-sm">
        <strong className="text-foreground">{withThem}</strong> {withThem === 1 ? 'is' : 'are'} with them
      </span>
    </div>
  );
}

/**
 * Compact solidarity badge for profiles/cards
 */
export function WithYouBadge({
  targetAccountId,
  className,
}: {
  targetAccountId: string;
  className?: string;
}) {
  const { withThem, isWithThem, isLoading } = useWithYou(targetAccountId);

  if (isLoading || withThem === 0) {
    return null;
  }

  return (
    <div 
      className={cn(
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs',
        isWithThem 
          ? 'bg-primary/10 text-primary' 
          : 'bg-muted text-muted-foreground',
        className
      )}
    >
      <Heart className={cn('w-3 h-3', isWithThem && 'fill-current')} />
      <span>{withThem}</span>
    </div>
  );
}
