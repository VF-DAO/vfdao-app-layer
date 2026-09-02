import { describe, expect, it } from 'vitest';
import {
  APP_DATA_TYPE,
  appPrefix,
  appRelpathFromPath,
  coreSetPayload,
  dataTypeFor,
  jsonContains,
  kindFromPath,
  latestByPath,
  legacyKindType,
  matchesRecordType,
  normalizeAppId,
  pathMatchesAppPrefix,
  pathSuffixRegex,
  recordPath,
} from './paths';

describe('OnSocial core paths', () => {
  it('keeps the portal app namespace stable', () => {
    expect(normalizeAppId('VF Tracker')).toBe('vf-tracker');
    expect(appPrefix('vf-tracker')).toBe('apps/vf-tracker');
    expect(recordPath('product', 'prd-1')).toBe('apps/vf-tracker/product/prd-1');
    expect(dataTypeFor('lot')).toBe(APP_DATA_TYPE);
    expect(legacyKindType('lot')).toBe('vf-tracker-lot');
    expect(kindFromPath('apps/vf-tracker/product/prd-1')).toBe('product');
    expect(kindFromPath('vegan-friends.sputnik-dao.near/apps/vf-tracker/listed/green-valley.near')).toBe(
      'listed'
    );
    expect(matchesRecordType('apps/vf-tracker/lot/lot-1', 'lot')).toBe(true);
    expect(matchesRecordType('apps/vf-tracker/lot/lot-1', 'vf-tracker-lot')).toBe(true);
    expect(matchesRecordType('apps/vf-tracker/lot/lot-1', 'apps')).toBe(true);
  });

  it('reads indexed account-prefixed paths the same as relative Set keys', () => {
    const indexed = 'green-valley.near/apps/vf-tracker/lot/lot-1';
    expect(appRelpathFromPath(indexed)).toBe('lot/lot-1');
    expect(appRelpathFromPath('apps/vf-tracker/lot/lot-1')).toBe('lot/lot-1');
    expect(pathMatchesAppPrefix(indexed, 'lot')).toBe(true);
    expect(pathMatchesAppPrefix(indexed, 'product')).toBe(false);
    expect(pathMatchesAppPrefix(indexed, 'lottery')).toBe(false);
    expect(pathSuffixRegex('apps/vf-tracker/lot/lot-1')).toBe('(^|/)apps/vf-tracker/lot/lot-1$');
  });

  it('filters JSON the way valueJson _contains does for scalar keys', () => {
    expect(jsonContains({ id: 'lot-1', productId: 'prd-1' }, { id: 'lot-1' })).toBe(true);
    expect(jsonContains({ id: 'lot-1', lotId: 'lot-1' }, { lotId: 'lot-1' })).toBe(true);
    expect(jsonContains({ id: 'lot-1' }, { subjectId: 'lot-1' })).toBe(false);
    expect(latestByPath([{ path: 'a' }, { path: 'b' }, { path: 'a' }])).toEqual([{ path: 'a' }, { path: 'b' }]);
  });

  it('builds a core Set payload for session-lane writes', () => {
    expect(coreSetPayload('apps/vf-tracker/lot/lot-1', { id: 'lot-1' })).toEqual({
      type: 'set',
      data: { 'apps/vf-tracker/lot/lot-1': '{"id":"lot-1"}' },
    });
  });
});
