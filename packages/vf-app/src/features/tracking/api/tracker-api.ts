import type {
  AddEventInput,
  Certificate,
  ChainEvent,
  CreateLotInput,
  IssueCertificateInput,
  Listing,
  Lot,
  LotBundle,
  Org,
  Product,
  RecordScanInput,
  RegisterProductInput,
  ScanRecord,
  TrackerStatus,
} from '../types';

export interface TrackerApi {
  status(): Promise<TrackerStatus>;
  listProducts(): Promise<Product[]>;
  listProductsForAccount(accountId: string): Promise<Product[]>;
  getProduct(productId: string): Promise<Product | null>;
  listLots(productId: string): Promise<Lot[]>;
  listLotsForAccount(accountId: string): Promise<Lot[]>;
  getLot(lotId: string): Promise<Lot | null>;
  getEvents(lotId: string): Promise<ChainEvent[]>;
  listEventsForAccount(accountId: string): Promise<ChainEvent[]>;
  getCertificates(subjectId: string): Promise<Certificate[]>;
  listCertificatesForAccount(accountId: string): Promise<Certificate[]>;
  getLotBundle(lotId: string): Promise<LotBundle | null>;
  resolveScan(code: string): Promise<LotBundle | null>;
  getOrg(accountId: string): Promise<Org | null>;
  isListed(accountId: string): Promise<boolean>;
  listListed(): Promise<Listing[]>;
  listScans(accountId?: string): Promise<ScanRecord[]>;
  registerProduct(input: RegisterProductInput): Promise<Product>;
  createLot(input: CreateLotInput): Promise<Lot>;
  addEvent(input: AddEventInput): Promise<ChainEvent>;
  issueCertificate(input: IssueCertificateInput): Promise<Certificate>;
  recordScan(input: RecordScanInput): Promise<ScanRecord>;
}
