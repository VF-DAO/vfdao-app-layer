import type { OnSocialClient } from '@/features/onsocial';
import { createId } from '../../lib/ids';
import { parseScanCode } from '../../lib/qr';
import { assertOrgCertificateExpiry, assertRevokeReason } from '../../lib/status';
import {
  canCreateLot,
  canIssueCertificate,
  canRecordEvent,
  canRegisterProduct,
} from '../../lib/roles';
import type {
  AddEventInput,
  AddNoteInput,
  Certificate,
  ChainEvent,
  CreateLotInput,
  IssueCertificateInput,
  Listing,
  Lot,
  LotBundle,
  Note,
  Org,
  Product,
  RecordScanInput,
  RegisterProductInput,
  RevokeCertificateInput,
  ScanRecord,
  Sprout,
  SproutStats,
  ToggleSproutInput,
  TrackerStatus,
  VoiceSubjectType,
} from '../../types';
import {
  certificatesForAccount,
  eventsForAccount,
  lotsForAccount,
  productsForAccount,
} from '../../lib/desk';
import { asListing, isListingForOrg } from '../../lib/listing';
import {
  assertVoiceSubjectType,
  isVoiceSubjectType,
  normalizeNoteBody,
  sproutRecordId,
} from '../../lib/voice';
import { cloneFixtures } from '../fixtures';
import { createLocalTracker } from '../local-tracker';
import type { TrackerApi } from '../tracker-api';
import { allowTrackerFixtures, getOnSocialConfig, isOnSocialConfigured } from './config';
import { coreSetPayload, kindFromPath, recordPath } from './paths';

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function asProduct(value: unknown): Product | null {
  const record = asRecord(value);
  if (!record || typeof record.id !== 'string' || typeof record.name !== 'string') return null;
  return record as unknown as Product;
}

function asLot(value: unknown): Lot | null {
  const record = asRecord(value);
  if (!record || typeof record.id !== 'string' || typeof record.productId !== 'string') return null;
  return record as unknown as Lot;
}

function asEvent(value: unknown): ChainEvent | null {
  const record = asRecord(value);
  if (!record || typeof record.id !== 'string' || typeof record.lotId !== 'string') return null;
  return record as unknown as ChainEvent;
}

function asCertificate(value: unknown): Certificate | null {
  const record = asRecord(value);
  if (!record || typeof record.id !== 'string' || typeof record.subjectId !== 'string') return null;
  return record as unknown as Certificate;
}

function asOrg(value: unknown): Org | null {
  const record = asRecord(value);
  if (!record || typeof record.accountId !== 'string') return null;
  return record as unknown as Org;
}

function asScan(value: unknown): ScanRecord | null {
  const record = asRecord(value);
  if (!record || typeof record.id !== 'string' || typeof record.lotId !== 'string') return null;
  return record as unknown as ScanRecord;
}

function asSprout(value: unknown): Sprout | null {
  const record = asRecord(value);
  if (
    !record ||
    typeof record.id !== 'string' ||
    typeof record.subjectId !== 'string' ||
    typeof record.accountId !== 'string' ||
    !isVoiceSubjectType(record.subjectType)
  ) {
    return null;
  }
  return record as unknown as Sprout;
}

function asNote(value: unknown): Note | null {
  const record = asRecord(value);
  if (
    !record ||
    typeof record.id !== 'string' ||
    typeof record.subjectId !== 'string' ||
    typeof record.accountId !== 'string' ||
    typeof record.body !== 'string' ||
    !isVoiceSubjectType(record.subjectType)
  ) {
    return null;
  }
  return record as unknown as Note;
}

export function createOnSocialTracker(client: OnSocialClient): TrackerApi {
  const config = getOnSocialConfig();
  const local = createLocalTracker();
  const live = isOnSocialConfigured();
  const allowFixtures = allowTrackerFixtures();

  async function firstOrFixture<T>(
    found: T | null | undefined,
    load: () => Promise<T | null>
  ): Promise<T | null> {
    if (found) return found;
    return allowFixtures ? load() : null;
  }

  async function listOrFixture<T>(found: T[], load: () => Promise<T[]>): Promise<T[]> {
    if (found.length > 0) return found;
    return allowFixtures ? load() : [];
  }

  async function readCatch<T>(
    error: unknown,
    load: () => Promise<T>,
    empty: T,
    label: string
  ): Promise<T> {
    if (allowFixtures) {
      console.warn(`[tracking] OnSocial ${label} fell back to local fixtures`, error);
      return load();
    }
    console.warn(`[tracking] OnSocial ${label} failed; not using fixtures`, error);
    return empty;
  }

  async function write(path: string, value: unknown): Promise<void> {
    const payload = coreSetPayload(path, value);
    const result = await client.set(payload.data);
    if (!result.ok) {
      throw new Error(result.message);
    }
  }

  async function requireOrg(
    accountId: string,
    allowed: (role: Org['role'] | null | undefined) => boolean,
    message: string
  ): Promise<Org> {
    const row = await client.queryByPath(recordPath('org', accountId, config.appId));
    const org = asOrg(row?.value) ?? (allowFixtures ? await local.getOrg(accountId) : null);
    if (!org || !allowed(org.role)) {
      throw new Error(message);
    }
    return org;
  }

  async function findCertificate(certificateId: string): Promise<Certificate | null> {
    try {
      const byPath = await client.queryByPath(recordPath('certificate', certificateId, config.appId));
      const fromPath = asCertificate(byPath?.value);
      if (fromPath?.id === certificateId) return fromPath;
      const rows = await client.queryByJsonContains({ id: certificateId });
      const fromRows = rows
        .map((row) => asCertificate(row.value))
        .find((item) => item?.id === certificateId);
      if (fromRows) return fromRows;
    } catch (error) {
      console.warn('[tracking] OnSocial certificate lookup failed', error);
    }
    if (!allowFixtures) return null;
    return cloneFixtures().certificates.find((item) => item.id === certificateId) ?? null;
  }

  async function isVfListed(accountId: string): Promise<boolean> {
    try {
      const row = await client.queryByPath(recordPath('listed', accountId, config.appId));
      if (isListingForOrg(row?.value, accountId)) {
        return true;
      }
      const rows = await client.queryByJsonContains({ orgAccountId: accountId });
      if (
        rows.some(
          (item) => kindFromPath(item.path) === 'listed' && isListingForOrg(item.value, accountId)
        )
      ) {
        return true;
      }
      if (!allowFixtures) {
        return false;
      }
    } catch {
      if (!allowFixtures) {
        return false;
      }
    }
    return cloneFixtures().listings.some((listing) => listing.orgAccountId === accountId);
  }

  return {
    async status(): Promise<TrackerStatus> {
      return {
        backend: live ? 'onsocial' : 'local',
        appId: config.appId,
        coreContract: config.coreContract,
        gatewayUrl: config.gatewayUrl,
        usingOnApi: Boolean(config.apiKey),
        needsSession: live && !client.session?.token,
        note: live
          ? client.session?.token
            ? 'Writes go to OnSocial core with a session key. Users do not sign every product or scan.'
            : allowFixtures
              ? 'Reads can use OnAPI. Fixtures stay on (TRACKER_ALLOW_FIXTURES). Writes wait for an OnSocial portal session so the app can be listed.'
              : 'Reads can use OnAPI. Missing lots stay missing; fixtures are off. Writes wait for an OnSocial portal session so the app can be listed.'
          : allowFixtures
            ? 'Local OnSocial seam. Same Set and query path as core; swap the client when the SDK ships.'
            : 'Local OnSocial seam. Fixtures are off. Missing lots stay missing.',
      };
    },

    async listProducts(): Promise<Product[]> {
      try {
        const rows = await client.queryByPrefix('product');
        const products = rows.map((row) => asProduct(row.value)).filter((item): item is Product => Boolean(item));
        return listOrFixture(products, () => local.listProducts());
      } catch (error) {
        return readCatch(error, () => local.listProducts(), [], 'product list');
      }
    },

    async listProductsForAccount(accountId: string): Promise<Product[]> {
      try {
        const rows = await client.queryByJsonContains({ producerAccountId: accountId });
        const products = productsForAccount(
          rows
            .filter((row) => kindFromPath(row.path) === 'product')
            .map((row) => asProduct(row.value))
            .filter((item): item is Product => Boolean(item)),
          accountId
        );
        return listOrFixture(products, () => local.listProductsForAccount(accountId));
      } catch (error) {
        return readCatch(error, () => local.listProductsForAccount(accountId), [], 'producer products');
      }
    },

    async getProduct(productId: string): Promise<Product | null> {
      try {
        const row = await client.queryByPath(recordPath('product', productId, config.appId));
        const fromPath = asProduct(row?.value);
        if (fromPath) return fromPath;
        const rows = await client.queryByJsonContains({ id: productId });
        const fromJson = rows.map((item) => asProduct(item.value)).find((item): item is Product => Boolean(item));
        return firstOrFixture(fromJson, () => local.getProduct(productId));
      } catch (error) {
        return readCatch(error, () => local.getProduct(productId), null, 'product read');
      }
    },

    async listLots(productId: string): Promise<Lot[]> {
      try {
        const rows = await client.queryByJsonContains({ productId });
        const lots = rows
          .map((row) => asLot(row.value))
          .filter((item): item is Lot => item !== null && item.productId === productId);
        return listOrFixture(lots, () => local.listLots(productId));
      } catch (error) {
        return readCatch(error, () => local.listLots(productId), [], 'lot list');
      }
    },

    async listLotsForAccount(accountId: string): Promise<Lot[]> {
      try {
        const rows = await client.queryByJsonContains({ producerAccountId: accountId });
        const lots = lotsForAccount(
          rows
            .filter((row) => kindFromPath(row.path) === 'lot')
            .map((row) => asLot(row.value))
            .filter((item): item is Lot => Boolean(item)),
          accountId
        );
        return listOrFixture(lots, () => local.listLotsForAccount(accountId));
      } catch (error) {
        return readCatch(error, () => local.listLotsForAccount(accountId), [], 'producer lots');
      }
    },

    async getLot(lotId: string): Promise<Lot | null> {
      try {
        const row = await client.queryByPath(recordPath('lot', lotId, config.appId));
        const fromPath = asLot(row?.value);
        if (fromPath) return fromPath;
        const rows = await client.queryByJsonContains({ id: lotId });
        const fromJson = rows.map((item) => asLot(item.value)).find((item): item is Lot => Boolean(item));
        return firstOrFixture(fromJson, () => local.getLot(lotId));
      } catch (error) {
        return readCatch(error, () => local.getLot(lotId), null, 'lot read');
      }
    },

    async getEvents(lotId: string): Promise<ChainEvent[]> {
      try {
        const rows = await client.queryByJsonContains({ lotId });
        const events = rows
          .map((row) => asEvent(row.value))
          .filter((item): item is ChainEvent => item !== null && item.lotId === lotId)
          .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
        return listOrFixture(events, () => local.getEvents(lotId));
      } catch (error) {
        return readCatch(error, () => local.getEvents(lotId), [], 'events');
      }
    },

    async listEventsForAccount(accountId: string): Promise<ChainEvent[]> {
      try {
        const rows = await client.queryByJsonContains({ orgAccountId: accountId });
        const events = eventsForAccount(
          rows
            .filter((row) => kindFromPath(row.path) === 'event')
            .map((row) => asEvent(row.value))
            .filter((item): item is ChainEvent => Boolean(item)),
          accountId
        );
        return listOrFixture(events, () => local.listEventsForAccount(accountId));
      } catch (error) {
        return readCatch(error, () => local.listEventsForAccount(accountId), [], 'org events');
      }
    },

    async getCertificates(subjectId: string): Promise<Certificate[]> {
      try {
        const rows = await client.queryByJsonContains({ subjectId });
        const certificates = rows
          .map((row) => asCertificate(row.value))
          .filter((item): item is Certificate => item !== null && item.subjectId === subjectId);
        return listOrFixture(certificates, () => local.getCertificates(subjectId));
      } catch (error) {
        return readCatch(error, () => local.getCertificates(subjectId), [], 'certificates');
      }
    },

    async listCertificatesForAccount(accountId: string): Promise<Certificate[]> {
      try {
        const rows = await client.queryByJsonContains({ issuerAccountId: accountId });
        const certificates = certificatesForAccount(
          rows
            .filter((row) => kindFromPath(row.path) === 'certificate')
            .map((row) => asCertificate(row.value))
            .filter((item): item is Certificate => Boolean(item)),
          accountId
        );
        return listOrFixture(certificates, () => local.listCertificatesForAccount(accountId));
      } catch (error) {
        return readCatch(error, () => local.listCertificatesForAccount(accountId), [], 'issuer certs');
      }
    },

    async getLotBundle(lotId: string): Promise<LotBundle | null> {
      const lot = await this.getLot(lotId);
      if (!lot) return null;
      const [product, events, lotCerts, productCerts, producerCerts, producer, vfListed] = await Promise.all([
        this.getProduct(lot.productId),
        this.getEvents(lot.id),
        this.getCertificates(lot.id),
        this.getCertificates(lot.productId),
        this.getCertificates(lot.producerAccountId),
        this.getOrg(lot.producerAccountId),
        isVfListed(lot.producerAccountId),
      ]);
      if (!product) return null;
      const lotAndProduct = [...lotCerts, ...productCerts.filter((item) => !lotCerts.some((cert) => cert.id === item.id))];
      return {
        lot,
        product,
        events,
        certificates: lotAndProduct.filter((item) => item.subjectType !== 'org'),
        orgCertificates: producerCerts.filter((item) => item.subjectType === 'org'),
        producer: producer ?? undefined,
        vfListed,
      };
    },

    async resolveScan(code: string): Promise<LotBundle | null> {
      const parsed = parseScanCode(code);
      if (!parsed) return null;
      return this.getLotBundle(parsed.lotId);
    },

    async isListed(accountId: string): Promise<boolean> {
      return isVfListed(accountId);
    },

    async listListed(): Promise<Listing[]> {
      try {
        const rows = await client.queryByPrefix('listed');
        const listings = rows
          .map((row) => asListing(row.value))
          .filter((item): item is Listing => Boolean(item));
        return listOrFixture(listings, () => local.listListed());
      } catch (error) {
        return readCatch(error, () => local.listListed(), [], 'listed shelf');
      }
    },

    async getOrg(accountId: string): Promise<Org | null> {
      try {
        const row = await client.queryByPath(recordPath('org', accountId, config.appId));
        const fromPath = asOrg(row?.value);
        if (fromPath) return fromPath;
        const rows = await client.queryByJsonContains({ accountId });
        const fromJson = rows.map((item) => asOrg(item.value)).find((item): item is Org => Boolean(item));
        return firstOrFixture(fromJson, () => local.getOrg(accountId));
      } catch (error) {
        return readCatch(error, () => local.getOrg(accountId), null, 'org read');
      }
    },

    async listScans(accountId?: string): Promise<ScanRecord[]> {
      try {
        const rows = accountId
          ? await client.queryByJsonContains({ accountId })
          : await client.queryByPrefix('scan');
        const scans = rows
          .map((row) => asScan(row.value))
          .filter((item): item is ScanRecord => item !== null && (!accountId || item.accountId === accountId));
        return listOrFixture(scans, () => local.listScans(accountId));
      } catch (error) {
        return readCatch(error, () => local.listScans(accountId), [], 'scans');
      }
    },

    async registerProduct(input: RegisterProductInput): Promise<Product> {
      const org = await requireOrg(
        input.producerAccountId,
        canRegisterProduct,
        'Producer role required to publish on core.'
      );
      const product: Product = {
        id: createId('prd'),
        name: input.name.trim(),
        brand: input.brand.trim(),
        description: input.description.trim(),
        ingredients: input.ingredients.map((item) => item.trim()).filter(Boolean),
        claims: input.claims.map((item) => item.trim()).filter(Boolean),
        imageUrl: input.imageUrl,
        producerAccountId: org.accountId,
        createdAt: new Date().toISOString(),
      };
      await write(recordPath('product', product.id, config.appId), product);
      return product;
    },

    async createLot(input: CreateLotInput): Promise<Lot> {
      const org = await requireOrg(
        input.producerAccountId,
        canCreateLot,
        'Producer role required to open a lot.'
      );
      const lot: Lot = {
        id: createId('lot'),
        productId: input.productId,
        label: input.label.trim(),
        harvestedAt: input.harvestedAt,
        quantity: input.quantity.trim(),
        site: input.site.trim(),
        producerAccountId: org.accountId,
        createdAt: new Date().toISOString(),
      };
      await write(recordPath('lot', lot.id, config.appId), lot);
      return lot;
    },

    async addEvent(input: AddEventInput): Promise<ChainEvent> {
      const org = await requireOrg(
        input.orgAccountId,
        canRecordEvent,
        'Your org role cannot append chain events.'
      );
      const event: ChainEvent = {
        id: createId('evt'),
        lotId: input.lotId,
        kind: input.kind,
        at: input.at ?? new Date().toISOString(),
        note: input.note.trim(),
        orgAccountId: org.accountId,
        mediaCid: input.mediaCid,
      };
      await write(recordPath('event', `${event.lotId}/${event.id}`, config.appId), event);
      return event;
    },

    async issueCertificate(input: IssueCertificateInput): Promise<Certificate> {
      assertOrgCertificateExpiry(input.subjectType, input.expiresAt);
      const org = await requireOrg(
        input.issuerAccountId,
        canIssueCertificate,
        'Certifier role required.'
      );
      const certificate: Certificate = {
        id: createId('cert'),
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        standard: input.standard.trim(),
        issuerAccountId: org.accountId,
        issuedAt: new Date().toISOString(),
        expiresAt: input.expiresAt,
        status: 'active',
        evidenceCid: input.evidenceCid,
      };
      await write(recordPath('certificate', certificate.id, config.appId), certificate);
      return certificate;
    },

    async revokeCertificate(input: RevokeCertificateInput): Promise<Certificate> {
      const reason = assertRevokeReason(input.revokeReason);
      const org = await requireOrg(
        input.issuerAccountId,
        canIssueCertificate,
        'Certifier role required.'
      );
      const existing = await findCertificate(input.certificateId);
      if (!existing) throw new Error('Certificate not found');
      if (existing.issuerAccountId !== org.accountId) {
        throw new Error('Only the issuer can revoke this stamp.');
      }
      if (existing.status === 'revoked') {
        throw new Error('Already revoked.');
      }
      const certificate: Certificate = {
        ...existing,
        status: 'revoked',
        revokeReason: reason,
      };
      await write(recordPath('certificate', certificate.id, config.appId), certificate);
      return certificate;
    },

    async recordScan(input: RecordScanInput): Promise<ScanRecord> {
      const scan: ScanRecord = {
        id: createId('scan'),
        code: input.code,
        lotId: input.lotId,
        productId: input.productId,
        scannedAt: new Date().toISOString(),
        accountId: input.accountId,
      };
      await write(recordPath('scan', scan.id, config.appId), scan);
      return scan;
    },

    async listSprouts(subjectType: VoiceSubjectType, subjectId: string): Promise<Sprout[]> {
      try {
        const rows = await client.queryByJsonContains({ subjectId, subjectType });
        return rows
          .filter((row) => kindFromPath(row.path) === 'sprout')
          .map((row) => asSprout(row.value))
          .filter((item): item is Sprout => item !== null && item.subjectId === subjectId);
      } catch (error) {
        console.warn('[tracking] OnSocial sprouts failed; not using fixtures', error);
        return [];
      }
    },

    async getSproutStats(
      subjectType: VoiceSubjectType,
      subjectId: string,
      viewerAccountId?: string
    ): Promise<SproutStats> {
      const sprouts = await this.listSprouts(subjectType, subjectId);
      return {
        subjectType,
        subjectId,
        count: sprouts.length,
        viewerSprouted: Boolean(viewerAccountId && sprouts.some((item) => item.accountId === viewerAccountId)),
      };
    },

    async toggleSprout(input: ToggleSproutInput): Promise<SproutStats> {
      const subjectType = assertVoiceSubjectType(input.subjectType);
      const accountId = input.accountId.trim();
      if (!accountId) {
        throw new Error('Connect a wallet to sprout.');
      }
      const id = sproutRecordId(subjectType, input.subjectId, accountId);
      const path = recordPath('sprout', id, config.appId);
      const row = await client.queryByPath(path);
      const existing = asSprout(row?.value);
      if (existing && existing.accountId === accountId) {
        await write(path, null);
      } else {
        const sprout: Sprout = {
          id,
          subjectType,
          subjectId: input.subjectId,
          accountId,
          at: new Date().toISOString(),
        };
        await write(path, sprout);
      }
      return this.getSproutStats(subjectType, input.subjectId, accountId);
    },

    async listNotes(subjectType: VoiceSubjectType, subjectId: string): Promise<Note[]> {
      try {
        const rows = await client.queryByJsonContains({ subjectId, subjectType });
        return rows
          .filter((row) => kindFromPath(row.path) === 'note')
          .map((row) => asNote(row.value))
          .filter((item): item is Note => item !== null && item.subjectId === subjectId)
          .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
      } catch (error) {
        console.warn('[tracking] OnSocial notes failed; not using fixtures', error);
        return [];
      }
    },

    async addNote(input: AddNoteInput): Promise<Note> {
      const subjectType = assertVoiceSubjectType(input.subjectType);
      const accountId = input.accountId.trim();
      if (!accountId) {
        throw new Error('Connect a wallet to leave a note.');
      }
      const body = normalizeNoteBody(input.body);
      if (input.parentId) {
        const notes = await this.listNotes(subjectType, input.subjectId);
        const parent = notes.find((item) => item.id === input.parentId);
        if (!parent) {
          throw new Error('That note is gone.');
        }
        if (parent.parentId) {
          throw new Error('Reply to the original note.');
        }
      }
      const note: Note = {
        id: createId('note'),
        subjectType,
        subjectId: input.subjectId,
        parentId: input.parentId,
        body,
        accountId,
        at: new Date().toISOString(),
      };
      await write(recordPath('note', note.id, config.appId), note);
      return note;
    },
  };
}
