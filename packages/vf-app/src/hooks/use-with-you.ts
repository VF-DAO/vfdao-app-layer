'use client';

import { useState, useEffect, useCallback } from 'react';
import { useWallet } from '@/features/wallet';
import { WithYouService } from '@/services/with-you';
import { getPrioritizedEndpoints } from '@/lib/rpc-config';
import type { WithYouStats, WithYouContext } from '@/types/with-you';

/**
 * Hook for "I'm With You" solidarity system
 * 
 * Usage:
 * const { stats, isWithThem, toggleWithYou, isLoading } = useWithYou('friend.near');
 */
export function useWithYou(targetAccountId: string | undefined) {
  const { accountId, wallet } = useWallet();
  const [stats, setStats] = useState<WithYouStats>({
    withThem: 0,
    theyreWith: 0,
    imWithThem: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  const rpcUrl = getPrioritizedEndpoints('mainnet')[0];

  // Fetch stats on mount and when target changes
  useEffect(() => {
    if (!targetAccountId) {
      setIsLoading(false);
      return;
    }

    async function fetchStats() {
      setIsLoading(true);
      try {
        const fetchedStats = await WithYouService.getStats(
          targetAccountId!,
          accountId,
          rpcUrl
        );
        setStats(fetchedStats);
      } catch (error) {
        console.error('Failed to fetch WithYou stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, [targetAccountId, accountId, rpcUrl]);

  /**
   * Express solidarity - "I'm with you"
   */
  const withYou = useCallback(async (context?: WithYouContext) => {
    if (!accountId || !targetAccountId || !wallet) {
      console.error('Cannot express solidarity: not connected or no target');
      return false;
    }

    setIsToggling(true);
    try {
      const transaction = WithYouService.buildWithYouTransaction(
        accountId,
        targetAccountId,
        context
      );

      await wallet.signAndSendTransaction(transaction);

      // Optimistic update
      setStats(prev => ({
        ...prev,
        withThem: prev.withThem + 1,
        imWithThem: true,
      }));

      return true;
    } catch (error) {
      console.error('Failed to express solidarity:', error);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [accountId, targetAccountId, wallet]);

  /**
   * Remove solidarity (rare, but available)
   */
  const removeWithYou = useCallback(async () => {
    if (!accountId || !targetAccountId || !wallet) {
      return false;
    }

    setIsToggling(true);
    try {
      const transaction = WithYouService.buildRemoveWithYouTransaction(
        accountId,
        targetAccountId
      );

      await wallet.signAndSendTransaction(transaction);

      // Optimistic update
      setStats(prev => ({
        ...prev,
        withThem: Math.max(0, prev.withThem - 1),
        imWithThem: false,
      }));

      return true;
    } catch (error) {
      console.error('Failed to remove solidarity:', error);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [accountId, targetAccountId, wallet]);

  /**
   * Toggle solidarity
   */
  const toggleWithYou = useCallback(async (context?: WithYouContext) => {
    if (stats.imWithThem) {
      return removeWithYou();
    } else {
      return withYou(context);
    }
  }, [stats.imWithThem, withYou, removeWithYou]);

  return {
    stats,
    isWithThem: stats.imWithThem,
    withThem: stats.withThem,
    theyreWith: stats.theyreWith,
    withYou,
    removeWithYou,
    toggleWithYou,
    isLoading,
    isToggling,
    canInteract: !!accountId && !!wallet && accountId !== targetAccountId,
  };
}

/**
 * Hook to get list of accounts with someone
 */
export function useWhoIsWithThem(accountId: string | undefined) {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const rpcUrl = getPrioritizedEndpoints('mainnet')[0];

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    async function fetch() {
      setIsLoading(true);
      try {
        const result = await WithYouService.getWhoIsWithThem(accountId!, rpcUrl);
        setAccounts(result);
      } catch (error) {
        console.error('Failed to fetch who is with them:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [accountId, rpcUrl]);

  return { accounts, count: accounts.length, isLoading };
}

/**
 * Hook to get list of accounts someone is with
 */
export function useWhoTheyreWith(accountId: string | undefined) {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const rpcUrl = getPrioritizedEndpoints('mainnet')[0];

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }

    async function fetch() {
      setIsLoading(true);
      try {
        const result = await WithYouService.getWhoTheyreWith(accountId!, rpcUrl);
        setAccounts(result);
      } catch (error) {
        console.error('Failed to fetch who they are with:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetch();
  }, [accountId, rpcUrl]);

  return { accounts, count: accounts.length, isLoading };
}
