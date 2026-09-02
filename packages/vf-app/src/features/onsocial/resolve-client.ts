import { createGatewayOnSocialClient } from './gateway-client';
import { createLocalOnSocialClient } from './local-client';
import type { OnSocialClient } from './types';
import { isOnSocialConfigured } from '@/features/tracking/api/onsocial/config';

export function resolveOnSocialClient(sessionToken?: string): OnSocialClient {
  if (isOnSocialConfigured()) {
    return createGatewayOnSocialClient(sessionToken);
  }
  return createLocalOnSocialClient();
}
