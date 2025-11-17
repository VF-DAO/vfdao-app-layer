'use client';

import { useCallback, useEffect, useState } from 'react';
import { Wallet } from 'lucide-react';
import { useWallet } from '@/features/wallet';
import { providers } from 'near-api-js';
import { LoadingDots } from '@/components/ui/loading-dots';
import Big from 'big.js';
import { formatTokenAmount } from '@/lib/swap-utils';

const VF_TOKEN_CONTRACT = 'veganfriends.tkn.near';
const VF_TOKEN_DECIMALS = 18; // Will be fetched from metadata

export function TokenBalance() {
  const { accountId, isConnected } = useWallet();
  const [balance, setBalance] = useState<string>('0');
  const [usdValue, setUsdValue] = useState<string>('0.00');
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  console.warn('[TokenBalance] Render - isConnected:', isConnected, 'accountId:', accountId);

  // Format dollar amounts with special handling for small values
  const formatDollarAmount = useCallback((amount: number) => {
    try {
      if (amount === 0) {
        return '$0.00';
      }
      if (amount >= 0.01) {
        return `$${amount.toFixed(2)}`;
      } else {
        // Format small numbers: $0.0 followed by green zeros count and significant digits
        const fixedStr = amount.toFixed(20);
  const decimalPart = fixedStr.split('.')[1] ?? '';
        const firstNonZeroIndex = decimalPart.search(/[1-9]/);
        if (firstNonZeroIndex === -1) {
          return '$0.00';
        }
        const zerosCount = firstNonZeroIndex;
        const significantDigits = decimalPart.slice(firstNonZeroIndex, firstNonZeroIndex + 4);
        return (
          <span>
            $0.0<span className="text-primary text-[10px]">{zerosCount}</span>{significantDigits}
          </span>
        );
      }
    } catch {
      return '$0.00';
    }
  }, []);

  // Function to manually refresh balance
  const refreshBalance = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Expose refresh function globally so swap can trigger it
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshTokenBalance = refreshBalance;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).refreshTokenBalance;
      }
    };
  }, []);

  useEffect(() => {
    if (!isConnected || !accountId) {
      console.warn('[TokenBalance] Not connected or no accountId, resetting balance');
      setBalance('0');
      setUsdValue('0.00');
      return;
    }

    const fetchBalance = async () => {
      // Use isRefreshing for subsequent fetches, isLoading only for initial load
      if (balance === '0' && usdValue === '0.00') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      try {
        console.warn('[TokenBalance] Fetching balance for:', accountId, 'from contract:', VF_TOKEN_CONTRACT);
        
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
        console.warn('[TokenBalance] Using RPC:', rpcUrl);
        const provider = new providers.JsonRpcProvider({ url: rpcUrl });
        
        // First, fetch token metadata to get correct decimals
        let tokenDecimals = VF_TOKEN_DECIMALS;
        try {
          const metadataResult = (await provider.query({
            request_type: 'call_function',
            account_id: VF_TOKEN_CONTRACT,
            method_name: 'ft_metadata',
            args_base64: '',
            finality: 'final',
          })) as unknown as { result: number[] };
          
          const metadata = JSON.parse(Buffer.from(metadataResult.result).toString()) as { decimals: number };
          tokenDecimals = metadata.decimals;
          console.warn('[TokenBalance] Token metadata:', metadata, 'Using decimals:', tokenDecimals);
        } catch (metaError) {
          console.warn('[TokenBalance] Could not fetch metadata, using default decimals:', VF_TOKEN_DECIMALS, metaError);
        }
        
        // Call the token contract to get balance
        const result = (await provider.query({
          request_type: 'call_function',
          account_id: VF_TOKEN_CONTRACT,
          method_name: 'ft_balance_of',
          args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
          finality: 'final',
        })) as unknown as { result: number[] };
        
        const rawBalance = JSON.parse(Buffer.from(result.result).toString()) as string;
        console.warn('[TokenBalance] Raw balance result:', rawBalance);
        
        // Use the same formatting as swap widget
        const balanceInTokens = formatTokenAmount(rawBalance, tokenDecimals, 6);
        setBalance(balanceInTokens);
        
        // Fetch actual token price from Ref Finance indexer
        let tokenPrice = 0;
        try {
          const priceResponse = await fetch('https://mainnet-indexer.ref-finance.com/list-token-price');
          if (priceResponse.ok) {
            const prices = await priceResponse.json() as Record<string, { price: string }>;
            
            // Get VEGANFRIENDS price - calculate from pool if not in indexer
            if (prices[VF_TOKEN_CONTRACT]) {
              tokenPrice = parseFloat(prices[VF_TOKEN_CONTRACT].price);
              console.warn('[TokenBalance] Found token price:', tokenPrice);
            } else if (prices['wrap.near']) {
              // Calculate from pool 5094 (same logic as useSwap)
              console.warn('[TokenBalance] Calculating price from pool 5094');
              try {
                const poolResponse = await fetch(rpcUrl, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    jsonrpc: '2.0',
                    id: '1',
                    method: 'query',
                    params: {
                      request_type: 'call_function',
                      account_id: 'v2.ref-finance.near',
                      method_name: 'get_pool',
                      args_base64: Buffer.from(JSON.stringify({ pool_id: 5094 })).toString('base64'),
                      finality: 'final'
                    }
                  })
                });

                if (poolResponse.ok) {
                  const poolData = await poolResponse.json();
                  if (poolData.result?.result) {
                    const pool = JSON.parse(Buffer.from(poolData.result.result).toString());
                    
                    const nearIndex = pool.token_account_ids.indexOf('wrap.near');
                    const veganIndex = pool.token_account_ids.indexOf('veganfriends.tkn.near');
                    
                    if (nearIndex !== -1 && veganIndex !== -1) {
                      const reserveNear = new Big(String(pool.amounts[nearIndex]));
                      const reserveVegan = new Big(String(pool.amounts[veganIndex]));
                      
                      if (reserveNear.gt(0) && reserveVegan.gt(0)) {
                        const nearPrice = parseFloat(prices['wrap.near'].price);
                        const rawRatio = reserveNear.div(reserveVegan);
                        const decimalAdjustment = new Big(10).pow(18 - 24); // VEGAN has 18, NEAR has 24
                        const adjustedRatio = rawRatio.mul(decimalAdjustment);
                        tokenPrice = adjustedRatio.mul(nearPrice).toNumber();
                        console.warn('[TokenBalance] Calculated price from pool:', tokenPrice);
                      }
                    }
                  }
                }
              } catch (poolError) {
                console.warn('[TokenBalance] Could not calculate price from pool:', poolError);
              }
            } else {
              console.warn('[TokenBalance] Token price not found in indexer');
            }
          }
        } catch (priceError) {
          console.warn('[TokenBalance] Could not fetch token price:', priceError);
        }
        
        // Calculate USD value
  const numericBalance = new Big(rawBalance ?? '0').div(new Big(10).pow(tokenDecimals));
        const usdVal = numericBalance.times(tokenPrice).toNumber();
        setUsdValue(String(usdVal));
        
        console.warn('[TokenBalance] Successfully set balance:', balanceInTokens, 'VF (decimals:', tokenDecimals, ') USD:', usdVal, 'price:', tokenPrice);
      } catch (error) {
        console.error('[TokenBalance] Error fetching token balance:', error);
        setBalance('0');
        setUsdValue('0.00');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

  void fetchBalance();
  }, [accountId, isConnected, refreshKey, balance, usdValue]);

  // Auto-refresh every 30 seconds when connected
  useEffect(() => {
    if (!isConnected || !accountId) return;

    const interval = setInterval(() => {
      console.warn('[TokenBalance] Auto-refreshing balance');
      setRefreshKey(prev => prev + 1);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, accountId]);

  console.warn('[TokenBalance] Current state - isConnected:', isConnected, 'balance:', balance, 'isLoading:', isLoading);

  if (!isConnected) {
    console.warn('[TokenBalance] Not rendering - wallet not connected');
    return null;
  }

  return (
    <div className="inline-flex items-center gap-3 border border-verified hover:border-verified/80 bg-card/50 backdrop-blur-sm px-4 sm:px-6 md:px-8 py-3 sm:py-4 rounded-full transition-all hover:shadow-md hover:shadow-verified/10">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-verified bg-verified/10 flex items-center justify-center">
          <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 text-primary transition-transform ${isRefreshing ? 'animate-pulse' : ''}`} />
        </div>
        <div className="text-left">
          <div className="text-xs text-muted-foreground">VF Balance</div>
          {isLoading ? (
            <LoadingDots />
          ) : (
            <div className={`font-semibold text-sm sm:text-base transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
              {balance} VF
            </div>
          )}
        </div>
      </div>
      <div className="h-8 w-px bg-border"></div>
      <div className="text-left">
        <div className="text-xs text-muted-foreground">USD Value</div>
        {isLoading ? (
          <LoadingDots />
        ) : (
          <div className={`font-semibold text-sm sm:text-base text-primary transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
            {formatDollarAmount(parseFloat(usdValue))}
          </div>
        )}
      </div>
    </div>
  );
}
