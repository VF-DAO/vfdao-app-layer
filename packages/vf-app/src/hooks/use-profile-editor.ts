import { useCallback, useEffect, useRef, useState } from 'react';
import { useWallet } from '../features/wallet';
import { useProfile } from './use-profile';
import { buildCoreSetTransaction } from '@/features/onsocial/core-write';
import { cidFromMediaRef, resolveOnSocialMediaUrl, toIpfsUri } from '@/features/onsocial/media';
import {
  buildProfileSetData,
  editorFaceKind,
  isDaoAccount,
  type OnSocialProfile,
  type ProfileKind,
  type ProfileUpdate,
} from '@/features/onsocial/profile';
import { applyLocalProfileUpdate } from '@/features/onsocial/profile-service';
import { getStoredSession } from '@/features/onsocial/session';
import { getOnSocialConfig } from '@/features/tracking/api/onsocial/config';
import { relayCoreSet } from '@/features/tracking/api/onsocial/gateway';

export interface UseProfileEditorOptions {
  onSuccess?: (transactionHash?: string) => void;
  onError?: (error: Error) => void;
}

export interface ProfileEditorState {
  name: string;
  bio: string;
  about: string;
  lead: string;
  photos: string[];
  imageUrl: string;
  imageIpfsCid: string;
  backgroundImageUrl: string;
  backgroundImageIpfsCid: string;
  website: string;
  location: string;
  kind: 'person' | 'org';
  industry: string;
  tags: string;
  links: {
    twitter?: string;
    github?: string;
    telegram?: string;
    website?: string;
  };
}

function mediaParts(value?: string): { url: string; cid: string } {
  if (!value) return { url: '', cid: '' };
  const cid = cidFromMediaRef(value);
  if (cid) return { url: '', cid };
  return { url: value, cid: '' };
}

export function useProfileEditor(options: UseProfileEditorOptions = {}) {
  const { wallet, accountId } = useWallet();
  const { profile, loading: isLoadingProfile, refetch, kind } = useProfile(accountId);
  const daoLocked = isDaoAccount(accountId);

  const getInitialState = useCallback((): ProfileEditorState => {
    const avatar = mediaParts(profile?.avatar);
    const banner = mediaParts(profile?.banner);
    return {
      name: profile?.name ?? '',
      bio: profile?.bio ?? '',
      about: profile?.about ?? '',
      lead: profile?.lead ?? '',
      photos: profile?.photos ?? [],
      imageUrl: avatar.url,
      imageIpfsCid: avatar.cid,
      backgroundImageUrl: banner.url,
      backgroundImageIpfsCid: banner.cid,
      website: profile?.links?.website ?? '',
      location: profile?.location ?? '',
      kind: daoLocked ? 'person' : editorFaceKind(profile?.kind ?? kind),
      industry: profile?.industry ?? '',
      tags: profile?.tags?.join(', ') ?? '',
      links: {
        twitter: profile?.links?.twitter ?? profile?.links?.x ?? '',
        github: profile?.links?.github ?? '',
        telegram: profile?.links?.telegram ?? '',
        website: profile?.links?.website ?? '',
      },
    };
  }, [daoLocked, kind, profile]);

  const [formState, setFormState] = useState<ProfileEditorState>(getInitialState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);
  const hasSyncedProfile = useRef(false);

  useEffect(() => {
    if (profile && !hasSyncedProfile.current) {
      setFormState(getInitialState());
      hasSyncedProfile.current = true;
    }
  }, [getInitialState, profile]);

  const resetForm = useCallback(() => {
    setFormState(getInitialState());
    setError(null);
    setTransactionHash(null);
    hasSyncedProfile.current = true;
  }, [getInitialState]);

  const updateField = useCallback(<K extends keyof ProfileEditorState>(
    field: K,
    value: ProfileEditorState[K]
  ) => {
    setFormState((prev) => ({ ...prev, [field]: value }));
  }, []);

  const updateLink = useCallback((platform: keyof ProfileEditorState['links'], value: string) => {
    setFormState((prev) => ({
      ...prev,
      links: { ...prev.links, [platform]: value },
    }));
  }, []);

  const buildUpdate = useCallback((): ProfileUpdate => {
    const data: ProfileUpdate = {};
    const initial = getInitialState();
    const changed = (current: string, original: string): string | null | undefined => {
      const next = current.trim();
      const prev = original.trim();
      if (next === prev) return undefined;
      if (next) return next;
      return prev ? null : undefined;
    };

    const name = changed(formState.name, initial.name);
    if (name !== undefined) data.name = name;
    const bio = changed(formState.bio, initial.bio);
    if (bio !== undefined) data.bio = bio;
    const about = changed(formState.about, initial.about);
    if (about !== undefined) data.about = about;
    const lead = changed(formState.lead, initial.lead);
    if (lead !== undefined) data.lead = lead;
    const nextPhotos = formState.photos.map((ref) => ref.trim()).filter(Boolean);
    const prevPhotos = initial.photos.map((ref) => ref.trim()).filter(Boolean);
    if (nextPhotos.join('\0') !== prevPhotos.join('\0')) {
      data.photos = nextPhotos.length > 0 ? nextPhotos : prevPhotos.length > 0 ? null : undefined;
    }
    const location = changed(formState.location, initial.location);
    if (location !== undefined) data.location = location;

    if (!daoLocked) {
      if (formState.kind !== initial.kind) {
        data.kind = formState.kind;
      }
      if (formState.kind === 'org') {
        const industry = changed(formState.industry, initial.industry);
        if (industry !== undefined) data.industry = industry;
      } else if (initial.industry) {
        data.industry = null;
      }
    }

    const mediaValue = (cid: string, url: string): string | null | undefined => {
      if (cid.trim()) return toIpfsUri(cid.trim());
      if (url.trim()) return url.trim();
      return null;
    };
    const currentAvatar = mediaValue(formState.imageIpfsCid, formState.imageUrl);
    const initialAvatar = mediaValue(initial.imageIpfsCid, initial.imageUrl);
    if ((currentAvatar ?? '') !== (initialAvatar ?? '')) {
      data.avatar = currentAvatar;
    }
    const currentBanner = mediaValue(formState.backgroundImageIpfsCid, formState.backgroundImageUrl);
    const initialBanner = mediaValue(initial.backgroundImageIpfsCid, initial.backgroundImageUrl);
    if ((currentBanner ?? '') !== (initialBanner ?? '')) {
      data.banner = currentBanner;
    }

    if (formState.tags !== initial.tags) {
      const tags = formState.tags
        .split(',')
        .map((tag) => tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, ''))
        .filter(Boolean);
      data.tags = tags.length > 0 ? tags : initial.tags.trim() ? null : undefined;
    }

    const links: Record<string, string | null> = {};
    let linksChanged = false;
    const nextWebsite = formState.website.trim()
      ? formState.website.trim()
      : (formState.links.website?.trim() ?? '');
    const prevWebsite = initial.website.trim()
      ? initial.website.trim()
      : (initial.links.website?.trim() ?? '');
    if (nextWebsite !== prevWebsite) {
      linksChanged = true;
      links.website = nextWebsite || null;
    }
    (['twitter', 'github', 'telegram'] as const).forEach((key) => {
      const next = formState.links[key]?.trim() ?? '';
      const prev = initial.links[key]?.trim() ?? '';
      if (next !== prev) {
        linksChanged = true;
        links[key] = next || null;
      }
    });
    if (linksChanged) data.links = links;

    return data;
  }, [daoLocked, formState, getInitialState]);

  const toLocalProfile = useCallback(
    (update: ProfileUpdate): OnSocialProfile => {
      const links = { ...profile?.links };
      if (update.links) {
        Object.entries(update.links).forEach(([key, value]) => {
          if (value) links[key] = value;
          else delete links[key];
        });
      }
      const nextKind: ProfileKind | undefined = daoLocked
        ? 'dao'
        : update.kind === null
          ? undefined
          : (update.kind ?? profile?.kind);
      return {
        accountId: accountId ?? '',
        name: update.name === null ? undefined : (update.name ?? profile?.name),
        bio: update.bio === null ? undefined : (update.bio ?? profile?.bio),
        about: update.about === null ? undefined : (update.about ?? profile?.about),
        lead: update.lead === null ? undefined : (update.lead ?? profile?.lead),
        photos: update.photos === null ? undefined : (update.photos ?? profile?.photos),
        location: update.location === null ? undefined : (update.location ?? profile?.location),
        industry:
          nextKind === 'org'
            ? update.industry === null
              ? undefined
              : (update.industry ?? profile?.industry)
            : undefined,
        kind: nextKind,
        avatar: update.avatar === null ? undefined : (update.avatar ?? profile?.avatar),
        banner: update.banner === null ? undefined : (update.banner ?? profile?.banner),
        links,
        tags: update.tags === null ? undefined : (update.tags ?? profile?.tags),
      };
    },
    [accountId, daoLocked, profile]
  );

  const submitProfile = useCallback(async () => {
    if (!accountId) {
      setError('Wallet not connected');
      return false;
    }

    const update = buildUpdate();
    if (Object.keys(update).length === 0) {
      setError('No profile data to update');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setTransactionHash(null);

    try {
      applyLocalProfileUpdate(accountId, toLocalProfile(update));
      const data = buildProfileSetData(update);
      const stringData = Object.fromEntries(
        Object.entries(data).filter((entry): entry is [string, string] => entry[1] !== null)
      );
      const session = getStoredSession();
      const config = getOnSocialConfig();

      if (session?.token && session.source === 'handoff') {
        const result = await relayCoreSet(config, session.token, stringData);
        if (!result.ok) {
          throw new Error(result.message);
        }
      } else if (wallet) {
        const result = await wallet.signAndSendTransaction(
          buildCoreSetTransaction(config.coreContract, data)
        );
        const hash = result?.transaction?.hash ?? result?.transaction_outcome?.id;
        setTransactionHash(hash ?? null);
        options.onSuccess?.(hash);
        refetch();
        return true;
      }

      refetch();
      options.onSuccess?.();
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      setError(message);
      options.onError?.(err instanceof Error ? err : new Error(message));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [accountId, buildUpdate, options, refetch, toLocalProfile, wallet]);

  const hasChanges = useCallback((): boolean => {
    const initial = getInitialState();
    return (
      formState.name !== initial.name ||
      formState.bio !== initial.bio ||
      formState.about !== initial.about ||
      formState.lead !== initial.lead ||
      formState.photos.join('\0') !== initial.photos.join('\0') ||
      formState.imageUrl !== initial.imageUrl ||
      formState.imageIpfsCid !== initial.imageIpfsCid ||
      formState.backgroundImageUrl !== initial.backgroundImageUrl ||
      formState.backgroundImageIpfsCid !== initial.backgroundImageIpfsCid ||
      formState.website !== initial.website ||
      formState.location !== initial.location ||
      formState.kind !== initial.kind ||
      formState.industry !== initial.industry ||
      formState.tags !== initial.tags ||
      JSON.stringify(formState.links) !== JSON.stringify(initial.links)
    );
  }, [formState, getInitialState]);

  return {
    formState,
    updateField,
    updateLinktree: updateLink,
    updateLink,
    resetForm,
    submitProfile,
    isSubmitting,
    isLoadingProfile,
    error,
    transactionHash,
    hasChanges: hasChanges(),
    accountId,
    isConnected: Boolean(accountId),
    currentProfile: profile,
    daoLocked,
    previewAvatarUrl:
      formState.imageUrl ||
      resolveOnSocialMediaUrl(formState.imageIpfsCid ? toIpfsUri(formState.imageIpfsCid) : null),
    previewBannerUrl:
      formState.backgroundImageUrl ||
      resolveOnSocialMediaUrl(
        formState.backgroundImageIpfsCid ? toIpfsUri(formState.backgroundImageIpfsCid) : null
      ),
  };
}
