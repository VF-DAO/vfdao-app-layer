import type { Certificate, ChainEvent, Lot, OrgRole, Product } from '../types';
import { scanHref } from './qr';

export interface ProductDeskRow {
  product: Product;
  lots: Lot[];
  lastHarvestedAt: string | null;
}

export interface DeskCounts {
  productCount: number;
  lotCount: number;
  lastHarvestedAt: string | null;
}

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

export function productDeskRows(products: Product[], lots: Lot[]): ProductDeskRow[] {
  return products.map((product) => {
    const owned = lots
      .filter((lot) => lot.productId === product.id)
      .sort((a, b) => Date.parse(b.harvestedAt) - Date.parse(a.harvestedAt));
    return {
      product,
      lots: owned,
      lastHarvestedAt: owned[0]?.harvestedAt ?? null,
    };
  });
}

function rowHaystack(row: ProductDeskRow): string {
  return [
    row.product.name,
    row.product.brand,
    row.product.description,
    row.product.ingredients.join(' '),
    row.product.claims.join(' '),
    ...row.lots.map((lot) => [lot.label, lot.site, lot.quantity, lot.harvestedAt, lot.id].join(' ')),
  ]
    .join(' ')
    .toLowerCase();
}

export function filterProductDeskRows(rows: ProductDeskRow[], query: string): ProductDeskRow[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return rows;
  return rows.filter((row) => rowHaystack(row).includes(needle));
}

export function recentLots(lots: Lot[], limit = 3): Lot[] {
  return [...lots]
    .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    .slice(0, limit);
}

export function deskCounts(products: Product[], lots: Lot[]): DeskCounts {
  const latest = [...lots].sort((a, b) => Date.parse(b.harvestedAt) - Date.parse(a.harvestedAt))[0];
  return {
    productCount: products.length,
    lotCount: lots.length,
    lastHarvestedAt: latest?.harvestedAt ?? null,
  };
}

export function countLabel(count: number, singular: string): string {
  return count === 1 ? `1 ${singular}` : `${count} ${singular}s`;
}

export function lotCountLabel(count: number): string {
  return countLabel(count, 'lot');
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
