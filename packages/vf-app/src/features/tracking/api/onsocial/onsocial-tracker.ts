import type { OnSocialClient } from '@/features/onsocial';
import { createId } from '../../lib/ids';
import { parseScanCode } from '../../lib/qr';
import type {
  AddEventInput,
  Certificate,
  ChainEvent,
  CreateLotInput,
  IssueCertificateInput,
  Lot,
  LotBundle,
  Org,
  Product,
  RecordScanInput,
  RegisterProductInput,
  ScanRecord,
  TrackerStatus,
} from '../../types';
import { createLocalTracker } from '../local-tracker';
import type { TrackerApi } from '../tracker-api';
import { getOnSocialConfig, isOnSocialConfigured } from './config';
import { coreSetPayload, recordPath } from './paths';

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

export function createOnSocialTracker(client: OnSocialClient): TrackerApi {
  const config = getOnSocialConfig();
  const local = createLocalTracker();
  const live = isOnSocialConfigured();

  async function write(path: string, value: unknown): Promise<void> {
    const payload = coreSetPayload(path, value);
    const result = await client.set(payload.data);
    if (!result.ok) {
      throw new Error(result.message);
    }
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
            : 'Reads can use OnAPI. Writes wait for an OnSocial portal session so the app can be listed.'
          : 'Local OnSocial seam. Same Set and query path as core; swap the client when the SDK ships.',
      };
    },

    async listProducts(): Promise<Product[]> {
      try {
        const rows = await client.queryByType('product');
        const products = rows.map((row) => asProduct(row.value)).filter((item): item is Product => Boolean(item));
        return products.length > 0 ? products : await local.listProducts();
      } catch (error) {
        console.warn('[tracking] OnSocial product list fell back to local fixtures', error);
        return local.listProducts();
      }
    },

    async getProduct(productId: string): Promise<Product | null> {
      try {
        const row = await client.queryByPath(recordPath('product', productId, config.appId));
        return asProduct(row?.value) ?? (await local.getProduct(productId));
      } catch (error) {
        console.warn('[tracking] OnSocial product read fell back to local fixtures', error);
        return local.getProduct(productId);
      }
    },

    async listLots(productId: string): Promise<Lot[]> {
      try {
        const rows = await client.queryByType('lot');
        const lots = rows
          .map((row) => asLot(row.value))
          .filter((item): item is Lot => item !== null && item.productId === productId);
        return lots.length > 0 ? lots : await local.listLots(productId);
      } catch (error) {
        console.warn('[tracking] OnSocial lot list fell back to local fixtures', error);
        return local.listLots(productId);
      }
    },

    async getLot(lotId: string): Promise<Lot | null> {
      try {
        const row = await client.queryByPath(recordPath('lot', lotId, config.appId));
        return asLot(row?.value) ?? (await local.getLot(lotId));
      } catch (error) {
        console.warn('[tracking] OnSocial lot read fell back to local fixtures', error);
        return local.getLot(lotId);
      }
    },

    async getEvents(lotId: string): Promise<ChainEvent[]> {
      try {
        const rows = await client.queryByType('event');
        const events = rows
          .map((row) => asEvent(row.value))
          .filter((item): item is ChainEvent => item !== null && item.lotId === lotId)
          .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
        return events.length > 0 ? events : await local.getEvents(lotId);
      } catch (error) {
        console.warn('[tracking] OnSocial events fell back to local fixtures', error);
        return local.getEvents(lotId);
      }
    },

    async getCertificates(subjectId: string): Promise<Certificate[]> {
      try {
        const rows = await client.queryByType('certificate');
        const certificates = rows
          .map((row) => asCertificate(row.value))
          .filter((item): item is Certificate => item !== null && item.subjectId === subjectId);
        return certificates.length > 0 ? certificates : await local.getCertificates(subjectId);
      } catch (error) {
        console.warn('[tracking] OnSocial certificates fell back to local fixtures', error);
        return local.getCertificates(subjectId);
      }
    },

    async getLotBundle(lotId: string): Promise<LotBundle | null> {
      const lot = await this.getLot(lotId);
      if (!lot) return null;
      const [product, events, lotCerts, productCerts, producer] = await Promise.all([
        this.getProduct(lot.productId),
        this.getEvents(lot.id),
        this.getCertificates(lot.id),
        this.getCertificates(lot.productId),
        this.getOrg(lot.producerAccountId),
      ]);
      if (!product) return null;
      return {
        lot,
        product,
        events,
        certificates: [...lotCerts, ...productCerts.filter((item) => !lotCerts.some((cert) => cert.id === item.id))],
        producer: producer ?? undefined,
      };
    },

    async resolveScan(code: string): Promise<LotBundle | null> {
      const parsed = parseScanCode(code);
      if (!parsed) return null;
      return this.getLotBundle(parsed.lotId);
    },

    async getOrg(accountId: string): Promise<Org | null> {
      try {
        const row = await client.queryByPath(recordPath('org', accountId, config.appId));
        return asOrg(row?.value) ?? (await local.getOrg(accountId));
      } catch (error) {
        console.warn('[tracking] OnSocial org read fell back to local fixtures', error);
        return local.getOrg(accountId);
      }
    },

    async listScans(accountId?: string): Promise<ScanRecord[]> {
      try {
        const rows = await client.queryByType('scan');
        const scans = rows
          .map((row) => asScan(row.value))
          .filter((item): item is ScanRecord => item !== null && (!accountId || item.accountId === accountId));
        return scans.length > 0 ? scans : await local.listScans(accountId);
      } catch {
        return local.listScans(accountId);
      }
    },

    async registerProduct(input: RegisterProductInput): Promise<Product> {
      const product: Product = {
        id: createId('prd'),
        name: input.name.trim(),
        brand: input.brand.trim(),
        description: input.description.trim(),
        ingredients: input.ingredients.map((item) => item.trim()).filter(Boolean),
        claims: input.claims.map((item) => item.trim()).filter(Boolean),
        imageUrl: input.imageUrl,
        producerAccountId: input.producerAccountId,
        createdAt: new Date().toISOString(),
      };
      await write(recordPath('product', product.id, config.appId), product);
      return product;
    },

    async createLot(input: CreateLotInput): Promise<Lot> {
      const lot: Lot = {
        id: createId('lot'),
        productId: input.productId,
        label: input.label.trim(),
        harvestedAt: input.harvestedAt,
        quantity: input.quantity.trim(),
        site: input.site.trim(),
        producerAccountId: input.producerAccountId,
        createdAt: new Date().toISOString(),
      };
      await write(recordPath('lot', lot.id, config.appId), lot);
      return lot;
    },

    async addEvent(input: AddEventInput): Promise<ChainEvent> {
      const event: ChainEvent = {
        id: createId('evt'),
        lotId: input.lotId,
        kind: input.kind,
        at: input.at ?? new Date().toISOString(),
        note: input.note.trim(),
        orgAccountId: input.orgAccountId,
        mediaCid: input.mediaCid,
      };
      await write(recordPath('event', `${event.lotId}/${event.id}`, config.appId), event);
      return event;
    },

    async issueCertificate(input: IssueCertificateInput): Promise<Certificate> {
      const certificate: Certificate = {
        id: createId('cert'),
        subjectType: input.subjectType,
        subjectId: input.subjectId,
        standard: input.standard.trim(),
        issuerAccountId: input.issuerAccountId,
        issuedAt: new Date().toISOString(),
        expiresAt: input.expiresAt,
        status: 'active',
        evidenceCid: input.evidenceCid,
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
  };
}
