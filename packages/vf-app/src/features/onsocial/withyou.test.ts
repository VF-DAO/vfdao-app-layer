import { describe, expect, it } from 'vitest';
import {
  buildWithYouRemoveData,
  buildWithYouSetData,
  parseWithYouTarget,
  withYouFullPath,
  withYouPath,
  withYouStatsFromRows,
} from './withyou';

describe('OnSocial with-you', () => {
  it('writes under apps/vf/withyou, not social.near', () => {
    expect(withYouPath('friend.near')).toBe('apps/vf/withyou/friend.near');
    expect(withYouFullPath('alice.near', 'friend.near')).toBe('alice.near/apps/vf/withyou/friend.near');
    expect(Object.keys(buildWithYouSetData('friend.near', { type: 'profile' }))).toEqual([
      'apps/vf/withyou/friend.near',
    ]);
    expect(buildWithYouRemoveData('friend.near')).toEqual({
      'apps/vf/withyou/friend.near': null,
    });
  });

  it('counts incoming solidarity from core paths', () => {
    const rows = [
      { path: 'alice.near/apps/vf/withyou/green-valley.near', accountId: 'alice.near' },
      { path: 'bob.near/apps/vf/withyou/green-valley.near', accountId: 'bob.near' },
      { path: 'green-valley.near/apps/vf/withyou/vegcert.near', accountId: 'green-valley.near' },
    ];
    expect(parseWithYouTarget(rows[0].path)).toEqual({
      from: 'alice.near',
      to: 'green-valley.near',
    });
    expect(withYouStatsFromRows('green-valley.near', 'alice.near', rows)).toEqual({
      withThem: 2,
      theyreWith: 1,
      imWithThem: true,
    });
  });
});
