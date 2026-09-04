import type { Certificate, EventKind } from '../types';

export function isCertificateActive(certificate: Certificate, now = Date.now()): boolean {
  if (certificate.status !== 'active') return false;
  if (!certificate.expiresAt) return true;
  return Date.parse(certificate.expiresAt) > now;
}

export function orgCertificatesFor(certificates: Certificate[], accountId: string): Certificate[] {
  return certificates
    .filter((certificate) => certificate.subjectType === 'org' && certificate.subjectId === accountId)
    .sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt));
}

export function certificateUntilLabel(certificate: Certificate): string | null {
  if (!certificate.expiresAt) return null;
  const day = new Date(certificate.expiresAt).toLocaleDateString();
  return isCertificateActive(certificate) ? `Until ${day}` : `Review lapsed ${day}`;
}

export function assertOrgCertificateExpiry(subjectType: Certificate['subjectType'], expiresAt?: string): void {
  if (subjectType === 'org' && !expiresAt) {
    throw new Error('Company review needs an expiry — that is the review clock.');
  }
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
