import { describe, expect, it } from 'vitest';
import { cidFromMediaRef, resolveOnSocialMediaUrl, toIpfsUri } from './media';
import {
  buildProfileSetData,
  editorFaceKind,
  isDaoAccount,
  materializeProfile,
  profileAvatarShapeForAccount,
  profileFromCurrentRows,
  profileOrgLineLabel,
  resolveDisplayProfileKind,
} from './profile';

describe('OnSocial profile face', () => {
  it('treats omit and person as a circle, org as a squircle, dao as a square', () => {
    expect(profileAvatarShapeForAccount(undefined, 'alice.near')).toBe('circle');
    expect(profileAvatarShapeForAccount('person', 'alice.near')).toBe('circle');
    expect(profileAvatarShapeForAccount('org', 'green-valley.near')).toBe('squircle');
    expect(profileAvatarShapeForAccount('person', 'vegan-friends.sputnik-dao.near')).toBe('square');
  });

  it('does not let a stored person kind override a DAO workspace', () => {
    expect(resolveDisplayProfileKind('person', true)).toBe('dao');
    expect(editorFaceKind('dao')).toBe('person');
    expect(isDaoAccount('vegan-friends.sputnik-dao.near')).toBe(true);
  });

  it('builds slash-key Set data matching os.profiles.update', () => {
    expect(
      buildProfileSetData({
        name: 'Green Valley Farms',
        kind: 'org',
        industry: 'Agriculture',
        bio: null,
      })
    ).toEqual({
      'profile/name': 'Green Valley Farms',
      'profile/kind': 'org',
      'profile/industry': 'Agriculture',
      'profile/bio': null,
    });
  });

  it('materializes profilesCurrent field rows', () => {
    const profile = profileFromCurrentRows('green-valley.near', [
      { accountId: 'green-valley.near', field: 'name', value: 'Green Valley Farms' },
      { accountId: 'green-valley.near', field: 'kind', value: 'org' },
      { accountId: 'green-valley.near', field: 'industry', value: 'Agriculture' },
      { accountId: 'green-valley.near', field: 'links', value: '{"website":"https://greenvalley.example"}' },
    ]);
    expect(profile).toMatchObject({
      accountId: 'green-valley.near',
      name: 'Green Valley Farms',
      kind: 'org',
      industry: 'Agriculture',
      links: { website: 'https://greenvalley.example' },
    });
    expect(profileOrgLineLabel(profile?.industry)).toBe('Agriculture');
    expect(materializeProfile('x.near', {}).kind).toBeUndefined();
  });

  it('resolves ipfs avatar refs through the OnSocial CDN', () => {
    expect(cidFromMediaRef('ipfs://bafytestcid')).toBe('bafytestcid');
    expect(toIpfsUri('bafytestcid')).toBe('ipfs://bafytestcid');
    expect(resolveOnSocialMediaUrl('ipfs://bafytestcid')).toBe('https://cdn.onsocial.id/ipfs/bafytestcid');
    expect(resolveOnSocialMediaUrl('https://example.com/pic.png')).toBe('https://example.com/pic.png');
  });
});
