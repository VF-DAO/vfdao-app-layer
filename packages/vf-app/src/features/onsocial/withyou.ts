import type { WithYouContext, WithYouData, WithYouStats } from '@/types/with-you';

export const WITHYOU_APP_ID = 'vf';
export const WITHYOU_KIND = 'withyou';
export const LOCAL_WITHYOU_KEY = 'vf.onsocial.withyou.v1';

export function withYouPath(toAccountId: string): string {
  return `apps/${WITHYOU_APP_ID}/${WITHYOU_KIND}/${toAccountId}`;
}

export function withYouFullPath(fromAccountId: string, toAccountId: string): string {
  return `${fromAccountId}/${withYouPath(toAccountId)}`;
}

export function buildWithYouSetData(
  toAccountId: string,
  context?: WithYouContext
): Record<string, string> {
  const data: WithYouData = {
    since: Date.now().toString(),
  };
  if (context) {
    data.context = context.type;
    if ('proposalId' in context) {
      data.contextId = context.proposalId.toString();
    } else if ('actionId' in context) {
      data.contextId = context.actionId;
    } else if ('milestone' in context && context.milestone) {
      data.contextId = context.milestone;
    }
  }
  return {
    [withYouPath(toAccountId)]: JSON.stringify(data),
  };
}

export function buildWithYouRemoveData(toAccountId: string): Record<string, null> {
  return {
    [withYouPath(toAccountId)]: null,
  };
}

export function parseWithYouTarget(path: string): { from?: string; to?: string } {
  const match = /^(?:([^/]+)\/)?apps\/vf\/withyou\/(.+)$/.exec(path);
  if (!match) return {};
  return { from: match[1], to: match[2] };
}

export function withYouStatsFromRows(
  targetAccountId: string,
  viewerAccountId: string | null,
  rows: { path: string; accountId?: string }[]
): WithYouStats {
  const incoming = new Set<string>();
  const outgoing = new Set<string>();

  for (const row of rows) {
    const parsed = parseWithYouTarget(row.path);
    const from = row.accountId ?? parsed.from;
    const to = parsed.to;
    if (to === targetAccountId && from) incoming.add(from);
    if (from === targetAccountId && to) outgoing.add(to);
  }

  return {
    withThem: incoming.size,
    theyreWith: outgoing.size,
    imWithThem: Boolean(viewerAccountId && incoming.has(viewerAccountId)),
  };
}

type WithYouStore = Record<string, { path: string; accountId?: string; value: unknown }>;

function canUseStorage(): boolean {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
}

function readStore(): WithYouStore {
  if (!canUseStorage()) return {};
  try {
    const raw = window.localStorage.getItem(LOCAL_WITHYOU_KEY);
    return raw ? (JSON.parse(raw) as WithYouStore) : {};
  } catch {
    return {};
  }
}

function writeStore(store: WithYouStore): void {
  if (!canUseStorage()) return;
  window.localStorage.setItem(LOCAL_WITHYOU_KEY, JSON.stringify(store));
}

export function listLocalWithYouRows(): { path: string; accountId?: string }[] {
  return Object.values(readStore()).map((row) => ({ path: row.path, accountId: row.accountId }));
}

export function putLocalWithYou(fromAccountId: string, toAccountId: string, value: unknown): void {
  const store = readStore();
  const path = withYouFullPath(fromAccountId, toAccountId);
  store[path] = { path, accountId: fromAccountId, value };
  writeStore(store);
}

export function removeLocalWithYou(fromAccountId: string, toAccountId: string): void {
  const store = readStore();
  delete store[withYouFullPath(fromAccountId, toAccountId)];
  writeStore(store);
}

export function getLocalWithYouStats(
  targetAccountId: string,
  viewerAccountId: string | null
): WithYouStats {
  return withYouStatsFromRows(targetAccountId, viewerAccountId, listLocalWithYouRows());
}

export function getLocalWhoIsWithThem(accountId: string): string[] {
  const ids = new Set<string>();
  for (const row of listLocalWithYouRows()) {
    const parsed = parseWithYouTarget(row.path);
    if (parsed.to === accountId && (row.accountId ?? parsed.from)) {
      ids.add((row.accountId ?? parsed.from)!);
    }
  }
  return [...ids];
}

export function getLocalWhoTheyreWith(accountId: string): string[] {
  const ids = new Set<string>();
  for (const row of listLocalWithYouRows()) {
    const parsed = parseWithYouTarget(row.path);
    if ((row.accountId ?? parsed.from) === accountId && parsed.to) {
      ids.add(parsed.to);
    }
  }
  return [...ids];
}
