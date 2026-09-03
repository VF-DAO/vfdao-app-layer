import { afterEach, describe, expect, it, vi } from 'vitest';
import type { OnSocialConfig } from './config';
import {
  queryRecordByPath,
  queryRecordsByAppJsonContains,
  queryRecordsByAppPrefix,
  queryStandingAccountIds,
  queryStandingStats,
} from './gateway';

const config: OnSocialConfig = {
  appId: 'vf-tracker',
  network: 'mainnet',
  gatewayUrl: 'https://api.onsocial.id',
  coreContract: 'core.onsocial.near',
};

function graphqlCall(rows: Record<string, unknown>[]) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ data: { dataUpdates: rows } }),
  });
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function postedQuery(fetchMock: ReturnType<typeof graphqlCall>) {
  const init = fetchMock.mock.calls[0]?.[1] as { body?: string };
  return JSON.parse(init.body ?? '{}') as {
    query: string;
    variables: Record<string, unknown>;
  };
}

describe('OnSocial indexed gateway queries', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it('lists a kind via dataType apps + dataId vf-tracker, not vf-tracker-lot', async () => {
    const fetchMock = graphqlCall([
      {
        path: 'green-valley.near/apps/vf-tracker/lot/lot-1',
        value: JSON.stringify({ id: 'lot-1', productId: 'prd-1' }),
        accountId: 'green-valley.near',
      },
      {
        path: 'green-valley.near/apps/vf-tracker/product/prd-1',
        value: JSON.stringify({ id: 'prd-1', name: 'Oat' }),
        accountId: 'green-valley.near',
      },
    ]);

    const lots = await queryRecordsByAppPrefix(config, 'lot');
    const posted = postedQuery(fetchMock);

    expect(posted.variables).toMatchObject({ dataType: 'apps', appId: 'vf-tracker' });
    expect(posted.query).not.toMatch(/vf-tracker-lot/);
    expect(lots).toHaveLength(1);
    expect(lots[0]?.path).toContain('/lot/lot-1');
  });

  it('composes a scan with valueJson containment', async () => {
    const fetchMock = graphqlCall([
      {
        path: 'nordic-mill.near/apps/vf-tracker/event/lot-1/evt-1',
        value: JSON.stringify({ id: 'evt-1', lotId: 'lot-1' }),
        accountId: 'nordic-mill.near',
      },
    ]);

    const rows = await queryRecordsByAppJsonContains(config, { lotId: 'lot-1' });
    const posted = postedQuery(fetchMock);

    expect(posted.query).toMatch(/valueJson:\s*\{\s*_contains:\s*\$contains/);
    expect(posted.variables).toMatchObject({
      dataType: 'apps',
      appId: 'vf-tracker',
      contains: { lotId: 'lot-1' },
    });
    expect(rows[0]?.accountId).toBe('nordic-mill.near');
  });

  it('resolves a relative path against the indexed account-prefixed path', async () => {
    graphqlCall([
      {
        path: 'green-valley.near/apps/vf-tracker/lot/lot-1',
        value: JSON.stringify({ id: 'lot-1', productId: 'prd-1' }),
        accountId: 'green-valley.near',
      },
    ]);

    const row = await queryRecordByPath(config, 'apps/vf-tracker/lot/lot-1');
    expect(row?.accountId).toBe('green-valley.near');
    expect((row?.value as { id?: string }).id).toBe('lot-1');
  });

  it('reads standing from standingsCurrent, not apps/vf', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          standingCounts: [{ standingWithCount: 2 }],
          standingOutCounts: [{ standingWithOthersCount: 1 }],
          viewerEdge: [{ accountId: 'alice.near' }],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const stats = await queryStandingStats(config, 'green-valley.near', 'alice.near');
    const posted = postedQuery(fetchMock);

    expect(posted.query).toMatch(/standingsCurrent/);
    expect(posted.query).not.toMatch(/apps\/vf/);
    expect(posted.query).not.toMatch(/dataType/);
    expect(posted.variables).toEqual({ id: 'green-valley.near', viewer: 'alice.near' });
    expect(stats).toEqual({ incoming: 2, outgoing: 1, viewerStandsWith: true });
  });

  it('lists incoming standers by targetAccount', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          standingsCurrent: [
            { accountId: 'alice.near', targetAccount: 'green-valley.near' },
            { accountId: 'bob.near', targetAccount: 'green-valley.near' },
          ],
        },
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const ids = await queryStandingAccountIds(config, 'green-valley.near', 'incoming');
    const posted = postedQuery(fetchMock);

    expect(posted.query).toMatch(/targetAccount:\s*\{\s*_eq:\s*\$id/);
    expect(posted.query).not.toMatch(/dataType/);
    expect(ids).toEqual(['alice.near', 'bob.near']);
  });
});
