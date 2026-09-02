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

const PATH_KIND = /\/(product|lot|event|certificate|org|scan)(?:\/|$)/;

export function kindFromPath(path: string): TrackingRecordKind | null {
  const match = PATH_KIND.exec(path);
  return (match?.[1] as TrackingRecordKind | undefined) ?? null;
}

export function matchesRecordType(path: string, type: string, appId = DEFAULT_APP_ID): boolean {
  const kind = kindFromPath(path);
  if (!kind) return false;
  return type === kind || type === dataTypeFor(kind, appId);
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
