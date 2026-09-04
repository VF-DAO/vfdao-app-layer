import type { Listing } from '../types';

export function asListing(value: unknown): Listing | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  if (typeof record.orgAccountId !== 'string' || !record.orgAccountId) {
    return null;
  }
  if (record.status === 'revoked') {
    return null;
  }
  return {
    orgAccountId: record.orgAccountId,
    listedAt: typeof record.listedAt === 'string' ? record.listedAt : '',
  };
}

export function isListingForOrg(value: unknown, accountId: string): boolean {
  return asListing(value)?.orgAccountId === accountId;
}
