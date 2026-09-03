import { fixtureOrgs } from '@/features/tracking/api/fixtures';
import type { OnSocialProfile } from './profile';

export const LOCAL_PROFILE_KEY = 'vf.onsocial.profiles.v1';

type ProfileStore = Record<string, OnSocialProfile>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function seedProfiles(): ProfileStore {
  const store: ProfileStore = {};
  fixtureOrgs.forEach((org) => {
    store[org.accountId] = {
      accountId: org.accountId,
      name: org.name,
      kind: 'org',
      industry:
        org.role === 'producer' ? 'Agriculture' : org.role === 'processor' ? 'Manufacturing' : 'Nonprofit',
    };
  });
  store['vegan-friends.sputnik-dao.near'] = {
    accountId: 'vegan-friends.sputnik-dao.near',
    name: 'Vegan Friends DAO',
    kind: 'dao',
    bio: 'Vegan Friends DAO treasury and community.',
  };
  return store;
}

function readStore(): ProfileStore {
  if (!canUseStorage()) return seedProfiles();
  try {
    const raw = window.localStorage.getItem(LOCAL_PROFILE_KEY);
    if (!raw) {
      const seeded = seedProfiles();
      window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as ProfileStore;
    return { ...seedProfiles(), ...parsed };
  } catch {
    return seedProfiles();
  }
}

function writeStore(store: ProfileStore): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_PROFILE_KEY, JSON.stringify(store));
}

export function getLocalProfile(accountId: string): OnSocialProfile | null {
  return readStore()[accountId] ?? null;
}

export function getLocalProfiles(accountIds: string[]): Record<string, OnSocialProfile | null> {
  const store = readStore();
  return Object.fromEntries(accountIds.map((id) => [id, store[id] ?? null]));
}

export function putLocalProfile(profile: OnSocialProfile): OnSocialProfile {
  const store = readStore();
  store[profile.accountId] = profile;
  writeStore(store);
  return profile;
}

export function mergeLocalProfile(accountId: string, patch: Partial<OnSocialProfile>): OnSocialProfile {
  const current = getLocalProfile(accountId) ?? { accountId };
  const next: OnSocialProfile = {
    ...current,
    ...patch,
    accountId,
  };
  if (patch.links) {
    next.links = { ...current.links, ...patch.links };
  }
  return putLocalProfile(next);
}
