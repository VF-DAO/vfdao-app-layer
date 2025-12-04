// src/hooks/use-profile-editor.ts
import { useCallback, useEffect, useRef, useState } from 'react';
import { type ProfileUpdateData, socialDBService } from '../services/social-db';
import { useWallet } from '../features/wallet';
import { useProfile } from './use-profile';

export interface UseProfileEditorOptions {
  onSuccess?: (transactionHash?: string) => void;
  onError?: (error: Error) => void;
}

export interface ProfileEditorState {
  name: string;
  description: string;
  imageUrl: string;
  imageIpfsCid: string;
  backgroundImageUrl: string;
  backgroundImageIpfsCid: string;
  website: string;
  location: string;
  tagline: string;
  tags: string; // Comma-separated tags
  linktree: {
    twitter?: string;
    github?: string;
    telegram?: string;
    website?: string;
  };
}

export function useProfileEditor(options: UseProfileEditorOptions = {}) {
  const { wallet, accountId } = useWallet();
  const { profile, loading: isLoadingProfile, refetch } = useProfile(accountId);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transactionHash, setTransactionHash] = useState<string | null>(null);

  // Initialize form state from current profile
  const getInitialState = useCallback((): ProfileEditorState => {
    const currentProfile = profile?.profile;
    // Convert tags object to comma-separated string
    const tagsString = currentProfile?.tags 
      ? Object.keys(currentProfile.tags).join(', ')
      : '';
    return {
      name: currentProfile?.name ?? '',
      description: currentProfile?.description ?? '',
      imageUrl: currentProfile?.image?.url ?? '',
      imageIpfsCid: currentProfile?.image?.ipfs_cid ?? '',
      backgroundImageUrl: currentProfile?.backgroundImage?.url ?? '',
      backgroundImageIpfsCid: currentProfile?.backgroundImage?.ipfs_cid ?? '',
      website: currentProfile?.website ?? '',
      location: currentProfile?.location ?? '',
      tagline: currentProfile?.tagline ?? '',
      tags: tagsString,
      linktree: {
        twitter: currentProfile?.linktree?.twitter ?? '',
        github: currentProfile?.linktree?.github ?? '',
        telegram: currentProfile?.linktree?.telegram ?? '',
        website: currentProfile?.linktree?.website ?? '',
      },
    };
  }, [profile]);

  const [formState, setFormState] = useState<ProfileEditorState>(getInitialState);
  
  // Track if we've synced with profile data
  const hasSyncedProfile = useRef(false);

  // Sync form state when profile data loads for the first time
  useEffect(() => {
    if (profile && !hasSyncedProfile.current) {
      setFormState(getInitialState());
      hasSyncedProfile.current = true;
    }
  }, [profile, getInitialState]);

  // Reset form to current profile values
  const resetForm = useCallback(() => {
    setFormState(getInitialState());
    setError(null);
    setTransactionHash(null);
    hasSyncedProfile.current = true; // Mark as synced after reset
  }, [getInitialState]);

  // Update a single field
  const updateField = useCallback(<K extends keyof ProfileEditorState>(
    field: K,
    value: ProfileEditorState[K]
  ) => {
    setFormState(prev => ({ ...prev, [field]: value }));
  }, []);

  // Update linktree field
  const updateLinktree = useCallback((
    platform: keyof ProfileEditorState['linktree'],
    value: string
  ) => {
    setFormState(prev => ({
      ...prev,
      linktree: { ...prev.linktree, [platform]: value },
    }));
  }, []);

  // Build profile update data from form state
  // Social DB uses MERGE - only send changed fields
  // Send null to DELETE a field, string to ADD/UPDATE
  const buildProfileData = useCallback((): ProfileUpdateData => {
    const data: ProfileUpdateData = {};
    const initial = getInitialState();

    // Helper to check if field changed and return value or null for deletion
    const getFieldUpdate = (current: string, original: string): string | null | undefined => {
      const trimmedCurrent = current.trim();
      const trimmedOriginal = original.trim();
      
      if (trimmedCurrent === trimmedOriginal) return undefined; // No change
      if (trimmedCurrent) return trimmedCurrent; // Updated value
      if (trimmedOriginal) return null; // Was set, now empty = delete
      return undefined; // Both empty, no change
    };

    // Only include fields that changed
    const nameUpdate = getFieldUpdate(formState.name, initial.name);
    if (nameUpdate !== undefined) data.name = nameUpdate;
    
    const descUpdate = getFieldUpdate(formState.description, initial.description);
    if (descUpdate !== undefined) data.description = descUpdate;
    
    const websiteUpdate = getFieldUpdate(formState.website, initial.website);
    if (websiteUpdate !== undefined) data.website = websiteUpdate;
    
    const locationUpdate = getFieldUpdate(formState.location, initial.location);
    if (locationUpdate !== undefined) data.location = locationUpdate;
    
    const taglineUpdate = getFieldUpdate(formState.tagline, initial.tagline);
    if (taglineUpdate !== undefined) data.tagline = taglineUpdate;

    // Handle image - check if changed
    const currentImageKey = formState.imageIpfsCid.trim() || formState.imageUrl.trim();
    const initialImageKey = initial.imageIpfsCid.trim() || initial.imageUrl.trim();
    
    if (currentImageKey !== initialImageKey) {
      if (formState.imageIpfsCid.trim()) {
        data.image = { ipfs_cid: formState.imageIpfsCid.trim() };
      } else if (formState.imageUrl.trim()) {
        data.image = { url: formState.imageUrl.trim() };
      } else if (initialImageKey) {
        // Had image, now cleared = delete
        data.image = null;
      }
    }

    // Handle background image - check if changed
    const currentBgKey = formState.backgroundImageIpfsCid.trim() || formState.backgroundImageUrl.trim();
    const initialBgKey = initial.backgroundImageIpfsCid.trim() || initial.backgroundImageUrl.trim();
    
    if (currentBgKey !== initialBgKey) {
      if (formState.backgroundImageIpfsCid.trim()) {
        data.backgroundImage = { ipfs_cid: formState.backgroundImageIpfsCid.trim() };
      } else if (formState.backgroundImageUrl.trim()) {
        data.backgroundImage = { url: formState.backgroundImageUrl.trim() };
      } else if (initialBgKey) {
        // Had bg image, now cleared = delete
        data.backgroundImage = null;
      }
    }

    // Handle tags - only if changed
    if (formState.tags !== initial.tags) {
      if (formState.tags.trim()) {
        const tagsObject: Record<string, string> = {};
        formState.tags.split(',').forEach(tag => {
          const trimmedTag = tag.trim().toLowerCase().replace(/[^a-z0-9-_]/g, '');
          if (trimmedTag) {
            tagsObject[trimmedTag] = '';
          }
        });
        if (Object.keys(tagsObject).length > 0) {
          data.tags = tagsObject;
        }
      } else if (initial.tags.trim()) {
        // Had tags, now empty = delete
        data.tags = null;
      }
    }

    // Handle linktree - only include changed values
    const linktreeUpdate: Record<string, string | null> = {};
    let hasLinktreeChanges = false;
    
    Object.entries(formState.linktree).forEach(([key, value]) => {
      const initialValue = initial.linktree[key as keyof typeof initial.linktree] ?? '';
      const currentValue = value?.trim() ?? '';
      const originalValue = initialValue?.trim() ?? '';
      
      if (currentValue !== originalValue) {
        hasLinktreeChanges = true;
        if (currentValue) {
          linktreeUpdate[key] = currentValue;
        } else if (originalValue) {
          // Was set, now empty = delete
          linktreeUpdate[key] = null;
        }
      }
    });
    
    if (hasLinktreeChanges) {
      data.linktree = linktreeUpdate;
    }

    return data;
  }, [formState, getInitialState]);

  // Submit profile update
  const submitProfile = useCallback(async () => {
    if (!wallet || !accountId) {
      setError('Wallet not connected');
      return false;
    }

    setIsSubmitting(true);
    setError(null);
    setTransactionHash(null);

    try {
      const profileData = buildProfileData();
      
      if (Object.keys(profileData).length === 0) {
        setError('No profile data to update');
        setIsSubmitting(false);
        return false;
      }

      const transactionParams = socialDBService.buildSetProfileTransaction(
        accountId,
        profileData
      );

      const result = await wallet.signAndSendTransaction(transactionParams);
      
      // Extract transaction hash
      const hash = result?.transaction?.hash ?? result?.transaction_outcome?.id;
      setTransactionHash(hash);

      // Refetch profile to get updated data
      refetch();

      options.onSuccess?.(hash);
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update profile';
      setError(errorMessage);
      options.onError?.(err instanceof Error ? err : new Error(errorMessage));
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [wallet, accountId, buildProfileData, refetch, options]);

  // Check if form has changes
  const hasChanges = useCallback((): boolean => {
    const initial = getInitialState();
    return (
      formState.name !== initial.name ||
      formState.description !== initial.description ||
      formState.imageUrl !== initial.imageUrl ||
      formState.imageIpfsCid !== initial.imageIpfsCid ||
      formState.backgroundImageUrl !== initial.backgroundImageUrl ||
      formState.backgroundImageIpfsCid !== initial.backgroundImageIpfsCid ||
      formState.website !== initial.website ||
      formState.location !== initial.location ||
      formState.tagline !== initial.tagline ||
      formState.tags !== initial.tags ||
      JSON.stringify(formState.linktree) !== JSON.stringify(initial.linktree)
    );
  }, [formState, getInitialState]);

  return {
    // Form state
    formState,
    updateField,
    updateLinktree,
    resetForm,
    
    // Submission
    submitProfile,
    isSubmitting,
    isLoadingProfile,
    
    // Status
    error,
    transactionHash,
    hasChanges: hasChanges(),
    
    // User info
    accountId,
    isConnected: !!accountId,
    currentProfile: profile,
  };
}
