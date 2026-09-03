import { describe, expect, it } from 'vitest';
import { asListing, isListingForOrg, vfShelfCountLabel } from './listing';

describe('VF listing records', () => {
  it('treats a listed org record as promo only for that account', () => {
    expect(isListingForOrg({ orgAccountId: 'green-valley.near' }, 'green-valley.near')).toBe(true);
    expect(isListingForOrg({ orgAccountId: 'green-valley.near' }, 'cashew.near')).toBe(false);
    expect(isListingForOrg({ orgAccountId: 'green-valley.near', status: 'revoked' }, 'green-valley.near')).toBe(
      false
    );
  });

  it('reads a listed org without treating it as inventory', () => {
    expect(asListing({ orgAccountId: 'green-valley.near', listedAt: '2026-03-01T08:00:00.000Z' })).toEqual({
      orgAccountId: 'green-valley.near',
      listedAt: '2026-03-01T08:00:00.000Z',
    });
    expect(asListing({ orgAccountId: 'green-valley.near', status: 'revoked' })).toBeNull();
  });

  it('names the shelf by how many orgs are listed, not by catalogue size', () => {
    expect(vfShelfCountLabel(0)).toBe('0 on the VF shelf');
    expect(vfShelfCountLabel(1)).toBe('1 on the VF shelf');
    expect(vfShelfCountLabel(3)).toBe('3 on the VF shelf');
  });
});
