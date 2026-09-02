export type OnSocialSessionSource = 'local' | 'handoff';

export interface OnSocialSession {
  token: string;
  appId: string;
  actorId?: string;
  source: OnSocialSessionSource;
}

export interface OnSocialRecord {
  path: string;
  value: unknown;
  accountId?: string;
}

export type OnSocialWriteResult =
  | { ok: true }
  | { ok: false; needsSession: true; message: string };

/**
 * Stable seam for @onsocial/sdk.
 * Swap the implementation; keep TrackerApi and UI unchanged.
 */
export interface OnSocialClient {
  session: OnSocialSession | null;
  queryByType(type: string): Promise<OnSocialRecord[]>;
  queryByPath(path: string): Promise<OnSocialRecord | null>;
  set(data: Record<string, string>): Promise<OnSocialWriteResult>;
}
