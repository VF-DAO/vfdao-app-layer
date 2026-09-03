'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@/features/wallet';
import { WithYouService } from '@/services/with-you';
import type { WithYouContext, WithYouStats } from '@/types/with-you';

export function useWithYou(targetAccountId: string | undefined) {
  const { accountId, wallet } = useWallet();
  const [stats, setStats] = useState<WithYouStats>({
    withThem: 0,
    theyreWith: 0,
    imWithThem: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isToggling, setIsToggling] = useState(false);

  useEffect(() => {
    if (!targetAccountId) {
      setIsLoading(false);
      return;
    }

    async function load() {
      setIsLoading(true);
      try {
        setStats(await WithYouService.getStats(targetAccountId!, accountId));
      } catch (error) {
        console.error('Failed to fetch WithYou stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [accountId, targetAccountId]);

  const withYou = useCallback(
    async (context?: WithYouContext) => {
      if (!accountId || !targetAccountId) return false;
      setIsToggling(true);
      try {
        WithYouService.rememberLocal(accountId, targetAccountId, context);
        if (wallet) {
          await wallet.signAndSendTransaction(
            WithYouService.buildWithYouTransaction(accountId, targetAccountId, context)
          );
        }
        setStats((prev) => ({
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
    },
    [accountId, targetAccountId, wallet]
  );

  const removeWithYou = useCallback(async () => {
    if (!accountId || !targetAccountId) return false;
    setIsToggling(true);
    try {
      WithYouService.forgetLocal(accountId, targetAccountId);
      if (wallet) {
        await wallet.signAndSendTransaction(
          WithYouService.buildRemoveWithYouTransaction(accountId, targetAccountId)
        );
      }
      setStats((prev) => ({
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

  const toggleWithYou = useCallback(
    async (context?: WithYouContext) => {
      return stats.imWithThem ? removeWithYou() : withYou(context);
    },
    [removeWithYou, stats.imWithThem, withYou]
  );

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
    canInteract: Boolean(accountId) && accountId !== targetAccountId,
  };
}

export function useWhoIsWithThem(accountId: string | undefined) {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }
    async function load() {
      setIsLoading(true);
      try {
        setAccounts(await WithYouService.getWhoIsWithThem(accountId!));
      } catch (error) {
        console.error('Failed to fetch who is with them:', error);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [accountId]);

  return { accounts, count: accounts.length, isLoading };
}

export function useWhoTheyreWith(accountId: string | undefined) {
  const [accounts, setAccounts] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!accountId) {
      setIsLoading(false);
      return;
    }
    async function load() {
      setIsLoading(true);
      try {
        setAccounts(await WithYouService.getWhoTheyreWith(accountId!));
      } catch (error) {
        console.error('Failed to fetch who they are with:', error);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [accountId]);

  return { accounts, count: accounts.length, isLoading };
}
