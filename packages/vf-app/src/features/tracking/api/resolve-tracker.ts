import { createGatewayOnSocialClient, createLocalOnSocialClient } from '@/features/onsocial';
import { createHttpTracker } from './http-tracker';
import { createLocalTracker } from './local-tracker';
import { isOnSocialConfigured, publicTrackerBackend } from './onsocial/config';
import { createOnSocialTracker } from './onsocial/onsocial-tracker';
import type { TrackerApi } from './tracker-api';

let localSingleton: TrackerApi | null = null;

export function getLocalTracker(): TrackerApi {
  localSingleton ??= createLocalTracker();
  return localSingleton;
}

export function getClientTracker(): TrackerApi {
  if (publicTrackerBackend() === 'onsocial') {
    return createHttpTracker();
  }
  return createOnSocialTracker(createLocalOnSocialClient());
}

export function getServerTracker(sessionToken?: string): TrackerApi {
  if (isOnSocialConfigured()) {
    return createOnSocialTracker(createGatewayOnSocialClient(sessionToken));
  }
  return createOnSocialTracker(createLocalOnSocialClient());
}
