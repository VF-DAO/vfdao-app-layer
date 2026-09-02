import type { OrgRole } from '../types';

export function canRegisterProduct(role: OrgRole | null | undefined): boolean {
  return role === 'producer';
}

export function canCreateLot(role: OrgRole | null | undefined): boolean {
  return role === 'producer';
}

export function canRecordEvent(role: OrgRole | null | undefined): boolean {
  return role === 'producer' || role === 'processor' || role === 'retailer' || role === 'certifier';
}

export function canIssueCertificate(role: OrgRole | null | undefined): boolean {
  return role === 'certifier';
}

export function roleLabel(role: OrgRole): string {
  return role.charAt(0).toUpperCase() + role.slice(1);
}
