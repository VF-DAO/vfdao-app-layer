import React from 'react';
import { LoadingDots } from '@/components/ui/loading-dots';

interface LoadingOverlayProps {
  message?: string;
}

export function LoadingOverlay({ message = 'Loading pool information...' }: LoadingOverlayProps) {
  return (
    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
      <div className="flex flex-col items-center gap-3">
        <LoadingDots size="md" />
        <span className="text-sm text-muted-foreground">{message}</span>
      </div>
    </div>
  );
}
