import type { Certificate, ChainEvent, EventKind } from '../types';
import { EVENT_KINDS } from '../types';

export interface VerificationStatus {
  label: 'Verified vegan' | 'In progress' | 'Unverified' | 'Certificate expired';
  tone: 'verified' | 'primary' | 'muted' | 'orange';
  completedKinds: EventKind[];
}

export function isCertificateActive(certificate: Certificate, now = Date.now()): boolean {
  if (certificate.status !== 'active') return false;
  if (!certificate.expiresAt) return true;
  return Date.parse(certificate.expiresAt) > now;
}

export function deriveVerificationStatus(
  events: ChainEvent[],
  certificates: Certificate[],
  now = Date.now()
): VerificationStatus {
  const completedKinds = EVENT_KINDS.filter((kind) => events.some((event) => event.kind === kind));
  const activeCerts = certificates.filter((certificate) => isCertificateActive(certificate, now));
  const hasExpiredOnly =
    certificates.length > 0 &&
    activeCerts.length === 0 &&
    certificates.every((certificate) => certificate.status === 'expired' || Boolean(certificate.expiresAt));

  if (activeCerts.length > 0 && completedKinds.includes('certified')) {
    return { label: 'Verified vegan', tone: 'verified', completedKinds };
  }
  if (hasExpiredOnly) {
    return { label: 'Certificate expired', tone: 'orange', completedKinds };
  }
  if (completedKinds.length > 0) {
    return { label: 'In progress', tone: 'primary', completedKinds };
  }
  return { label: 'Unverified', tone: 'muted', completedKinds };
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
