import { describe, expect, it } from 'vitest';
import {
  buildStandingRemoveData,
  buildStandingSetData,
  parseStandingEdge,
  standingFullPath,
  standingPath,
  standingStatsFromRows,
} from './standing';

describe('OnSocial standing', () => {
  it('writes standing/{to} next to profile, not apps/vf or social.near', () => {
    expect(standingPath('friend.near')).toBe('standing/friend.near');
    expect(standingFullPath('alice.near', 'friend.near')).toBe('alice.near/standing/friend.near');
    expect(buildStandingSetData('friend.near', 77)).toEqual({
      'standing/friend.near': '{"v":1,"since":77}',
    });
    expect(buildStandingRemoveData('friend.near')).toEqual({
      'standing/friend.near': null,
    });
  });

  it('rejects the retired withyou path', () => {
    expect(parseStandingEdge('alice.near/apps/vf/withyou/green-valley.near')).toEqual({});
    expect(parseStandingEdge('alice.near/standing/green-valley.near')).toEqual({
      from: 'alice.near',
      to: 'green-valley.near',
    });
  });

  it('counts incoming and outgoing edges from protocol paths', () => {
    const rows = [
      { path: 'alice.near/standing/green-valley.near', accountId: 'alice.near' },
      { path: 'bob.near/standing/green-valley.near', accountId: 'bob.near' },
      { path: 'green-valley.near/standing/vegcert.near', accountId: 'green-valley.near' },
    ];
    expect(standingStatsFromRows('green-valley.near', 'alice.near', rows)).toEqual({
      incoming: 2,
      outgoing: 1,
      viewerStandsWith: true,
    });
  });
});
