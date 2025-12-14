'use client';

import { use } from 'react';
import { ProfileView } from '@/features/profile/components/ProfileView';
import { useWallet } from '@/features/wallet';

interface ProfilePageProps {
  params: Promise<{ id: string }>;
}

/**
 * Public Profile Page
 * Shows any user's profile by their account ID
 */
export default function ProfilePage({ params }: ProfilePageProps) {
  const { id } = use(params);
  const { accountId } = useWallet();
  
  // Decode the account ID from URL (handles special characters)
  const profileAccountId = decodeURIComponent(id);
  const isOwnProfile = accountId === profileAccountId;

  return <ProfileView accountId={profileAccountId} isOwnProfile={isOwnProfile} />;
}
