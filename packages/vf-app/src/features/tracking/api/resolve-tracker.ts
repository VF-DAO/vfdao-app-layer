import type { TrackerApi } from './tracker-api';
import { createLocalTracker } from './local-tracker';
import { createHttpTracker } from './http-tracker';
import { createOnSocialTracker } from './onsocial/onsocial-tracker';
import { isOnSocialConfigured, publicTrackerBackend } from './onsocial/config';

let localSingleton: TrackerApi | null = null;

export function getLocalTracker(): TrackerApi {
  localSingleton ??= createLocalTracker();
  return localSingleton;
}

export function getClientTracker(): TrackerApi {
  if (publicTrackerBackend() === 'onsocial') {
    return createHttpTracker();
  }
  return getLocalTracker();
}

export function getServerTracker(sessionToken?: string): TrackerApi {
  if (isOnSocialConfigured()) {
    return createOnSocialTracker(sessionToken);
  }
  return getLocalTracker();
}
