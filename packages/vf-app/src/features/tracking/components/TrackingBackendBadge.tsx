'use client';

import { Badge } from '@/components/ui/badge';
import { useTrackerStatus } from '../hooks/use-tracker';

export function TrackingBackendBadge() {
  const { data } = useTrackerStatus();
  if (!data) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant={data.backend === 'onsocial' ? 'primary' : 'muted'}>
        {data.backend === 'onsocial' ? 'OnSocial core' : 'Local fixtures'}
      </Badge>
      <span className="text-xs text-muted-foreground">{data.note}</span>
    </div>
  );
}
