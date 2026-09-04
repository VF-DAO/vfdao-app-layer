'use client';

import { Sprout } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useSprout } from '../hooks/use-voice';
import type { VoiceSubjectType } from '../types';

export function SproutButton({
  subjectType,
  subjectId,
  className,
}: {
  subjectType: VoiceSubjectType;
  subjectId: string;
  className?: string;
}) {
  const { stats, loading, isToggling, canInteract, toggle } = useSprout(subjectType, subjectId);

  if (loading) {
    return (
      <Button variant="outline" size="sm" disabled className={cn('opacity-50', className)}>
        <span className="animate-pulse">...</span>
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant={stats.viewerSprouted ? 'verified' : 'outline'}
      size="sm"
      onClick={() => {
        void toggle();
      }}
      disabled={!canInteract || isToggling}
      aria-pressed={stats.viewerSprouted}
      className={cn(!canInteract && 'cursor-not-allowed opacity-50', className)}
      title={canInteract ? 'Sprout this product. Does not rank Explore.' : 'Connect a wallet to sprout'}
    >
      <Sprout className="h-4 w-4" />
      {stats.viewerSprouted ? 'Sprouted' : 'Sprout'}
      {stats.count > 0 && (
        <span
          className={cn(
            'ml-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium',
            stats.viewerSprouted ? 'bg-verified/20 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          {stats.count}
        </span>
      )}
    </Button>
  );
}
