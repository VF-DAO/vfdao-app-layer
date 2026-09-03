import { DEFAULT_APP_ID, normalizeAppId } from '@/features/tracking/api/onsocial/paths';
import type { OnSocialSession } from './types';

const STORAGE_KEY = 'vf.onsocial.session.v1';

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

export function getStoredSession(): OnSocialSession | null {
  if (!canUseStorage()) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as OnSocialSession;
    return parsed.token && parsed.appId ? parsed : null;
  } catch {
    return null;
  }
}

export function storeSession(session: OnSocialSession): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
}

export function clearSession(): void {
  if (!canUseStorage()) return;
  window.localStorage.removeItem(STORAGE_KEY);
}

export function ensureLocalSession(appId = DEFAULT_APP_ID): OnSocialSession {
  const existing = getStoredSession();
  if (existing) return existing;
  const session: OnSocialSession = {
    token: `local.${normalizeAppId(appId)}`,
    appId: normalizeAppId(appId),
    source: 'local',
  };
  storeSession(session);
  return session;
}

/**
 * Matches os.auth.completeAppHandoff({ appId }).
 * Until @onsocial/sdk ships, a local session keeps the same write path.
 * A real portal return can pass ?os_handoff=<token>.
 */
export async function completeAppHandoff(input: {
  appId?: string;
  osOrigin?: string;
}): Promise<OnSocialSession> {
  const appId = normalizeAppId(input.appId ?? DEFAULT_APP_ID);
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('os_handoff') ?? params.get('handoff');
    if (token) {
      const session: OnSocialSession = { token, appId, source: 'handoff' };
      storeSession(session);
      return session;
    }
  }
  return ensureLocalSession(appId);
}
