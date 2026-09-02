export const DEFAULT_APP_ID = 'vf-tracker';

export type TrackingRecordKind = 'product' | 'lot' | 'event' | 'certificate' | 'org' | 'scan';

export function normalizeAppId(appId = DEFAULT_APP_ID): string {
  return appId.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-') || DEFAULT_APP_ID;
}

export function appPrefix(appId = DEFAULT_APP_ID): string {
  return `apps/${normalizeAppId(appId)}`;
}

export function recordPath(
  kind: TrackingRecordKind,
  id: string,
  appId = DEFAULT_APP_ID
): string {
  return `${appPrefix(appId)}/${kind}/${id}`;
}

export function eventPath(lotId: string, eventId: string, appId = DEFAULT_APP_ID): string {
  return `${appPrefix(appId)}/event/${lotId}/${eventId}`;
}

export function dataTypeFor(kind: TrackingRecordKind, appId = DEFAULT_APP_ID): string {
  return `${normalizeAppId(appId)}-${kind}`;
}

export function coreSetPayload(
  path: string,
  value: unknown
): { type: 'set'; data: Record<string, string> } {
  return {
    type: 'set',
    data: {
      [path]: typeof value === 'string' ? value : JSON.stringify(value),
    },
  };
}
