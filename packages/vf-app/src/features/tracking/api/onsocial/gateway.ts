import type { OnSocialConfig } from './config';
import { dataTypeFor, type TrackingRecordKind } from './paths';

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

export async function queryRecordsByType(
  config: OnSocialConfig,
  kind: TrackingRecordKind
): Promise<GatewayRecord[]> {
  const data = await graphql<{ dataUpdates?: DataUpdateRow[] }>(
    config,
    `query TrackingByType($type: String!) {
      dataUpdates(where: { dataType: { _eq: $type } }, limit: 200, orderBy: [{ blockHeight: DESC }]) {
        path
        value
        accountId
        blockTimestamp
      }
    }`,
    { type: dataTypeFor(kind, config.appId) }
  );

  return (data.dataUpdates ?? [])
    .filter((row) => row.path)
    .map((row) => ({
      path: row.path!,
      value: parseValue(row.value),
      accountId: row.accountId,
    }));
}

export async function queryRecordByPath(
  config: OnSocialConfig,
  path: string
): Promise<GatewayRecord | null> {
  const data = await graphql<{ dataUpdates?: DataUpdateRow[] }>(
    config,
    `query TrackingByPath($path: String!) {
      dataUpdates(where: { path: { _eq: $path } }, limit: 1, orderBy: [{ blockHeight: DESC }]) {
        path
        value
        accountId
      }
    }`,
    { path }
  );
  const row = data.dataUpdates?.[0];
  if (!row?.path) return null;
  return { path: row.path, value: parseValue(row.value), accountId: row.accountId };
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
