export const ORG_ROLES = ['producer', 'processor', 'certifier', 'retailer', 'consumer'] as const;
export type OrgRole = (typeof ORG_ROLES)[number];

export const EVENT_KINDS = [
  'sourced',
  'tested',
  'certified',
  'packed',
  'shipped',
  'received',
] as const;
export type EventKind = (typeof EVENT_KINDS)[number];

export const CERTIFICATE_STATUSES = ['active', 'revoked', 'expired'] as const;
export type CertificateStatus = (typeof CERTIFICATE_STATUSES)[number];

export const CERTIFICATE_SUBJECT_TYPES = ['org', 'lot', 'product'] as const;
export type CertificateSubjectType = (typeof CERTIFICATE_SUBJECT_TYPES)[number];

export interface Org {
  accountId: string;
  name: string;
  role: OrgRole;
  status: 'active' | 'suspended';
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  description: string;
  ingredients: string[];
  claims: string[];
  imageUrl?: string;
  producerAccountId: string;
  createdAt: string;
}

export interface Lot {
  id: string;
  productId: string;
  label: string;
  harvestedAt: string;
  quantity: string;
  site: string;
  producerAccountId: string;
  createdAt: string;
}

export interface ChainEvent {
  id: string;
  lotId: string;
  kind: EventKind;
  at: string;
  note: string;
  orgAccountId: string;
  mediaCid?: string;
}

export interface Certificate {
  id: string;
  subjectType: CertificateSubjectType;
  subjectId: string;
  standard: string;
  issuerAccountId: string;
  issuedAt: string;
  expiresAt?: string;
  status: CertificateStatus;
  evidenceCid?: string;
  revokeReason?: string;
}

export interface ScanRecord {
  id: string;
  code: string;
  lotId: string;
  productId: string;
  scannedAt: string;
  accountId?: string;
}

export interface Listing {
  orgAccountId: string;
  listedAt: string;
}

export interface LotBundle {
  lot: Lot;
  product: Product;
  events: ChainEvent[];
  certificates: Certificate[];
  /** Company review of the producer. Not a stamp on this lot. */
  orgCertificates?: Certificate[];
  producer?: Org;
  /** VF shelf promo only. Unlisted lots still resolve. */
  vfListed?: boolean;
}

export interface RegisterProductInput {
  name: string;
  brand: string;
  description: string;
  ingredients: string[];
  claims: string[];
  imageUrl?: string;
  producerAccountId: string;
}

export interface CreateLotInput {
  productId: string;
  label: string;
  harvestedAt: string;
  quantity: string;
  site: string;
  producerAccountId: string;
}

export interface AddEventInput {
  lotId: string;
  kind: EventKind;
  note: string;
  orgAccountId: string;
  at?: string;
  mediaCid?: string;
}

export interface IssueCertificateInput {
  subjectType: CertificateSubjectType;
  subjectId: string;
  standard: string;
  issuerAccountId: string;
  expiresAt?: string;
  evidenceCid?: string;
}

export interface RevokeCertificateInput {
  certificateId: string;
  issuerAccountId: string;
  revokeReason: string;
}

/** Computed review clock. `status` stays `active` until the issuer revokes. */
export type CertificateReviewState = 'active' | 'due' | 'lapsed' | 'revoked';

export interface RecordScanInput {
  code: string;
  lotId: string;
  productId: string;
  accountId?: string;
}

/** Product or lot only. Orgs use protocol standing, not sprouts. */
export const VOICE_SUBJECT_TYPES = ['product', 'lot'] as const;
export type VoiceSubjectType = (typeof VOICE_SUBJECT_TYPES)[number];

export interface Sprout {
  id: string;
  subjectType: VoiceSubjectType;
  subjectId: string;
  accountId: string;
  at: string;
}

export interface Note {
  id: string;
  subjectType: VoiceSubjectType;
  subjectId: string;
  parentId?: string;
  body: string;
  accountId: string;
  at: string;
}

export interface SproutStats {
  subjectType: VoiceSubjectType;
  subjectId: string;
  count: number;
  viewerSprouted: boolean;
}

export interface ToggleSproutInput {
  subjectType: VoiceSubjectType;
  subjectId: string;
  accountId: string;
}

export interface AddNoteInput {
  subjectType: VoiceSubjectType;
  subjectId: string;
  accountId: string;
  body: string;
  parentId?: string;
}

export type TrackerBackend = 'local' | 'onsocial';

export interface TrackerStatus {
  backend: TrackerBackend;
  appId: string;
  coreContract: string;
  gatewayUrl: string;
  usingOnApi: boolean;
  needsSession: boolean;
  note: string;
}
