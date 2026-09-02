import { describe, expect, it } from 'vitest';
import {
  appPrefix,
  coreSetPayload,
  dataTypeFor,
  kindFromPath,
  matchesRecordType,
  normalizeAppId,
  recordPath,
} from './paths';

describe('OnSocial core paths', () => {
  it('keeps the portal app namespace stable', () => {
    expect(normalizeAppId('VF Tracker')).toBe('vf-tracker');
    expect(appPrefix('vf-tracker')).toBe('apps/vf-tracker');
    expect(recordPath('product', 'prd-1')).toBe('apps/vf-tracker/product/prd-1');
    expect(dataTypeFor('lot')).toBe('vf-tracker-lot');
    expect(kindFromPath('apps/vf-tracker/product/prd-1')).toBe('product');
    expect(matchesRecordType('apps/vf-tracker/lot/lot-1', 'lot')).toBe(true);
    expect(matchesRecordType('apps/vf-tracker/lot/lot-1', 'vf-tracker-lot')).toBe(true);
  });

  it('builds a core Set payload for session-lane writes', () => {
    expect(coreSetPayload('apps/vf-tracker/lot/lot-1', { id: 'lot-1' })).toEqual({
      type: 'set',
      data: { 'apps/vf-tracker/lot/lot-1': '{"id":"lot-1"}' },
    });
  });
});
