'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useWallet } from '@/features/wallet';
import { ProfileView } from '@/features/profile/components/ProfileView';

/**
 * My Profile Page
 * Shows the current user's profile
 * Redirects to home if not connected
 */
export default function MyProfilePage() {
  const router = useRouter();
  const { accountId, isConnected } = useWallet();

  // Redirect to home if not connected
  useEffect(() => {
    if (!isConnected) {
      router.push('/');
    }
  }, [isConnected, router]);

  // Show nothing while redirecting to avoid flash of content
  if (!isConnected || !accountId) {
    return null;
  }

  return <ProfileView accountId={accountId} isOwnProfile={true} />;
}
