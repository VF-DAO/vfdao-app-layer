// Types for the "I'm With You" solidarity system

/**
 * A WithYou represents solidarity between two accounts
 * Simple, meaningful, human
 */
export interface WithYou {
  /** Account expressing solidarity */
  from: string;
  /** Account receiving solidarity */
  to: string;
  /** Unix timestamp when solidarity was expressed */
  since: number;
  /** Optional context - what brought you together */
  context?: WithYouContext;
}

/**
 * Context types for solidarity
 * What moment or action sparked the connection
 */
export type WithYouContext =
  | { type: 'profile' }                           // Standing with the person
  | { type: 'proposal'; proposalId: number }      // Standing with a proposal
  | { type: 'journey'; milestone?: string }       // Standing with their journey
  | { type: 'action'; actionId: string }          // Standing with an action
  | { type: 'moment' };                           // Just... with them

/**
 * Aggregated solidarity stats for display
 */
export interface WithYouStats {
  /** How many are with this account/thing */
  withThem: number;
  /** How many this account is with */
  theyreWith: number;
  /** Whether current user is with them */
  imWithThem: boolean;
}

/**
 * Data stored at `{from}/apps/vf/withyou/{to}` on OnSocial core.
 */
export interface WithYouData {
  /** Timestamp as string */
  since: string;
  /** Optional context type */
  context?: string;
  /** Optional context ID (proposal ID, etc) */
  contextId?: string;
}

/**
 * Response from fetching who's with someone
 */
export interface WithYouList {
  accounts: string[];
  total: number;
}
