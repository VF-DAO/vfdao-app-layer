// src/hooks/use-profile.ts
import { useEffect, useState } from 'react';
import { socialDBService } from '../services/social-db';
import type { NearSocialProfileData } from '../types/profile';

export function useProfile(accountId: string | null | undefined) {
  const [profile, setProfile] = useState<NearSocialProfileData | null>(null);
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

    const fetchProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const profileData = await socialDBService.getProfile(accountId);
        if (mounted) {
          setProfile(profileData);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch profile');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchProfile();

    return () => {
      mounted = false;
    };
  }, [accountId]);

  const displayName = accountId ? socialDBService.getDisplayName(accountId, profile) : '';
  const profileImageUrl = socialDBService.getProfileImageUrl(profile);
  const description = socialDBService.getProfileDescription(profile);

  return {
    profile,
    displayName,
    profileImageUrl,
    description,
    loading,
    error,
    refetch: () => {
      if (accountId) {
        socialDBService.getProfile(accountId).then(setProfile).catch(setError);
      }
    }
  };
}

export function useMultipleProfiles(accountIds: (string | null | undefined)[]) {
  const [profiles, setProfiles] = useState<Record<string, NearSocialProfileData | null>>({});
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

    const fetchProfiles = async () => {
      setLoading(true);
      setError(null);

      try {
        const profilesData = await socialDBService.getMultipleProfiles(validAccountIds);
        if (mounted) {
          setProfiles(profilesData);
        }
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Failed to fetch profiles');
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void fetchProfiles();

    return () => {
      mounted = false;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validAccountIds.join(',')]); // Join to create a stable dependency

  const getDisplayName = (accountId: string) => {
    const profile = profiles[accountId];
    return socialDBService.getDisplayName(accountId, profile);
  };

  const getProfileImageUrl = (accountId: string) => {
    const profile = profiles[accountId];
    return socialDBService.getProfileImageUrl(profile);
  };

  return {
    profiles,
    getDisplayName,
    getProfileImageUrl,
    loading,
    error,
    refetch: () => {
      if (validAccountIds.length > 0) {
        socialDBService.getMultipleProfiles(validAccountIds).then(setProfiles).catch(setError);
      }
    }
  };
}