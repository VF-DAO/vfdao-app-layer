import type { OnSocialClient, OnSocialSession } from './types';
import { getOnSocialConfig } from '@/features/tracking/api/onsocial/config';
import {
  queryRecordByPath,
  queryRecordsByAppJsonContains,
  queryRecordsByAppPrefix,
  queryRecordsByType,
  relayCoreSet,
} from '@/features/tracking/api/onsocial/gateway';
import {
  APP_DATA_TYPE,
  type TrackingRecordKind,
} from '@/features/tracking/api/onsocial/paths';

const KINDS: TrackingRecordKind[] = ['product', 'lot', 'event', 'certificate', 'org', 'scan'];

function resolveKind(type: string, appId: string): TrackingRecordKind {
  if ((KINDS as readonly string[]).includes(type)) {
    return type as TrackingRecordKind;
  }
  const prefix = `${appId}-`;
  if (type.startsWith(prefix)) {
    const kind = type.slice(prefix.length);
    if ((KINDS as readonly string[]).includes(kind)) {
      return kind as TrackingRecordKind;
    }
  }
  throw new Error(`Unknown OnSocial record type: ${type}`);
}

export function createGatewayOnSocialClient(sessionToken?: string): OnSocialClient {
  const config = getOnSocialConfig();
  const session: OnSocialSession | null = sessionToken
    ? { token: sessionToken, appId: config.appId, source: 'handoff' }
    : null;

  return {
    session,
    async queryByType(type) {
      if (type === APP_DATA_TYPE || type === config.appId) {
        return queryRecordsByAppPrefix(config, '');
      }
      return queryRecordsByType(config, resolveKind(type, config.appId));
    },
    async queryByPath(path) {
      return queryRecordByPath(config, path);
    },
    async queryByPrefix(prefix) {
      return queryRecordsByAppPrefix(config, prefix);
    },
    async queryByJsonContains(contains) {
      return queryRecordsByAppJsonContains(config, contains);
    },
    async set(data) {
      return relayCoreSet(config, sessionToken ?? '', data);
    },
  };
}
