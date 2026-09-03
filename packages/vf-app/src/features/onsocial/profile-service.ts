import { getOnSocialConfig, isOnSocialConfigured } from '@/features/tracking/api/onsocial/config';
import { queryProfilesCurrent, queryProfilesCurrentMany } from '@/features/tracking/api/onsocial/gateway';
import { resolveOnSocialMediaUrl } from './media';
import {
  displayNameFor,
  type OnSocialProfile,
  profileFromCurrentRows,
  profileHasContent,
} from './profile';
import { getLocalProfile, getLocalProfiles, mergeLocalProfile } from './profile-store';

export function getProfileImageUrl(profile: OnSocialProfile | null | undefined): string | null {
  return resolveOnSocialMediaUrl(profile?.avatar, getOnSocialConfig().network);
}

export function getBannerUrl(profile: OnSocialProfile | null | undefined): string | null {
  return resolveOnSocialMediaUrl(profile?.banner, getOnSocialConfig().network);
}

export function getProfileDescription(profile: OnSocialProfile | null | undefined): string | null {
  const bio = profile?.bio?.trim();
  return bio ?? null;
}

export async function readGatewayProfile(accountId: string): Promise<OnSocialProfile | null> {
  const rows = await queryProfilesCurrent(getOnSocialConfig(), accountId);
  return profileFromCurrentRows(accountId, rows);
}

export async function readGatewayProfiles(
  accountIds: string[]
): Promise<Record<string, OnSocialProfile | null>> {
  const unique = [...new Set(accountIds.filter(Boolean))];
  const out: Record<string, OnSocialProfile | null> = Object.fromEntries(unique.map((id) => [id, null]));
  if (unique.length === 0) return out;

  const rows = await queryProfilesCurrentMany(getOnSocialConfig(), unique);
  const byAccount = new Map<string, { accountId?: string; field?: string; value?: string }[]>();
  for (const row of rows) {
    const id = row.accountId;
    if (!id) continue;
    const list = byAccount.get(id) ?? [];
    list.push(row);
    byAccount.set(id, list);
  }
  for (const id of unique) {
    out[id] = profileFromCurrentRows(id, byAccount.get(id) ?? []);
  }
  return out;
}

export async function getProfile(accountId: string): Promise<OnSocialProfile | null> {
  const local = getLocalProfile(accountId);
  if (isOnSocialConfigured()) {
    try {
      const live = await readGatewayProfile(accountId);
      if (live && profileHasContent(live)) return live;
    } catch (error) {
      console.warn('[onsocial] profile gateway read failed', error);
    }
  }
  return local;
}

export async function getMultipleProfiles(
  accountIds: string[]
): Promise<Record<string, OnSocialProfile | null>> {
  const unique = [...new Set(accountIds.filter(Boolean))];
  const local = getLocalProfiles(unique);
  if (!isOnSocialConfigured()) return local;

  try {
    const live = await readGatewayProfiles(unique);
    return Object.fromEntries(
      unique.map((id) => [id, profileHasContent(live[id]) ? live[id] : local[id]])
    );
  } catch (error) {
    console.warn('[onsocial] profile batch read failed', error);
    return local;
  }
}

export function applyLocalProfileUpdate(
  accountId: string,
  profile: OnSocialProfile
): OnSocialProfile {
  return mergeLocalProfile(accountId, profile);
}

export async function fetchProfile(accountId: string): Promise<OnSocialProfile | null> {
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(
        `/api/onsocial/profiles?accountId=${encodeURIComponent(accountId)}`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const remote = (await response.json()) as OnSocialProfile | null;
        if (profileHasContent(remote)) return remote;
      }
    } catch (error) {
      console.warn('[onsocial] profile api failed', error);
    }
    return getLocalProfile(accountId);
  }
  return getProfile(accountId);
}

export async function fetchMultipleProfiles(
  accountIds: string[]
): Promise<Record<string, OnSocialProfile | null>> {
  const unique = [...new Set(accountIds.filter(Boolean))];
  if (unique.length === 0) return {};
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(
        `/api/onsocial/profiles?accountIds=${encodeURIComponent(unique.join(','))}`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const remote = (await response.json()) as Record<string, OnSocialProfile | null>;
        const local = getLocalProfiles(unique);
        return Object.fromEntries(
          unique.map((id) => [id, profileHasContent(remote[id]) ? remote[id] : local[id]])
        );
      }
    } catch (error) {
      console.warn('[onsocial] profile batch api failed', error);
    }
    return getLocalProfiles(unique);
  }
  return getMultipleProfiles(unique);
}

export { displayNameFor };
