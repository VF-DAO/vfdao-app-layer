import type { WithYouContext, WithYouStats } from '@/types/with-you';
import { buildCoreSetTransaction } from '@/features/onsocial/core-write';
import { getOnSocialConfig } from '@/features/tracking/api/onsocial/config';
import {
  buildWithYouRemoveData,
  buildWithYouSetData,
  getLocalWhoIsWithThem,
  getLocalWhoTheyreWith,
  getLocalWithYouStats,
  putLocalWithYou,
  removeLocalWithYou,
} from '@/features/onsocial/withyou';

export class WithYouService {
  static buildWithYouTransaction(fromAccountId: string, toAccountId: string, context?: WithYouContext) {
    return buildCoreSetTransaction(getOnSocialConfig().coreContract, buildWithYouSetData(toAccountId, context));
  }

  static buildRemoveWithYouTransaction(_fromAccountId: string, toAccountId: string) {
    return buildCoreSetTransaction(getOnSocialConfig().coreContract, buildWithYouRemoveData(toAccountId));
  }

  static rememberLocal(fromAccountId: string, toAccountId: string, context?: WithYouContext): void {
    putLocalWithYou(fromAccountId, toAccountId, buildWithYouSetData(toAccountId, context)[`apps/vf/withyou/${toAccountId}`]);
  }

  static forgetLocal(fromAccountId: string, toAccountId: string): void {
    removeLocalWithYou(fromAccountId, toAccountId);
  }

  static async getWhoIsWithThem(accountId: string): Promise<string[]> {
    try {
      const response = await fetch(
        `/api/onsocial/withyou?accountId=${encodeURIComponent(accountId)}&list=with-them`,
        { cache: 'no-store' }
      );
      if (response.ok) return (await response.json()) as string[];
    } catch (error) {
      console.warn('[onsocial] withyou incoming failed', error);
    }
    return getLocalWhoIsWithThem(accountId);
  }

  static async getWhoTheyreWith(accountId: string): Promise<string[]> {
    try {
      const response = await fetch(
        `/api/onsocial/withyou?accountId=${encodeURIComponent(accountId)}&list=theyre-with`,
        { cache: 'no-store' }
      );
      if (response.ok) return (await response.json()) as string[];
    } catch (error) {
      console.warn('[onsocial] withyou outgoing failed', error);
    }
    return getLocalWhoTheyreWith(accountId);
  }

  static async getStats(
    accountId: string,
    viewerAccountId: string | null
  ): Promise<WithYouStats> {
    try {
      const params = new URLSearchParams({ accountId });
      if (viewerAccountId) params.set('viewer', viewerAccountId);
      const response = await fetch(`/api/onsocial/withyou?${params.toString()}`, { cache: 'no-store' });
      if (response.ok) return (await response.json()) as WithYouStats;
    } catch (error) {
      console.warn('[onsocial] withyou stats failed', error);
    }
    return getLocalWithYouStats(accountId, viewerAccountId);
  }
}
