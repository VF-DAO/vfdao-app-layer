'use client';

import { useWallet } from '@/features/wallet';
import { publicTrackerBackend } from '../api/onsocial/config';
import { resolveStudioActor, type StudioActor } from '../lib/studio-actor';
import { useOrgRole } from './use-tracker';

export function useStudioActor(): StudioActor {
  const { accountId } = useWallet();
  const org = useOrgRole(accountId);
  return resolveStudioActor({
    accountId,
    org: org.data,
    orgLoading: org.loading,
    backend: publicTrackerBackend(),
  });
}
