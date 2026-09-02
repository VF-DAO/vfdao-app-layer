import { CheckCircle2, Circle } from 'lucide-react';
import { type ChainEvent, EVENT_KINDS } from '../types';
import { eventKindLabel } from '../lib/status';

export function SupplyChainTimeline({ events }: { events: ChainEvent[] }) {
  return (
    <ol className="space-y-4">
      {EVENT_KINDS.map((kind) => {
        const event = events.find((item) => item.kind === kind);
        const done = Boolean(event);
        return (
          <li key={kind} className="flex gap-3">
            <div className="flex flex-col items-center">
              {done ? (
                <CheckCircle2 className="h-5 w-5 text-verified" />
              ) : (
                <Circle className="h-5 w-5 text-muted-foreground/50" />
              )}
              <div className="mt-1 w-px flex-1 bg-border" />
            </div>
            <div className="pb-4">
              <p className={`text-sm font-semibold ${done ? 'text-foreground' : 'text-muted-foreground'}`}>
                {eventKindLabel(kind)}
              </p>
              {event ? (
                <>
                  <p className="text-sm text-muted-foreground">{event.note}</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {new Date(event.at).toLocaleString()} · {event.orgAccountId}
                  </p>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">Not recorded yet</p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
