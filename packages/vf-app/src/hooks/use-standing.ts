'use client';

import { useCallback, useEffect, useState } from 'react';
import { useWallet } from '@/features/wallet';
import {
  buildStandingAddTransaction,
  buildStandingRemoveTransaction,
  fetchStandingIncoming,
  fetchStandingOutgoing,
  fetchStandingStats,
  forgetLocalStanding,
  rememberLocalStanding,
} from '@/features/onsocial/standing-service';
import type { StandingStats } from '@/features/onsocial/standing';

const EMPTY_STATS: StandingStats = {
  incoming: 0,
  outgoing: 0,
  viewerStandsWith: false,
};

export function useStanding(targetAccountId: string | undefined) {
  const { accountId, wallet } = useWallet();
  const [stats, setStats] = useState<StandingStats>(EMPTY_STATS);
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
        setStats(await fetchStandingStats(targetAccountId!, accountId));
      } catch (error) {
        console.error('Failed to fetch standing stats:', error);
      } finally {
        setIsLoading(false);
      }
    }

    void load();
  }, [accountId, targetAccountId]);

  const standWith = useCallback(async () => {
    if (!accountId || !targetAccountId) return false;
    setIsToggling(true);
    try {
      rememberLocalStanding(accountId, targetAccountId);
      if (wallet) {
        await wallet.signAndSendTransaction(buildStandingAddTransaction(targetAccountId));
      }
      setStats((prev) => ({
        ...prev,
        incoming: prev.viewerStandsWith ? prev.incoming : prev.incoming + 1,
        viewerStandsWith: true,
      }));
      return true;
    } catch (error) {
      console.error('Failed to stand with account:', error);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [accountId, targetAccountId, wallet]);

  const unstand = useCallback(async () => {
    if (!accountId || !targetAccountId) return false;
    setIsToggling(true);
    try {
      forgetLocalStanding(accountId, targetAccountId);
      if (wallet) {
        await wallet.signAndSendTransaction(buildStandingRemoveTransaction(targetAccountId));
      }
      setStats((prev) => ({
        ...prev,
        incoming: prev.viewerStandsWith ? Math.max(0, prev.incoming - 1) : prev.incoming,
        viewerStandsWith: false,
      }));
      return true;
    } catch (error) {
      console.error('Failed to remove standing:', error);
      return false;
    } finally {
      setIsToggling(false);
    }
  }, [accountId, targetAccountId, wallet]);

  const toggle = useCallback(async () => {
    return stats.viewerStandsWith ? unstand() : standWith();
  }, [standWith, stats.viewerStandsWith, unstand]);

  return {
    stats,
    viewerStandsWith: stats.viewerStandsWith,
    incoming: stats.incoming,
    outgoing: stats.outgoing,
    standWith,
    unstand,
    toggle,
    isLoading,
    isToggling,
    canInteract: Boolean(accountId) && accountId !== targetAccountId,
  };
}

export function useStandingIncoming(accountId: string | undefined) {
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
        setAccounts(await fetchStandingIncoming(accountId!));
      } catch (error) {
        console.error('Failed to fetch incoming standings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [accountId]);

  return { accounts, count: accounts.length, isLoading };
}

export function useStandingOutgoing(accountId: string | undefined) {
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
        setAccounts(await fetchStandingOutgoing(accountId!));
      } catch (error) {
        console.error('Failed to fetch outgoing standings:', error);
      } finally {
        setIsLoading(false);
      }
    }
    void load();
  }, [accountId]);

  return { accounts, count: accounts.length, isLoading };
}
