import type { Certificate } from '../types';
import { certificateReviewState, isCertificateActive } from './status';

export const VF_TRACKER_APP_ID = 'vf-tracker';
export const MS_TO_NS = 1_000_000;

/**
 * Scarces collection id for one certifier's company-review badges.
 * Global on the scarces contract, so the issuer account is in the slug.
 */
export function orgReviewCollectionId(issuerAccountId: string): string {
  const slug = issuerAccountId
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (!slug) {
    throw new Error('Issuer account required for the org-review collection.');
  }
  return `vf-org-review-${slug}`;
}

export interface OrgCertSoulboundExtra {
  vfTracker: {
    kind: 'org-cert';
    certificateId: string;
    issuerAccountId: string;
    subjectId: string;
    standard: string;
    expiresAt: string;
    evidenceCid?: string;
  };
}

export interface OrgCertSoulboundCollection {
  collectionId: string;
  title: string;
  description: string;
  transferable: false;
  renewable: true;
  burnable: true;
  appId: typeof VF_TRACKER_APP_ID;
}

export interface OrgCertSoulboundMint {
  title: string;
  description: string;
  collectionId: string;
  receiverId: string;
  appId: typeof VF_TRACKER_APP_ID;
  copies: 1;
  extra: OrgCertSoulboundExtra;
  /** NEP-177 `expires_at` — milliseconds. Collection `expiresAtMs` is shared; per-token clock uses renew. */
  expiresAtMs: number;
  /** Scarces `renew` / `renewMany` take nanoseconds since epoch. */
  expiresAtNs: number;
  mediaCid?: string;
}

export interface OrgCertSoulboundRevoke {
  tokenId: string;
  collectionId: string;
  memo: string;
}

export function assertCanMirrorOrgCert(certificate: Certificate, now = Date.now()): void {
  if (certificate.subjectType !== 'org') {
    throw new Error('Soulbound mint is for company reviews only. Lot stamps stay OnSocial certificate writes.');
  }
  if (!certificate.expiresAt) {
    throw new Error('Company review needs an expiry — that is the review clock the badge mirrors.');
  }
  const expiresAtMs = Date.parse(certificate.expiresAt);
  if (Number.isNaN(expiresAtMs)) {
    throw new Error('Company review expiry is not a date.');
  }
  if (certificateReviewState(certificate, now) === 'revoked') {
    throw new Error('Revoked reviews are not minted. Revoke the badge if one already exists.');
  }
  if (!isCertificateActive(certificate, now)) {
    throw new Error('Lapsed reviews are not minted. The old badge expires on its own clock.');
  }
}

export function buildOrgCertSoulboundCollection(issuerAccountId: string): OrgCertSoulboundCollection {
  const collectionId = orgReviewCollectionId(issuerAccountId);
  return {
    collectionId,
    title: 'VF company review',
    description:
      'Soulbound facility review. Mirrors an OnSocial org certificate. Not a product stamp. Not the vegan symbol.',
    transferable: false,
    renewable: true,
    burnable: true,
    appId: VF_TRACKER_APP_ID,
  };
}

export function buildOrgCertSoulboundMint(
  certificate: Certificate,
  now = Date.now()
): OrgCertSoulboundMint {
  assertCanMirrorOrgCert(certificate, now);
  const expiresAt = certificate.expiresAt!;
  const expiresAtMs = Date.parse(expiresAt);
  const collectionId = orgReviewCollectionId(certificate.issuerAccountId);
  const extra: OrgCertSoulboundExtra = {
    vfTracker: {
      kind: 'org-cert',
      certificateId: certificate.id,
      issuerAccountId: certificate.issuerAccountId,
      subjectId: certificate.subjectId,
      standard: certificate.standard,
      expiresAt,
      ...(certificate.evidenceCid ? { evidenceCid: certificate.evidenceCid } : {}),
    },
  };

  return {
    title: certificate.standard,
    description: `Company review of ${certificate.subjectId}. About the producer — not every SKU.`,
    collectionId,
    receiverId: certificate.subjectId,
    appId: VF_TRACKER_APP_ID,
    copies: 1,
    extra,
    expiresAtMs,
    expiresAtNs: expiresAtMs * MS_TO_NS,
    ...(certificate.evidenceCid ? { mediaCid: certificate.evidenceCid } : {}),
  };
}

function revokeMemo(reason?: string): string {
  const trimmed = reason?.trim();
  if (!trimmed) return 'Company review revoked';
  return trimmed;
}

export function buildOrgCertSoulboundRevoke(
  certificate: Certificate,
  tokenId: string
): OrgCertSoulboundRevoke {
  if (certificate.subjectType !== 'org') {
    throw new Error('Soulbound revoke is for company-review badges only.');
  }
  const trimmed = tokenId.trim();
  if (!trimmed) {
    throw new Error('Soulbound revoke needs the Scarces token id written back onto the certificate.');
  }
  return {
    tokenId: trimmed,
    collectionId: orgReviewCollectionId(certificate.issuerAccountId),
    memo: revokeMemo(certificate.revokeReason),
  };
}
