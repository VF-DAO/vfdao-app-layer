'use client';

import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStanding } from '@/hooks/use-standing';
import { cn } from '@/lib/utils';

interface StandWithButtonProps {
  targetAccountId: string;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function StandWithButton({
  targetAccountId,
  showCount = true,
  size = 'md',
  className,
}: StandWithButtonProps) {
  const { viewerStandsWith, incoming, toggle, isLoading, isToggling, canInteract } =
    useStanding(targetAccountId);

  const sizeClasses = {
    sm: 'text-xs px-2.5 py-1 gap-1.5',
    md: 'text-sm px-3 py-1.5 gap-2',
    lg: 'text-base px-4 py-2 gap-2.5',
  };

  if (isLoading) {
    return (
      <Button variant="outline" size="sm" disabled className={cn(sizeClasses[size], 'opacity-50', className)}>
        <span className="animate-pulse">...</span>
      </Button>
    );
  }

  return (
    <Button
      variant={viewerStandsWith ? 'verified' : 'outline'}
      size="sm"
      onClick={() => {
        void toggle();
      }}
      disabled={!canInteract || isToggling}
      className={cn(sizeClasses[size], !canInteract && 'cursor-not-allowed opacity-50', className)}
    >
      {viewerStandsWith ? 'Standing' : 'Stand with'}
      {showCount && incoming > 0 && (
        <span
          className={cn(
            'ml-0.5 px-1.5 py-0.5 rounded-full text-xs font-medium',
            viewerStandsWith ? 'bg-verified/20 text-primary' : 'bg-muted text-muted-foreground'
          )}
        >
          {incoming}
        </span>
      )}
    </Button>
  );
}

export function StandingCount({
  targetAccountId,
  subject = 'them',
  className,
}: {
  targetAccountId: string;
  subject?: 'them' | 'you';
  className?: string;
}) {
  const { incoming, outgoing, isLoading } = useStanding(targetAccountId);

  if (isLoading) {
    return <span className={cn('text-muted-foreground', className)}>...</span>;
  }

  const incomingLabel =
    incoming === 1
      ? subject === 'you'
        ? 'stands with you'
        : 'stands with them'
      : subject === 'you'
        ? 'stand with you'
        : 'stand with them';

  if (incoming === 0 && (subject !== 'you' || outgoing === 0)) {
    return null;
  }

  return (
    <div className={cn('flex flex-wrap items-center gap-x-3 gap-y-1 text-muted-foreground', className)}>
      {incoming > 0 && (
        <span className="flex items-center gap-1.5 text-sm">
          <Users className="w-4 h-4" />
          <strong className="text-foreground">{incoming}</strong> {incomingLabel}
        </span>
      )}
      {subject === 'you' && outgoing > 0 && (
        <span className="text-sm">
          You stand with <strong className="text-foreground">{outgoing}</strong>
        </span>
      )}
    </div>
  );
}
