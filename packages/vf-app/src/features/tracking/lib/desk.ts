import { scanHref } from './qr';
import type { Certificate, ChainEvent, Lot, OrgRole, Product } from '../types';

export function productsForAccount(products: Product[], accountId: string): Product[] {
  return products
    .filter((product) => product.producerAccountId === accountId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function lotsForAccount(lots: Lot[], accountId: string): Lot[] {
  return lots
    .filter((lot) => lot.producerAccountId === accountId)
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
}

export function eventsForAccount(events: ChainEvent[], accountId: string): ChainEvent[] {
  return events
    .filter((event) => event.orgAccountId === accountId)
    .sort((a, b) => Date.parse(b.at) - Date.parse(a.at));
}

export function certificatesForAccount(certificates: Certificate[], accountId: string): Certificate[] {
  return certificates
    .filter((certificate) => certificate.issuerAccountId === accountId)
    .sort((a, b) => Date.parse(b.issuedAt) - Date.parse(a.issuedAt));
}

export function lotBundleHref(lotId: string): string {
  return scanHref(lotId);
}

export function certificateBundleHref(certificate: Certificate): string {
  return certificate.subjectType === 'lot'
    ? scanHref(certificate.subjectId)
    : `/products/${certificate.subjectId}`;
}

export function eventBundleHref(event: ChainEvent): string {
  return scanHref(event.lotId);
}

export function deskTitle(role: OrgRole | null | undefined): string {
  if (role === 'certifier') return 'Certifier desk';
  if (role === 'processor') return 'Mill desk';
  if (role === 'retailer') return 'Retail desk';
  if (role === 'producer') return 'Producer desk';
  return 'Studio';
}
