import { Circle } from 'lucide-react';
import { type ChainEvent } from '../types';
import { eventKindLabel } from '../lib/status';

export function StampTimeline({ events }: { events: ChainEvent[] }) {
  const stamps = [...events].sort((a, b) => Date.parse(a.at) - Date.parse(b.at));

  if (stamps.length === 0) {
    return <p className="text-sm text-muted-foreground">No stamps on this lot yet.</p>;
  }

  return (
    <ol className="space-y-4">
      {stamps.map((event) => (
        <li key={event.id} className="flex gap-3">
          <div className="flex flex-col items-center">
            <Circle className="h-5 w-5 fill-verified/20 text-verified" />
            <div className="mt-1 w-px flex-1 bg-border" />
          </div>
          <div className="pb-4">
            <p className="text-sm font-semibold text-foreground">{eventKindLabel(event.kind)}</p>
            <p className="text-sm text-muted-foreground">{event.note}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {new Date(event.at).toLocaleString()} · stamped by {event.orgAccountId}
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
