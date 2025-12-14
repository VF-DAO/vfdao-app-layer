'use client';

import { useEffect, useMemo, useState } from 'react';
import { providers } from 'near-api-js';
import Big from 'big.js';
import { formatTokenAmount } from '@/lib/swap-utils';
import { useWallet } from '@/features/wallet';
import { usePolicy } from '@/features/governance/hooks';

const VF_TOKEN_CONTRACT = 'veganfriends.tkn.near';
const VF_TOKEN_DECIMALS = 18;

export function useVfBalance() {
  const { accountId, isConnected } = useWallet();
  const [vfBalance, setVfBalance] = useState<string>('0');
  const [rawVfBalance, setRawVfBalance] = useState<string>('0');
  const [vfIcon, setVfIcon] = useState<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch VF icon
  useEffect(() => {
    const fetchIcon = async () => {
      try {
        const provider = new providers.JsonRpcProvider({ url: 'https://rpc.mainnet.near.org' });
        const result = await provider.query({
          request_type: 'call_function',
          finality: 'final',
          account_id: VF_TOKEN_CONTRACT,
          method_name: 'ft_metadata',
          args_base64: btoa(JSON.stringify({})),
        }) as unknown as { result: number[] };
        const metadata = JSON.parse(Buffer.from(result.result).toString());
        setVfIcon(metadata.icon);
      } catch (error) {
        console.warn('Could not fetch VF icon:', error);
      }
    };
    void fetchIcon();
  }, []);

  // Fetch VF balance
  useEffect(() => {
    if (!isConnected || !accountId) {
      setVfBalance('0');
      setRawVfBalance('0');
      setIsLoading(false);
      return;
    }

    const fetchVfBalance = async () => {
      try {
        const provider = new providers.JsonRpcProvider({ url: 'https://rpc.mainnet.near.org' });
        const result = await provider.query({
          request_type: 'call_function',
          finality: 'final',
          account_id: VF_TOKEN_CONTRACT,
          method_name: 'ft_balance_of',
          args_base64: btoa(JSON.stringify({ account_id: accountId })),
        }) as unknown as { result: number[] };

        const rawBalance = JSON.parse(Buffer.from(result.result).toString()) as string;
        setRawVfBalance(rawBalance);
        setVfBalance(formatTokenAmount(rawBalance, VF_TOKEN_DECIMALS, 2));
      } catch (error) {
        console.warn('Could not fetch VF balance:', error);
      } finally {
        setIsLoading(false);
      }
    };

    void fetchVfBalance();
  }, [accountId, isConnected]);

  return { vfBalance, rawVfBalance, vfIcon, isLoading };
}

export function useDaoMembership() {
  const { accountId } = useWallet();
  const { data: policy, isLoading: isLoadingPolicy } = usePolicy();

  // Calculate user groups
  const userGroups = useMemo(() => {
    if (!accountId || !policy) return [];
    return policy.roles.filter((r: any) =>
      typeof r.kind === 'object' && r.kind !== null && 'Group' in r.kind && r.kind.Group.includes(accountId)
    ).map((r: any) => r.name);
  }, [accountId, policy]);

  // Check if user can create proposals
  const canAddProposal = useMemo(() => {
    if (!accountId || !policy?.roles) return false;
    
    return policy.roles.some((role: any) => {
      if (role.kind === 'Everyone') return false;
      const isInRole = typeof role.kind === 'object' && 'Group' in role.kind && role.kind.Group.includes(accountId);
      if (!isInRole) return false;
      return role.permissions?.some((p: string) => 
        p === '*:*' || p === '*:AddProposal' || p.includes(':AddProposal')
      );
    });
  }, [accountId, policy]);

  const isMember = userGroups.length > 0;

  return { isMember, canAddProposal, userGroups, isLoading: isLoadingPolicy };
}
