import { describe, expect, it } from 'vitest';
import { canCreateLot, canIssueCertificate, canRecordEvent, canRegisterProduct } from './roles';

describe('org roles', () => {
  it('lets producers register products and open lots', () => {
    expect(canRegisterProduct('producer')).toBe(true);
    expect(canCreateLot('producer')).toBe(true);
    expect(canRegisterProduct('certifier')).toBe(false);
    expect(canCreateLot(null)).toBe(false);
  });

  it('lets the chain roles append events', () => {
    expect(canRecordEvent('processor')).toBe(true);
    expect(canRecordEvent('consumer')).toBe(false);
  });

  it('reserves certificates for certifiers', () => {
    expect(canIssueCertificate('certifier')).toBe(true);
    expect(canIssueCertificate('producer')).toBe(false);
  });
});
