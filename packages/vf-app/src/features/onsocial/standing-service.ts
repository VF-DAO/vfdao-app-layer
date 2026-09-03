import { buildCoreSetTransaction } from '@/features/onsocial/core-write';
import { getOnSocialConfig, isOnSocialConfigured } from '@/features/tracking/api/onsocial/config';
import {
  queryStandingAccountIds,
  queryStandingStats,
} from '@/features/tracking/api/onsocial/gateway';
import {
  buildStandingRemoveData,
  buildStandingSetData,
  getLocalStandingIncoming,
  getLocalStandingOutgoing,
  getLocalStandingStats,
  putLocalStanding,
  removeLocalStanding,
  resolveStandingRead,
  standingPath,
  type StandingSource,
  type StandingStats,
} from './standing';

function standingSourceFromResponse(response: Response): StandingSource {
  return response.headers.get('x-onsocial-source') === 'gateway' ? 'gateway' : 'local';
}

export function buildStandingAddTransaction(toAccountId: string, since = Date.now()) {
  return buildCoreSetTransaction(getOnSocialConfig().coreContract, buildStandingSetData(toAccountId, since));
}

export function buildStandingRemoveTransaction(toAccountId: string) {
  return buildCoreSetTransaction(getOnSocialConfig().coreContract, buildStandingRemoveData(toAccountId));
}

export function rememberLocalStanding(fromAccountId: string, toAccountId: string, since = Date.now()): void {
  putLocalStanding(fromAccountId, toAccountId, buildStandingSetData(toAccountId, since)[standingPath(toAccountId)]);
}

export function forgetLocalStanding(fromAccountId: string, toAccountId: string): void {
  removeLocalStanding(fromAccountId, toAccountId);
}

export async function getStandingStats(
  accountId: string,
  viewerAccountId: string | null
): Promise<StandingStats> {
  if (isOnSocialConfigured()) {
    try {
      return await queryStandingStats(getOnSocialConfig(), accountId, viewerAccountId);
    } catch (error) {
      console.warn('[onsocial] standing stats failed', error);
    }
  }
  return getLocalStandingStats(accountId, viewerAccountId);
}

export async function getStandingIncoming(accountId: string): Promise<string[]> {
  if (isOnSocialConfigured()) {
    try {
      return await queryStandingAccountIds(getOnSocialConfig(), accountId, 'incoming');
    } catch (error) {
      console.warn('[onsocial] standing incoming failed', error);
    }
  }
  return getLocalStandingIncoming(accountId);
}

export async function getStandingOutgoing(accountId: string): Promise<string[]> {
  if (isOnSocialConfigured()) {
    try {
      return await queryStandingAccountIds(getOnSocialConfig(), accountId, 'outgoing');
    } catch (error) {
      console.warn('[onsocial] standing outgoing failed', error);
    }
  }
  return getLocalStandingOutgoing(accountId);
}

export async function fetchStandingStats(
  accountId: string,
  viewerAccountId: string | null
): Promise<StandingStats> {
  if (typeof window !== 'undefined') {
    try {
      const params = new URLSearchParams({ accountId });
      if (viewerAccountId) params.set('viewer', viewerAccountId);
      const response = await fetch(`/api/onsocial/standing?${params.toString()}`, { cache: 'no-store' });
      if (response.ok) {
        const live = (await response.json()) as StandingStats;
        return resolveStandingRead(
          live,
          getLocalStandingStats(accountId, viewerAccountId),
          standingSourceFromResponse(response)
        );
      }
    } catch (error) {
      console.warn('[onsocial] standing stats api failed', error);
    }
    return getLocalStandingStats(accountId, viewerAccountId);
  }
  return getStandingStats(accountId, viewerAccountId);
}

export async function fetchStandingIncoming(accountId: string): Promise<string[]> {
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(
        `/api/onsocial/standing?accountId=${encodeURIComponent(accountId)}&list=incoming`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const live = (await response.json()) as string[];
        return resolveStandingRead(
          live,
          getLocalStandingIncoming(accountId),
          standingSourceFromResponse(response)
        );
      }
    } catch (error) {
      console.warn('[onsocial] standing incoming api failed', error);
    }
    return getLocalStandingIncoming(accountId);
  }
  return getStandingIncoming(accountId);
}

export async function fetchStandingOutgoing(accountId: string): Promise<string[]> {
  if (typeof window !== 'undefined') {
    try {
      const response = await fetch(
        `/api/onsocial/standing?accountId=${encodeURIComponent(accountId)}&list=outgoing`,
        { cache: 'no-store' }
      );
      if (response.ok) {
        const live = (await response.json()) as string[];
        return resolveStandingRead(
          live,
          getLocalStandingOutgoing(accountId),
          standingSourceFromResponse(response)
        );
      }
    } catch (error) {
      console.warn('[onsocial] standing outgoing api failed', error);
    }
    return getLocalStandingOutgoing(accountId);
  }
  return getStandingOutgoing(accountId);
}
