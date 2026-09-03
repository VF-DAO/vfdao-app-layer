/**
 * OnSocial protocol standing — same edge OnSocial and VF read.
 *
 * Path: `{from}/standing/{to}`
 * Value: `{ v: 1, since }` (unix ms)
 * Index: `standingsCurrent` / `standingCounts` / `standingOutCounts`
 *
 * Not `apps/vf/withyou`. Not `social.near` graph/follow. Not a VF contract.
 */

export const STANDING_SCHEMA_VERSION = 1 as const;
export const LOCAL_STANDING_KEY = 'onsocial.standing.v1';

export interface StandingV1 {
  v: typeof STANDING_SCHEMA_VERSION;
  since: number;
}

export interface StandingEdge {
  from?: string;
  to?: string;
}

export interface StandingStats {
  incoming: number;
  outgoing: number;
  viewerStandsWith: boolean;
}

export type StandingSource = 'gateway' | 'local';

export function resolveStandingRead<T>(live: T | null, local: T, source: StandingSource): T {
  return source === 'gateway' && live !== null ? live : local;
}

export function standingPath(toAccountId: string): string {
  return `standing/${toAccountId}`;
}

export function standingFullPath(fromAccountId: string, toAccountId: string): string {
  return `${fromAccountId}/${standingPath(toAccountId)}`;
}

export function standingV1(since = Date.now()): StandingV1 {
  return { v: STANDING_SCHEMA_VERSION, since };
}

export function encodeStandingValue(value: StandingV1): string {
  return JSON.stringify(value);
}

export function buildStandingSetData(
  toAccountId: string,
  since = Date.now()
): Record<string, string> {
  return {
    [standingPath(toAccountId)]: encodeStandingValue(standingV1(since)),
  };
}

export function buildStandingRemoveData(toAccountId: string): Record<string, null> {
  return {
    [standingPath(toAccountId)]: null,
  };
}

export function parseStandingEdge(path: string): StandingEdge {
  const match = /^(?:([^/]+)\/)?standing\/([^/]+)$/.exec(path);
  if (!match) return {};
  return { from: match[1], to: match[2] };
}

export function parseStandingSince(raw: unknown): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return raw;
  const text = typeof raw === 'string' ? raw : raw == null ? '' : JSON.stringify(raw);
  if (!text) return null;
  try {
    const parsed = JSON.parse(text) as { since?: unknown };
    return typeof parsed.since === 'number' && Number.isFinite(parsed.since) ? parsed.since : null;
  } catch {
    return null;
  }
}

export function standingStatsFromRows(
  targetAccountId: string,
  viewerAccountId: string | null,
  rows: { path: string; accountId?: string }[]
): StandingStats {
  const incoming = new Set<string>();
  const outgoing = new Set<string>();

  for (const row of rows) {
    const parsed = parseStandingEdge(row.path);
    const from = row.accountId ?? parsed.from;
    const to = parsed.to;
    if (to === targetAccountId && from) incoming.add(from);
    if (from === targetAccountId && to) outgoing.add(to);
  }

  return {
    incoming: incoming.size,
    outgoing: outgoing.size,
    viewerStandsWith: Boolean(viewerAccountId && incoming.has(viewerAccountId)),
  };
}

type StandingStore = Record<string, { path: string; accountId?: string; value: unknown }>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStore(): StandingStore {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_STANDING_KEY);
    return raw ? (JSON.parse(raw) as StandingStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: StandingStore): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_STANDING_KEY, JSON.stringify(store));
}

export function listLocalStandingRows(): { path: string; accountId?: string }[] {
  return Object.values(readStore()).map((row) => ({ path: row.path, accountId: row.accountId }));
}

export function putLocalStanding(fromAccountId: string, toAccountId: string, value: unknown): void {
  const store = readStore();
  const path = standingFullPath(fromAccountId, toAccountId);
  store[path] = { path, accountId: fromAccountId, value };
  writeStore(store);
}

export function removeLocalStanding(fromAccountId: string, toAccountId: string): void {
  const store = readStore();
  delete store[standingFullPath(fromAccountId, toAccountId)];
  writeStore(store);
}

export function getLocalStandingStats(
  targetAccountId: string,
  viewerAccountId: string | null
): StandingStats {
  return standingStatsFromRows(targetAccountId, viewerAccountId, listLocalStandingRows());
}

export function getLocalStandingIncoming(accountId: string): string[] {
  const ids = new Set<string>();
  for (const row of listLocalStandingRows()) {
    const parsed = parseStandingEdge(row.path);
    const from = row.accountId ?? parsed.from;
    if (parsed.to === accountId && from) ids.add(from);
  }
  return [...ids];
}

export function getLocalStandingOutgoing(accountId: string): string[] {
  const ids = new Set<string>();
  for (const row of listLocalStandingRows()) {
    const parsed = parseStandingEdge(row.path);
    if ((row.accountId ?? parsed.from) === accountId && parsed.to) {
      ids.add(parsed.to);
    }
  }
  return [...ids];
}
