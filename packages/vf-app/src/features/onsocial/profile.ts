export const PROFILE_KINDS = ['person', 'org', 'dao'] as const;
export type ProfileKind = (typeof PROFILE_KINDS)[number];

export type ProfileAvatarShape = 'circle' | 'squircle' | 'square';

export const PROFILE_FACE_KIND_OPTIONS = [
  { value: 'person', label: 'Person' },
  { value: 'org', label: 'Organization' },
] as const;

export const PROFILE_INDUSTRY_MAX = 64;
export const PROFILE_LOCATION_MAX = 64;
export const PROFILE_NAME_MAX = 32;
export const PROFILE_BIO_MAX = 280;
/** OnSocial About essay (`profile/about`). Face bio stays short. */
export const PROFILE_ABOUT_MAX = 2000;
/** Quiet line above the About essay (`profile/lead`). */
export const PROFILE_LEAD_MAX = 120;
export const PROFILE_ABOUT_PHOTOS_MAX = 3;
export const PROFILE_ABOUT_ALIGN_OPTIONS = ['left', 'center', 'justify'] as const;
export type ProfileAboutAlign = (typeof PROFILE_ABOUT_ALIGN_OPTIONS)[number];
export const PROFILE_ABOUT_ALIGN_DEFAULT: ProfileAboutAlign = 'left';

export const PROFILE_INDUSTRY_OPTIONS = [
  'Accounting',
  'Agriculture',
  'Architecture',
  'Automotive',
  'Beauty',
  'Construction',
  'Consulting',
  'Education',
  'Energy',
  'Engineering',
  'Entertainment',
  'Fashion',
  'Finance',
  'Food',
  'Healthcare',
  'Hospitality',
  'Insurance',
  'Legal',
  'Logistics',
  'Manufacturing',
  'Marketing',
  'Media',
  'Real Estate',
  'Retail',
  'Sports',
  'Technology',
  'Trades',
  'Wellness',
  'AI',
  'Crypto',
  'Fintech',
  'Gaming',
  'Payments',
  'Web3',
  'Community',
  'Government',
  'Nonprofit',
] as const;

export interface OnSocialProfile {
  accountId: string;
  name?: string;
  bio?: string;
  about?: string;
  lead?: string;
  aboutAlign?: ProfileAboutAlign;
  photos?: string[];
  location?: string;
  industry?: string;
  kind?: ProfileKind;
  avatar?: string;
  banner?: string;
  links?: Record<string, string>;
  tags?: string[];
}

export interface ProfileUpdate {
  name?: string | null;
  bio?: string | null;
  about?: string | null;
  lead?: string | null;
  aboutAlign?: ProfileAboutAlign | null;
  photos?: string[] | null;
  location?: string | null;
  industry?: string | null;
  kind?: ProfileKind | null;
  avatar?: string | null;
  banner?: string | null;
  links?: Record<string, string | null> | null;
  tags?: string[] | null;
}

export interface ProfileCurrentRow {
  accountId?: string;
  field?: string;
  value?: string;
}

const DAO_SUFFIX = /\.sputnik-dao\.(near|testnet)$/i;

export function isDaoAccount(accountId?: string | null): boolean {
  return Boolean(accountId && DAO_SUFFIX.test(accountId));
}

export function parseProfileKind(raw: unknown): ProfileKind | undefined {
  if (typeof raw !== 'string') return undefined;
  const value = raw.trim().toLowerCase();
  return PROFILE_KINDS.includes(value as ProfileKind) ? (value as ProfileKind) : undefined;
}

export function editorFaceKind(kind?: ProfileKind | null): 'person' | 'org' {
  return parseProfileKind(kind) === 'org' ? 'org' : 'person';
}

export function resolveDisplayProfileKind(
  kind?: ProfileKind | null,
  fallbackDao = false
): ProfileKind {
  if (fallbackDao) return 'dao';
  return parseProfileKind(kind) === 'org' ? 'org' : 'person';
}

export function profileAvatarShapeFromKind(kind?: ProfileKind | null): ProfileAvatarShape {
  if (kind === 'org') return 'squircle';
  if (kind === 'dao') return 'square';
  return 'circle';
}

export function profileAvatarShapeForAccount(
  kind?: ProfileKind | null,
  accountId?: string | null
): ProfileAvatarShape {
  return profileAvatarShapeFromKind(resolveDisplayProfileKind(kind, isDaoAccount(accountId)));
}

export function profileKindFaceLabel(kind?: ProfileKind | null): string | null {
  if (kind === 'org') return 'Organization';
  if (kind === 'dao') return 'DAO';
  return null;
}

export function normalizeProfileIndustryInput(raw: string): string {
  return raw
    // eslint-disable-next-line no-control-regex -- strip C0 + DEL like the OnSocial SDK
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, PROFILE_INDUSTRY_MAX);
}

function stripProfileControls(raw: string, keepNewlines: boolean): string {
  return keepNewlines
    ? raw
        // eslint-disable-next-line no-control-regex -- strip C0 + DEL (keep \n \t)
        .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, '')
        .replace(/\r\n/g, '\n')
        .replace(/[ \t]+\n/g, '\n')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/[ \t]{2,}/g, ' ')
        .trim()
    : raw
        // eslint-disable-next-line no-control-regex -- strip C0 + DEL like the OnSocial SDK
        .replace(/[\u0000-\u001f\u007f]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
}

export function normalizeProfileLeadInput(raw: string): string {
  return stripProfileControls(raw, true).slice(0, PROFILE_LEAD_MAX);
}

export function normalizeProfileAboutInput(raw: string): string {
  return stripProfileControls(raw, true).slice(0, PROFILE_ABOUT_MAX);
}

export function normalizeProfileAboutAlign(raw: unknown): ProfileAboutAlign {
  const value = String(raw ?? '')
    .trim()
    .toLowerCase();
  return value === 'center' || value === 'justify' ? value : PROFILE_ABOUT_ALIGN_DEFAULT;
}

export function parseProfileAboutPhotos(raw: unknown): string[] {
  let values: unknown[] = [];
  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return [];
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      values = Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  } else if (Array.isArray(raw)) {
    values = raw;
  }

  const refs: string[] = [];
  for (const item of values) {
    if (typeof item !== 'string') continue;
    const ref = item.trim();
    if (!ref) continue;
    refs.push(ref);
    if (refs.length >= PROFILE_ABOUT_PHOTOS_MAX) break;
  }
  return refs;
}

export function profileHasAbout(
  profile: Pick<OnSocialProfile, 'about' | 'lead' | 'photos'> | null | undefined
): boolean {
  return Boolean(profile?.about?.trim() || profile?.lead?.trim() || (profile?.photos?.length ?? 0) > 0);
}

export function profileOrgLineLabel(industry?: string | null): string {
  const value = industry ? normalizeProfileIndustryInput(industry) : '';
  return value || 'Organization';
}

export function displayNameFor(accountId: string, profile: OnSocialProfile | null | undefined): string {
  const name = profile?.name?.trim();
  return name ?? accountId;
}

function parseJsonField<T>(raw: string | undefined, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function parseStringList(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  const parsed = parseJsonField<unknown>(raw, raw);
  if (Array.isArray(parsed)) {
    return parsed.filter((item): item is string => typeof item === 'string' && item.trim().length > 0);
  }
  if (parsed && typeof parsed === 'object') {
    return Object.keys(parsed as Record<string, unknown>);
  }
  if (typeof parsed === 'string' && parsed.trim()) {
    return parsed.split(',').map((item) => item.trim()).filter(Boolean);
  }
  return undefined;
}

function profileFieldKey(raw: string): string {
  return raw.startsWith('profile/') ? raw.slice('profile/'.length) : raw;
}

export function materializeProfile(
  accountId: string,
  fields: Record<string, string>
): OnSocialProfile {
  const links = parseJsonField<Record<string, string> | undefined>(fields.links, undefined);
  const tags = parseStringList(fields.tags);
  const kind = parseProfileKind(fields.kind);
  const industry = fields.industry ? normalizeProfileIndustryInput(fields.industry) : undefined;
  const about = fields.about ? normalizeProfileAboutInput(fields.about) : undefined;
  const lead = fields.lead ? normalizeProfileLeadInput(fields.lead) : undefined;
  const photos = parseProfileAboutPhotos(fields.photos);
  const aboutAlign = fields.aboutAlign ? normalizeProfileAboutAlign(fields.aboutAlign) : undefined;

  return {
    accountId,
    ...(fields.name ? { name: fields.name } : {}),
    ...(fields.bio ? { bio: fields.bio } : {}),
    ...(about ? { about } : {}),
    ...(lead ? { lead } : {}),
    ...(aboutAlign && aboutAlign !== PROFILE_ABOUT_ALIGN_DEFAULT ? { aboutAlign } : {}),
    ...(photos.length > 0 ? { photos } : {}),
    ...(fields.location ? { location: fields.location } : {}),
    ...(industry ? { industry } : {}),
    ...(kind ? { kind } : {}),
    ...(fields.avatar ? { avatar: fields.avatar } : {}),
    ...(fields.banner ? { banner: fields.banner } : {}),
    ...(links && Object.keys(links).length > 0 ? { links } : {}),
    ...(tags && tags.length > 0 ? { tags } : {}),
  };
}

export function profileFromCurrentRows(
  accountId: string,
  rows: ProfileCurrentRow[]
): OnSocialProfile | null {
  const fields: Record<string, string> = {};
  for (const row of rows) {
    if (row.field && row.value !== undefined && row.value !== null) {
      fields[profileFieldKey(row.field)] = row.value;
    }
  }
  if (Object.keys(fields).length === 0) return null;
  return materializeProfile(accountId, fields);
}

function encodeField(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value);
}

export function buildProfileSetData(update: ProfileUpdate): Record<string, string | null> {
  const data: Record<string, string | null> = {};

  const assign = (key: keyof ProfileUpdate, path: string) => {
    const value = update[key];
    if (value === undefined) return;
    data[path] = value === null ? null : encodeField(value);
  };

  assign('name', 'profile/name');
  assign('bio', 'profile/bio');
  if (update.about !== undefined) {
    data['profile/about'] = update.about === null ? null : normalizeProfileAboutInput(update.about) || null;
  }
  if (update.lead !== undefined) {
    data['profile/lead'] = update.lead === null ? null : normalizeProfileLeadInput(update.lead) || null;
  }
  if (update.aboutAlign !== undefined) {
    if (update.aboutAlign === null) {
      data['profile/aboutAlign'] = null;
    } else {
      const align = normalizeProfileAboutAlign(update.aboutAlign);
      data['profile/aboutAlign'] = align === PROFILE_ABOUT_ALIGN_DEFAULT ? null : align;
    }
  }
  if (update.photos !== undefined) {
    data['profile/photos'] =
      update.photos === null ? null : encodeField(parseProfileAboutPhotos(update.photos));
  }
  assign('location', 'profile/location');
  assign('industry', 'profile/industry');
  assign('kind', 'profile/kind');
  assign('avatar', 'profile/avatar');
  assign('banner', 'profile/banner');
  assign('links', 'profile/links');
  assign('tags', 'profile/tags');

  return data;
}

export function profileHasContent(profile: OnSocialProfile | null | undefined): boolean {
  if (!profile) return false;
  return Boolean(
    profile.name ??
      profile.bio ??
      profile.about ??
      profile.lead ??
      (profile.photos && profile.photos.length > 0 ? true : undefined) ??
      profile.avatar ??
      profile.banner ??
      profile.location ??
      profile.industry ??
      profile.kind ??
      (profile.links && Object.keys(profile.links).length > 0 ? true : undefined) ??
      (profile.tags && profile.tags.length > 0)
  );
}
