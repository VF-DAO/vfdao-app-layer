'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { ProfileAvatar } from '@/components/ui/profile-avatar';

export function ShelfFaceRow({
  accountId,
  name,
  imageUrl,
  line,
}: {
  accountId: string;
  name: string;
  imageUrl?: string | null;
  line?: string | null;
}) {
  return (
    <Link
      href={`/profile/${encodeURIComponent(accountId)}`}
      className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/20 px-4 py-3 transition-colors hover:border-primary/30"
    >
      <span className="flex min-w-0 items-center gap-3">
        <ProfileAvatar
          accountId={accountId}
          size="md"
          {...(imageUrl ? { profileImageUrl: imageUrl } : {})}
        />
        <span className="min-w-0">
          <span className="block truncate font-medium text-foreground">{name}</span>
          {line && <span className="block truncate text-sm text-muted-foreground">{line}</span>}
        </span>
      </span>
      <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
    </Link>
  );
}
