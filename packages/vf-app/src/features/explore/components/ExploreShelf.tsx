'use client';

import { useVfShelf, vfShelfCountLabel } from '@/features/tracking';
import { profileOrgLineLabel } from '@/features/onsocial/profile';
import { useMultipleProfiles } from '@/hooks/use-profile';
import { ShelfFaceRow } from './ShelfFaceRow';

export function ExploreShelf() {
  const shelf = useVfShelf();
  const listings = shelf.data ?? [];
  const faces = useMultipleProfiles(listings.map((item) => item.orgAccountId));
  const count = listings.length;

  return (
    <div className="mx-auto w-full max-w-3xl space-y-6">
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">On the VF shelf</h1>
        <p className="text-sm text-muted-foreground">
          VF promo. Unlisted lots still scan.
        </p>
        {count > 0 && <p className="text-sm text-muted-foreground">{vfShelfCountLabel(count)}</p>}
      </header>

      {shelf.loading ? (
        <ul className="space-y-2">
          <li className="h-16 animate-pulse rounded-xl bg-muted/40" />
        </ul>
      ) : count === 0 ? (
        <p className="text-sm text-muted-foreground">No one on the VF shelf yet. Lots still scan.</p>
      ) : (
        <ul className="space-y-2">
          {listings.map((item) => {
            const profile = faces.profiles[item.orgAccountId];
            return (
              <li key={item.orgAccountId}>
                <ShelfFaceRow
                  accountId={item.orgAccountId}
                  name={faces.getDisplayName(item.orgAccountId)}
                  imageUrl={faces.getProfileImageUrl(item.orgAccountId)}
                  line={profile?.kind === 'org' || profile?.industry ? profileOrgLineLabel(profile?.industry) : null}
                />
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
