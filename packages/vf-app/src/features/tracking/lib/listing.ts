export function isListingForOrg(value: unknown, accountId: string): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  if (record.orgAccountId === accountId) {
    return record.status !== 'revoked';
  }
  return false;
}
