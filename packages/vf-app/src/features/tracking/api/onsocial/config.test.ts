import { afterEach, describe, expect, it, vi } from 'vitest';
import { allowTrackerFixtures, isOnSocialConfigured } from './config';

describe('allowTrackerFixtures', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('stays on when OnSocial is not configured', () => {
    vi.stubEnv('ONSOCIAL_API_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_BACKEND', 'local');
    expect(isOnSocialConfigured()).toBe(false);
    expect(allowTrackerFixtures()).toBe(true);
  });

  it('turns off when an OnAPI key is set', () => {
    vi.stubEnv('ONSOCIAL_API_KEY', 'test-key');
    expect(isOnSocialConfigured()).toBe(true);
    expect(allowTrackerFixtures()).toBe(false);
  });

  it('turns off when the public backend is onsocial', () => {
    vi.stubEnv('ONSOCIAL_API_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_BACKEND', 'onsocial');
    expect(isOnSocialConfigured()).toBe(true);
    expect(allowTrackerFixtures()).toBe(false);
  });

  it('honors TRACKER_ALLOW_FIXTURES overrides', () => {
    vi.stubEnv('ONSOCIAL_API_KEY', 'test-key');
    vi.stubEnv('TRACKER_ALLOW_FIXTURES', '1');
    expect(allowTrackerFixtures()).toBe(true);

    vi.stubEnv('ONSOCIAL_API_KEY', '');
    vi.stubEnv('NEXT_PUBLIC_TRACKER_BACKEND', 'local');
    vi.stubEnv('TRACKER_ALLOW_FIXTURES', '0');
    expect(allowTrackerFixtures()).toBe(false);
  });
});
