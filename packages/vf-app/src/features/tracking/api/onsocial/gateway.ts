import type { OnSocialConfig } from './config';
import {
  APP_DATA_TYPE,
  indexedAppId,
  latestByPath,
  pathMatchesAppPrefix,
  pathSuffixRegex,
  type TrackingRecordKind,
} from './paths';

interface DataUpdateRow {
  path?: string;
  value?: string;
  accountId?: string;
  blockTimestamp?: string;
}

interface GraphQlResponse {
  data?: {
    dataUpdates?: DataUpdateRow[];
  };
  errors?: { message?: string }[];
}

export interface GatewayRecord {
  path: string;
  value: unknown;
  accountId?: string;
}

const DATA_FIELDS = 'path value accountId blockTimestamp';

function authHeaders(config: OnSocialConfig): Record<string, string> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (config.apiKey) {
    headers.Authorization = `Bearer ${config.apiKey}`;
  }
  return headers;
}

async function graphql<T>(config: OnSocialConfig, query: string, variables: Record<string, unknown>): Promise<T> {
  const endpoints = [`${config.gatewayUrl}/v1/graphql`, `${config.gatewayUrl}/graph`];
  let lastError: Error | null = null;

  for (const endpoint of endpoints) {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(config),
        body: JSON.stringify({ query, variables }),
        cache: 'no-store',
      });
      if (!response.ok) {
        lastError = new Error(`OnSocial gateway ${response.status} at ${endpoint}`);
        continue;
      }
      const payload = (await response.json()) as GraphQlResponse;
      if (payload.errors?.length) {
        lastError = new Error(payload.errors.map((error) => error.message).join('; '));
        continue;
      }
      return payload.data as T;
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('OnSocial gateway request failed');
    }
  }

  throw lastError ?? new Error('OnSocial gateway unavailable');
}

function parseValue(raw: string | undefined): unknown {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as unknown;
  } catch {
    return raw;
  }
}

function toRecords(rows: DataUpdateRow[] | undefined): GatewayRecord[] {
  return latestByPath(
    (rows ?? [])
      .filter((row) => row.path)
      .map((row) => ({
        path: row.path!,
        value: parseValue(row.value),
        accountId: row.accountId,
      }))
  );
}

async function queryAppRows(config: OnSocialConfig): Promise<GatewayRecord[]> {
  const data = await graphql<{ dataUpdates?: DataUpdateRow[] }>(
    config,
    `query TrackingByApp($dataType: String!, $appId: String!) {
      dataUpdates(
        where: { _and: [{ dataType: { _eq: $dataType } }, { dataId: { _eq: $appId } }] }
        limit: 200
        orderBy: [{ blockHeight: DESC }]
      ) {
        ${DATA_FIELDS}
      }
    }`,
    { dataType: APP_DATA_TYPE, appId: indexedAppId(config.appId) }
  );
  return toRecords(data.dataUpdates);
}

export async function queryRecordsByType(
  config: OnSocialConfig,
  kind: TrackingRecordKind
): Promise<GatewayRecord[]> {
  return queryRecordsByAppPrefix(config, kind);
}

export async function queryRecordsByAppPrefix(
  config: OnSocialConfig,
  prefix: string
): Promise<GatewayRecord[]> {
  const rows = await queryAppRows(config);
  return rows.filter((row) => pathMatchesAppPrefix(row.path, prefix, config.appId));
}

export async function queryRecordsByAppJsonContains(
  config: OnSocialConfig,
  contains: Record<string, unknown>
): Promise<GatewayRecord[]> {
  const data = await graphql<{ dataUpdates?: DataUpdateRow[] }>(
    config,
    `query TrackingByJson($dataType: String!, $appId: String!, $contains: jsonb!) {
      dataUpdates(
        where: {
          _and: [
            { dataType: { _eq: $dataType } },
            { dataId: { _eq: $appId } },
            { valueJson: { _contains: $contains } }
          ]
        }
        limit: 200
        orderBy: [{ blockHeight: DESC }]
      ) {
        ${DATA_FIELDS}
      }
    }`,
    { dataType: APP_DATA_TYPE, appId: indexedAppId(config.appId), contains }
  );
  return toRecords(data.dataUpdates);
}

export async function queryProfilesCurrent(
  config: OnSocialConfig,
  accountId: string
): Promise<{ accountId?: string; field?: string; value?: string }[]> {
  const data = await graphql<{
    profilesCurrent?: { accountId?: string; field?: string; value?: string }[];
  }>(
    config,
    `query OnSocialProfile($id: String!) {
      profilesCurrent(where: { accountId: { _eq: $id } }) {
        accountId field value
      }
    }`,
    { id: accountId }
  );
  return data.profilesCurrent ?? [];
}

export async function queryProfilesCurrentMany(
  config: OnSocialConfig,
  accountIds: string[]
): Promise<{ accountId?: string; field?: string; value?: string }[]> {
  if (accountIds.length === 0) return [];
  const data = await graphql<{
    profilesCurrent?: { accountId?: string; field?: string; value?: string }[];
  }>(
    config,
    `query OnSocialProfiles($ids: [String!]!) {
      profilesCurrent(where: { accountId: { _in: $ids } }) {
        accountId field value
      }
    }`,
    { ids: accountIds }
  );
  return data.profilesCurrent ?? [];
}

export interface StandingStatsRow {
  incoming: number;
  outgoing: number;
  viewerStandsWith: boolean;
}

export async function queryStandingStats(
  config: OnSocialConfig,
  accountId: string,
  viewerAccountId: string | null
): Promise<StandingStatsRow> {
  const viewer = viewerAccountId?.trim() ?? '';
  const data = await graphql<{
    standingCounts?: { standingWithCount?: number }[];
    standingOutCounts?: { standingWithOthersCount?: number }[];
    viewerEdge?: { accountId?: string }[];
  }>(
    config,
    viewer
      ? `query StandingStats($id: String!, $viewer: String!) {
          standingCounts(where: { accountId: { _eq: $id } }) {
            standingWithCount
          }
          standingOutCounts(where: { accountId: { _eq: $id } }) {
            standingWithOthersCount
          }
          viewerEdge: standingsCurrent(
            where: { accountId: { _eq: $viewer }, targetAccount: { _eq: $id } }
            limit: 1
          ) {
            accountId
          }
        }`
      : `query StandingCounts($id: String!) {
          standingCounts(where: { accountId: { _eq: $id } }) {
            standingWithCount
          }
          standingOutCounts(where: { accountId: { _eq: $id } }) {
            standingWithOthersCount
          }
        }`,
    viewer ? { id: accountId, viewer } : { id: accountId }
  );

  return {
    incoming: Number(data.standingCounts?.[0]?.standingWithCount ?? 0),
    outgoing: Number(data.standingOutCounts?.[0]?.standingWithOthersCount ?? 0),
    viewerStandsWith: Boolean(data.viewerEdge?.length),
  };
}

export async function queryStandingAccountIds(
  config: OnSocialConfig,
  accountId: string,
  direction: 'incoming' | 'outgoing'
): Promise<string[]> {
  const field = direction === 'incoming' ? 'targetAccount' : 'accountId';
  const data = await graphql<{
    standingsCurrent?: { accountId?: string; targetAccount?: string }[];
  }>(
    config,
    `query StandingList($id: String!) {
      standingsCurrent(
        where: { ${field}: { _eq: $id } }
        limit: 200
        orderBy: [{ blockTimestamp: DESC }]
      ) {
        accountId targetAccount
      }
    }`,
    { id: accountId }
  );

  const ids = new Set<string>();
  for (const row of data.standingsCurrent ?? []) {
    const id = direction === 'incoming' ? row.accountId : row.targetAccount;
    if (id) ids.add(id);
  }
  return [...ids];
}

export async function queryRecordByPath(
  config: OnSocialConfig,
  path: string
): Promise<GatewayRecord | null> {
  try {
    const data = await graphql<{ dataUpdates?: DataUpdateRow[] }>(
      config,
      `query TrackingByPath($path: String!, $suffix: String!) {
        dataUpdates(
          where: { _or: [{ path: { _eq: $path } }, { path: { _regex: $suffix } }] }
          limit: 5
          orderBy: [{ blockHeight: DESC }]
        ) {
          ${DATA_FIELDS}
        }
      }`,
      { path, suffix: pathSuffixRegex(path) }
    );
    return toRecords(data.dataUpdates)[0] ?? null;
  } catch {
    const rows = await queryAppRows(config);
    return (
      rows.find((row) => row.path === path || row.path.endsWith(`/${path}`)) ?? null
    );
  }
}

/**
 * Session-lane write to core-onsocial. Requires a user/app session, not just OnAPI.
 * The gateway relays a NEP-366 delegate so producers do not sign every lot/event.
 */
export async function relayCoreSet(
  config: OnSocialConfig,
  sessionToken: string,
  data: Record<string, string>
): Promise<{ ok: true } | { ok: false; needsSession: true; message: string }> {
  if (!sessionToken) {
    return {
      ok: false,
      needsSession: true,
      message: 'OnSocial session key required. Wallet sign-in is only needed once to grant the app session.',
    };
  }

  const response = await fetch(`${config.gatewayUrl}/relay/delegate`, {
    method: 'POST',
    headers: {
      ...authHeaders(config),
      Authorization: `Bearer ${sessionToken}`,
    },
    body: JSON.stringify({
      request: {
        action: {
          type: 'set',
          data,
        },
      },
    }),
  });

  if (response.status === 401 || response.status === 403) {
    return {
      ok: false,
      needsSession: true,
      message: 'OnSocial session expired. Reconnect via the OnSocial portal handoff.',
    };
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(body || `OnSocial relay failed (${response.status})`);
  }

  return { ok: true };
}
