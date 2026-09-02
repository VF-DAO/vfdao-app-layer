import { describe, expect, it } from 'vitest';
import { isListingForOrg } from './listing';

describe('VF listing records', () => {
  it('treats a listed org record as promo only for that account', () => {
    expect(isListingForOrg({ orgAccountId: 'green-valley.near' }, 'green-valley.near')).toBe(true);
    expect(isListingForOrg({ orgAccountId: 'green-valley.near' }, 'cashew.near')).toBe(false);
    expect(isListingForOrg({ orgAccountId: 'green-valley.near', status: 'revoked' }, 'green-valley.near')).toBe(
      false
    );
  });
});
