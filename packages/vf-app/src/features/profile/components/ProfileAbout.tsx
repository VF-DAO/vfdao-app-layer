import { resolveOnSocialMediaUrl } from '@/features/onsocial/media';
import {
  normalizeProfileAboutAlign,
  profileHasAbout,
  type OnSocialProfile,
} from '@/features/onsocial/profile';

const ALIGN_CLASS = {
  left: 'text-left',
  center: 'text-center',
  justify: 'text-justify',
} as const;

export function ProfileAbout({ profile }: { profile: OnSocialProfile | null | undefined }) {
  if (!profileHasAbout(profile)) return null;

  const align = normalizeProfileAboutAlign(profile?.aboutAlign);
  const photos = (profile?.photos ?? [])
    .map((ref) => resolveOnSocialMediaUrl(ref))
    .filter((url): url is string => Boolean(url));

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">About</h2>
      {profile?.lead && (
        <p className="text-sm text-muted-foreground">{profile.lead}</p>
      )}
      {photos.length > 0 && (
        <div className={`grid gap-2 ${photos.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
          {photos.map((url, index) => (
            // eslint-disable-next-line @next/next/no-img-element -- remote OnSocial / IPFS about stills
            <img
              key={`${url}-${index}`}
              src={url}
              alt=""
              className={`w-full object-cover rounded-2xl border border-border/60 ${
                photos.length === 3 && index === 0 ? 'col-span-2 max-h-64' : 'max-h-48'
              }`}
            />
          ))}
        </div>
      )}
      {profile?.about && (
        <div
          className={`max-w-xl text-base leading-relaxed text-foreground/85 whitespace-pre-wrap ${ALIGN_CLASS[align]}`}
        >
          {profile.about}
        </div>
      )}
    </section>
  );
}
