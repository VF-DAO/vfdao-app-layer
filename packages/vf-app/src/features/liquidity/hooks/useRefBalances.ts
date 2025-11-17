import { useCallback, useEffect, useState } from 'react';
import { providers } from 'near-api-js';

interface UseRefBalancesResult {
  refBalances: Record<string, string>;
  isLoadingRefBalances: boolean;
  refetchRefBalances: () => Promise<void>;
  getRefDepositedBalances: (tokenIds: string[]) => Promise<Record<string, string>>;
}

const REF_FINANCE_CONTRACT = 'v2.ref-finance.near';

export function useRefBalances(
  accountId: string | null,
  vfToken: string
): UseRefBalancesResult {
  const [refBalances, setRefBalances] = useState<Record<string, string>>({});
  const [isLoadingRefBalances, setIsLoadingRefBalances] = useState(false);

  const fetchRefInternalBalances = useCallback(async () => {
    if (!accountId) return;

    setIsLoadingRefBalances(true);
    const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
    const provider = new providers.JsonRpcProvider({ url: rpcUrl });

    try {
      const balances: Record<string, string> = {};

      // Check wrap.near balance in Ref
      const wrapResult = (await provider.query({
        request_type: 'call_function',
        account_id: REF_FINANCE_CONTRACT,
        method_name: 'get_deposit',
        args_base64: Buffer.from(
          JSON.stringify({
            account_id: accountId,
            token_id: 'wrap.near',
          })
        ).toString('base64'),
        finality: 'final',
      })) as unknown as { result: number[] };
      const wrapBalance = JSON.parse(Buffer.from(wrapResult.result).toString()) as string;
      balances['wrap.near'] = wrapBalance;

      // Check VF token balance in Ref
      const vfResult = (await provider.query({
        request_type: 'call_function',
        account_id: REF_FINANCE_CONTRACT,
        method_name: 'get_deposit',
        args_base64: Buffer.from(
          JSON.stringify({
            account_id: accountId,
            token_id: vfToken,
          })
        ).toString('base64'),
        finality: 'final',
      })) as unknown as { result: number[] };
      const vfBalance = JSON.parse(Buffer.from(vfResult.result).toString()) as string;
      balances[vfToken] = vfBalance;

      if (wrapBalance !== '0' || vfBalance !== '0') {
        console.warn('[useRefBalances] Ref Finance internal balances detected - will be automatically used');
      }

      setRefBalances(balances);
    } catch (error) {
      console.error('[useRefBalances] Failed to fetch Ref internal balances:', error);
      setRefBalances({});
    } finally {
      setIsLoadingRefBalances(false);
    }
  }, [accountId, vfToken]);

  // Get deposited token balances in Ref Finance (returns contract amounts as strings)
  const getRefDepositedBalances = useCallback(
    async (tokenIds: string[]): Promise<Record<string, string>> => {
      if (!accountId) return {};

      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });
      const balances: Record<string, string> = {};

      try {
        for (const tokenId of tokenIds) {
          try {
            const result = (await provider.query({
              request_type: 'call_function',
              account_id: REF_FINANCE_CONTRACT,
              method_name: 'get_deposit',
              args_base64: Buffer.from(
                JSON.stringify({
                  account_id: accountId,
                  token_id: tokenId,
                })
              ).toString('base64'),
              finality: 'final',
            })) as unknown as { result: number[] };
            const balance = JSON.parse(Buffer.from(result.result).toString()) as string;
            balances[tokenId] = balance;
          } catch (err) {
            console.warn(`[getRefDepositedBalances] Failed to fetch ${tokenId}:`, err);
            balances[tokenId] = '0';
          }
        }
        return balances;
      } catch (error) {
        console.error('[getRefDepositedBalances] Error:', error);
        return {};
      }
    },
    [accountId]
  );

  useEffect(() => {
    if (accountId) {
      void fetchRefInternalBalances();
    } else {
      setRefBalances({});
      setIsLoadingRefBalances(false);
    }
  }, [accountId, fetchRefInternalBalances]);

  return {
    refBalances,
    isLoadingRefBalances,
    refetchRefBalances: fetchRefInternalBalances,
    getRefDepositedBalances,
  };
}
