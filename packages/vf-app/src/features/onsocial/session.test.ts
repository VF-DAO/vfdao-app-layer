import { beforeEach, describe, expect, it } from 'vitest';
import { completeAppHandoff, ensureLocalSession, getStoredSession } from './session';

describe('OnSocial session handoff', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.history.replaceState({}, '', '/');
  });

  it('creates a local session token until the SDK ships', () => {
    const session = ensureLocalSession('vf-tracker');
    expect(session).toEqual({
      token: 'local.vf-tracker',
      appId: 'vf-tracker',
      source: 'local',
    });
    expect(getStoredSession()).toEqual(session);
  });

  it('stores a portal token from ?os_handoff=', async () => {
    window.history.replaceState({}, '', '/?os_handoff=portal-token');
    const session = await completeAppHandoff({ appId: 'vf-tracker' });
    expect(session).toEqual({
      token: 'portal-token',
      appId: 'vf-tracker',
      source: 'handoff',
    });
    expect(getStoredSession()?.token).toBe('portal-token');
  });
});
