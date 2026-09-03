import { useEffect, useState } from 'react';
import {
  displayNameFor,
  isDaoAccount,
  type OnSocialProfile,
  resolveDisplayProfileKind,
} from '@/features/onsocial/profile';
import {
  fetchMultipleProfiles,
  fetchProfile,
  getProfileDescription,
  getProfileImageUrl,
} from '@/features/onsocial/profile-service';

export function useProfile(accountId: string | null | undefined) {
  const [profile, setProfile] = useState<OnSocialProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchProfile(accountId);
        if (mounted) setProfile(next);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
  }, [accountId]);

  const displayName = accountId ? displayNameFor(accountId, profile) : '';
  const profileImageUrl = getProfileImageUrl(profile);
  const description = getProfileDescription(profile);
  const kind = resolveDisplayProfileKind(profile?.kind, isDaoAccount(accountId));

  return {
    profile,
    displayName,
    profileImageUrl,
    description,
    kind,
    industry: profile?.industry ?? null,
    loading,
    error,
    refetch: () => {
      if (accountId) {
        void fetchProfile(accountId).then(setProfile).catch(setError);
      }
    },
  };
}

export function useMultipleProfiles(accountIds: (string | null | undefined)[]) {
  const [profiles, setProfiles] = useState<Record<string, OnSocialProfile | null>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validAccountIds = accountIds.filter((id): id is string => Boolean(id));

  useEffect(() => {
    if (validAccountIds.length === 0) {
      setProfiles({});
      setLoading(false);
      setError(null);
      return;
    }

    let mounted = true;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const next = await fetchMultipleProfiles(validAccountIds);
        if (mounted) setProfiles(next);
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    void load();
    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validAccountIds.join(',')]);

  const getDisplayName = (id: string) => displayNameFor(id, profiles[id]);
  const getProfileImageUrlFor = (id: string) => getProfileImageUrl(profiles[id]);

  return {
    profiles,
    getDisplayName,
    getProfileImageUrl: getProfileImageUrlFor,
    loading,
    error,
    refetch: () => {
      if (validAccountIds.length > 0) {
        void fetchMultipleProfiles(validAccountIds).then(setProfiles).catch(setError);
      }
    },
  };
}
