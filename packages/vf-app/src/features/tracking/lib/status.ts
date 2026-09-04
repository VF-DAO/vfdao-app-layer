import type { Certificate, CertificateReviewState, EventKind } from '../types';

/** Company reviews in this window are due, not just active. */
export const REVIEW_DUE_WITHIN_MS = 30 * 24 * 60 * 60 * 1000;

export function isCertificateActive(certificate: Certificate, now = Date.now()): boolean {
  const state = certificateReviewState(certificate, now);
  return state === 'active' || state === 'due';
}

export function certificateReviewState(
  certificate: Certificate,
  now = Date.now(),
  dueWithinMs = REVIEW_DUE_WITHIN_MS
): CertificateReviewState {
  if (certificate.status === 'revoked') return 'revoked';
  if (certificate.status === 'expired') return 'lapsed';
  if (!certificate.expiresAt) return 'active';
  const expiresAt = Date.parse(certificate.expiresAt);
  if (Number.isNaN(expiresAt) || expiresAt <= now) return 'lapsed';
  if (expiresAt - now <= dueWithinMs) return 'due';
  return 'active';
}

export function certificateStateLabel(
  state: CertificateReviewState,
  subjectType: Certificate['subjectType'] = 'org'
): string {
  if (state === 'revoked') return 'Revoked';
  if (state === 'lapsed') return subjectType === 'org' ? 'Lapsed' : 'Expired';
  if (state === 'due') return 'Due';
  return 'Active';
}

export function orgCertificatesFor(certificates: Certificate[], accountId: string): Certificate[] {
  return certificates
    .filter((certificate) => certificate.subjectType === 'org' && certificate.subjectId === accountId)
    .sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt));
}

export function certificateUntilLabel(certificate: Certificate, now = Date.now()): string | null {
  const state = certificateReviewState(certificate, now);
  if (state === 'revoked') {
    return certificate.revokeReason ? `Revoked — ${certificate.revokeReason}` : 'Revoked';
  }
  if (!certificate.expiresAt) return null;
  const day = new Date(certificate.expiresAt).toLocaleDateString();
  if (state === 'lapsed') return `Review lapsed ${day}`;
  if (state === 'due') return `Due ${day}`;
  return `Until ${day}`;
}

export function assertOrgCertificateExpiry(subjectType: Certificate['subjectType'], expiresAt?: string): void {
  if (subjectType === 'org' && !expiresAt) {
    throw new Error('Company review needs an expiry — that is the review clock.');
  }
}

export function assertRevokeReason(reason?: string): string {
  const trimmed = reason?.trim() ?? '';
  if (!trimmed) {
    throw new Error('Revoke needs a reason.');
  }
  return trimmed;
}

export interface CertificateReviewGroups {
  due: Certificate[];
  active: Certificate[];
  lapsed: Certificate[];
  revoked: Certificate[];
}

export function groupCertificatesByReview(
  certificates: Certificate[],
  now = Date.now()
): CertificateReviewGroups {
  const groups: CertificateReviewGroups = { due: [], active: [], lapsed: [], revoked: [] };
  for (const certificate of certificates) {
    groups[certificateReviewState(certificate, now)].push(certificate);
  }
  return groups;
}

export function eventKindLabel(kind: EventKind): string {
  const labels: Record<EventKind, string> = {
    sourced: 'Source',
    tested: 'Test',
    certified: 'Certify',
    packed: 'Record',
    shipped: 'Track',
    received: 'Scan',
  };
  return labels[kind];
}
