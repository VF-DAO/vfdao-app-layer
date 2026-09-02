export const DEFAULT_APP_ID = 'vf-tracker';

/** First path segment after the account. Matches OnSocial `classify_data_path`. */
export const APP_DATA_TYPE = 'apps';

export type TrackingRecordKind =
  | 'product'
  | 'lot'
  | 'event'
  | 'certificate'
  | 'org'
  | 'scan'
  | 'listed';

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

/**
 * Indexed `data_type` for writes under `apps/<appId>/…`.
 * Not `${appId}-${kind}` — the indexer never emits that.
 */
export function dataTypeFor(_kind?: TrackingRecordKind, _appId = DEFAULT_APP_ID): string {
  return APP_DATA_TYPE;
}

export function indexedAppId(appId = DEFAULT_APP_ID): string {
  return normalizeAppId(appId);
}

/** Pre-indexer helper. Kept so local/legacy queries still match. */
export function legacyKindType(kind: TrackingRecordKind, appId = DEFAULT_APP_ID): string {
  return `${normalizeAppId(appId)}-${kind}`;
}

export function normalizeAppRelpathPrefix(prefix: string): string {
  return prefix.trim().replace(/^\/+|\/+$/g, '');
}

/**
 * Path after `apps/<appId>/`, from either `{account}/apps/…` or `apps/…`.
 */
export function appRelpathFromPath(path: string, appId = DEFAULT_APP_ID): string | null {
  const id = normalizeAppId(appId);
  const marker = `/apps/${id}/`;
  const at = path.indexOf(marker);
  if (at >= 0) {
    return path.slice(at + marker.length);
  }
  const bare = `apps/${id}`;
  if (path === bare || path === `${bare}/`) {
    return '';
  }
  if (path.startsWith(`${bare}/`)) {
    return path.slice(bare.length + 1);
  }
  return null;
}

export function pathMatchesAppPrefix(
  path: string,
  prefix: string,
  appId = DEFAULT_APP_ID
): boolean {
  const rel = appRelpathFromPath(path, appId);
  if (rel === null) {
    return false;
  }
  const normalized = normalizeAppRelpathPrefix(prefix);
  if (!normalized) {
    return true;
  }
  return rel === normalized || rel.startsWith(`${normalized}/`);
}

const PATH_KIND = /\/(product|lot|event|certificate|org|scan|listed)(?:\/|$)/;

export function kindFromPath(path: string): TrackingRecordKind | null {
  const match = PATH_KIND.exec(path);
  return (match?.[1] as TrackingRecordKind | undefined) ?? null;
}

export function matchesRecordType(path: string, type: string, appId = DEFAULT_APP_ID): boolean {
  const kind = kindFromPath(path);
  if (!kind) return false;
  if (type === APP_DATA_TYPE || type === normalizeAppId(appId)) {
    return appRelpathFromPath(path, appId) !== null;
  }
  return type === kind || type === legacyKindType(kind, appId);
}

export function jsonContains(
  value: unknown,
  contains: Record<string, unknown>
): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return false;
  }
  const record = value as Record<string, unknown>;
  return Object.entries(contains).every(([key, expected]) => record[key] === expected);
}

export function latestByPath<T extends { path: string }>(rows: T[]): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const row of rows) {
    if (seen.has(row.path)) continue;
    seen.add(row.path);
    out.push(row);
  }
  return out;
}

export function pathSuffixRegex(relativePath: string): string {
  const escaped = relativePath.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return `(^|/)${escaped}$`;
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
