'use client';

import { useCallback, useEffect, useState } from 'react';
import { Sparkles, Wallet } from 'lucide-react';
import { useWallet } from '@/contexts/wallet-context';
import { providers } from 'near-api-js';
import Big from 'big.js';
import { formatTokenAmount } from '@/lib/swap-utils';

const VF_TOKEN_CONTRACT = 'veganfriends.tkn.near';
const VF_TOKEN_DECIMALS = 18;
const POOL_ID = 5094;
const REF_FINANCE_CONTRACT = 'v2.ref-finance.near';

export function PortfolioDashboard() {
  const { wallet, accountId, isConnected, signIn } = useWallet();
  const [vfBalance, setVfBalance] = useState<string>('0');
  const [vfUsdValue, setVfUsdValue] = useState<number>(0);
  const [lpShares, setLpShares] = useState<string>('0');
  const [lpUsdValue, setLpUsdValue] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [vfIcon, setVfIcon] = useState<string | undefined>(undefined);
  const [nearIcon] = useState<string>(`data:image/svg+xml;base64,${Buffer.from(`<svg width="32" height="32" viewBox="2 2 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2.84211 3.21939V12.483L7.57895 8.94375L8.05263 9.35915L4.08047 14.954C2.6046 16.308 0 15.3919 0 13.5188V2.08119C0 0.143856 2.75709 -0.738591 4.18005 0.743292L15.1579 12.1757V3.29212L10.8947 6.4513L10.4211 6.03589L13.7996 0.813295C15.2097 -0.696027 18 0.178427 18 2.12967V13.3139C18 15.2512 15.2429 16.1336 13.8199 14.6518L2.84211 3.21939Z" fill="black" transform="translate(8,8) scale(0.9, 1)"/></svg>`).toString('base64')}`);

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

  // Function to manually refresh balances
  const refreshBalances = () => {
    setRefreshKey(prev => prev + 1);
  };

  // Expose refresh function globally
  useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).refreshPortfolioDashboard = refreshBalances;
    }
    return () => {
      if (typeof window !== 'undefined') {
        delete (window as any).refreshPortfolioDashboard;
      }
    };
  }, []);
  
  // Fetch VF icon even when disconnected (for preview)
  useEffect(() => {
    const fetchVfIcon = async () => {
      if (vfIcon) return; // Already loaded
      
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
        const provider = new providers.JsonRpcProvider({ url: rpcUrl });
        
        const metadataResult = (await provider.query({
          request_type: 'call_function',
          account_id: VF_TOKEN_CONTRACT,
          method_name: 'ft_metadata',
          args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
          finality: 'final',
        })) as unknown as { result: number[] };
        
        const metadata = JSON.parse(Buffer.from(metadataResult.result).toString()) as { 
          icon?: string;
        };
        
        if (metadata.icon) {
          setVfIcon(metadata.icon);
        }
      } catch (error) {
        console.warn('[PortfolioDashboard] Could not fetch VF icon:', error);
      }
    };

  void fetchVfIcon();
  }, [vfIcon]);

  useEffect(() => {
    if (!isConnected || !accountId) {
      console.log('[PortfolioDashboard] Not connected or no accountId, resetting balances');
      setVfBalance('0');
      setVfUsdValue(0);
      setLpShares('0');
      setLpUsdValue(0);
      return;
    }

    const fetchPortfolioData = async () => {
      // Use isRefreshing for subsequent fetches, isLoading only for initial load
      if (vfBalance === '0' && lpShares === '0') {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      
      try {
        console.log('[PortfolioDashboard] Fetching portfolio data for:', accountId);
        
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
        const provider = new providers.JsonRpcProvider({ url: rpcUrl });
        
        // Track decimals (will be updated from metadata if available)
        let tokenDecimals = VF_TOKEN_DECIMALS;
        
        // Fetch VF token metadata (including icon)
        try {
          const metadataResult = (await provider.query({
            request_type: 'call_function',
            account_id: VF_TOKEN_CONTRACT,
            method_name: 'ft_metadata',
            args_base64: Buffer.from(JSON.stringify({})).toString('base64'),
            finality: 'final',
          })) as unknown as { result: number[] };
          
          const metadata = JSON.parse(Buffer.from(metadataResult.result).toString()) as { 
            decimals: number;
            icon?: string;
          };
          tokenDecimals = metadata.decimals;
          if (metadata.icon) {
            setVfIcon(metadata.icon);
          }
        } catch (metaError) {
          console.warn('[PortfolioDashboard] Could not fetch metadata, using default decimals:', VF_TOKEN_DECIMALS);
        }
        
        const result = (await provider.query({
          request_type: 'call_function',
          account_id: VF_TOKEN_CONTRACT,
          method_name: 'ft_balance_of',
          args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
          finality: 'final',
        })) as unknown as { result: number[] };
        
        const rawVfBalance = JSON.parse(Buffer.from(result.result).toString()) as string;
        const vfBalanceFormatted = formatTokenAmount(rawVfBalance, tokenDecimals, 6);
        setVfBalance(vfBalanceFormatted);
        
        // Fetch LP shares
        let userShares = '0';
        try {
          const sharesResult = (await provider.query({
            request_type: 'call_function',
            account_id: REF_FINANCE_CONTRACT,
            method_name: 'get_pool_shares',
            args_base64: Buffer.from(JSON.stringify({
              pool_id: POOL_ID,
              account_id: accountId
            })).toString('base64'),
            finality: 'final',
          }) as unknown) as { result: number[] };

          userShares = JSON.parse(Buffer.from(sharesResult.result).toString()) as string;
        } catch (getPoolSharesError) {
          // Fallback to mft_balance_of
          try {
            const mftResult = (await provider.query({
              request_type: 'call_function',
              account_id: REF_FINANCE_CONTRACT,
              method_name: 'mft_balance_of',
              args_base64: Buffer.from(JSON.stringify({
                token_id: `:${POOL_ID}`,
                account_id: accountId
              })).toString('base64'),
              finality: 'final',
            }) as unknown) as { result: number[] };

            userShares = JSON.parse(Buffer.from(mftResult.result).toString()) as string;
          } catch (mftError) {
            console.warn('[PortfolioDashboard] Could not fetch LP shares:', mftError);
          }
        }
        
        const lpSharesFormatted = formatTokenAmount(userShares, 24, 6);
        setLpShares(lpSharesFormatted);
        
        // Fetch token prices
        let vfTokenPrice = 0;
        let nearPrice = 0;
        
        try {
          const priceResponse = await fetch('https://mainnet-indexer.ref-finance.com/list-token-price');
          if (priceResponse.ok) {
            const prices = await priceResponse.json() as Record<string, { price: string }>;
            
            // Get NEAR price
            if (prices['wrap.near']) {
              nearPrice = parseFloat(prices['wrap.near'].price);
            }
            
            // Get VEGANFRIENDS price or calculate from pool
            if (prices[VF_TOKEN_CONTRACT]) {
              vfTokenPrice = parseFloat(prices[VF_TOKEN_CONTRACT].price);
            } else if (nearPrice > 0) {
              // Calculate from pool 5094
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
                      account_id: REF_FINANCE_CONTRACT,
                      method_name: 'get_pool',
                      args_base64: Buffer.from(JSON.stringify({ pool_id: POOL_ID })).toString('base64'),
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
                        const rawRatio = reserveNear.div(reserveVegan);
                        const decimalAdjustment = new Big(10).pow(18 - 24);
                        const adjustedRatio = rawRatio.mul(decimalAdjustment);
                        vfTokenPrice = adjustedRatio.mul(nearPrice).toNumber();
                        
                        // Calculate LP USD value
                        const token1Reserve = Big(pool.amounts[nearIndex]).div(Big(10).pow(24));
                        const token2Reserve = Big(pool.amounts[veganIndex]).div(Big(10).pow(18));
                        
                        const token1TVL = token1Reserve.mul(nearPrice);
                        const token2TVL = token2Reserve.mul(vfTokenPrice);
                        const poolTVL = token1TVL.plus(token2TVL);
                        
                        const totalShares = Big(pool.total_shares ?? pool.shares_total_supply ?? '0');
                        if (totalShares.gt(0)) {
                          const readableShares = Big(userShares).div(Big(10).pow(24));
                          const readableTotalShares = totalShares.div(Big(10).pow(24));
                          const singleLpValue = poolTVL.div(readableTotalShares);
                          const totalLpUsdValue = singleLpValue.mul(readableShares).toNumber();
                          setLpUsdValue(totalLpUsdValue);
                        }
                      }
                    }
                  }
                }
              } catch (poolError) {
                console.warn('[PortfolioDashboard] Could not calculate price from pool:', poolError);
              }
            }
          }
        } catch (priceError) {
          console.warn('[PortfolioDashboard] Could not fetch token prices:', priceError);
        }
        
        // Calculate VF USD value
  const numericVfBalance = new Big(rawVfBalance ?? '0').div(new Big(10).pow(tokenDecimals));
        const vfUsdVal = numericVfBalance.times(vfTokenPrice).toNumber();
        setVfUsdValue(vfUsdVal);
        
        console.log('[PortfolioDashboard] Portfolio data:', {
          vfBalance: vfBalanceFormatted,
          vfUsd: vfUsdVal,
          lpShares: lpSharesFormatted,
          lpUsd: lpUsdValue
        });
      } catch (error) {
        console.error('[PortfolioDashboard] Error fetching portfolio data:', error);
        setVfBalance('0');
        setVfUsdValue(0);
        setLpShares('0');
        setLpUsdValue(0);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    };

  void fetchPortfolioData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId, isConnected, refreshKey]);

  // Auto-refresh every 30 seconds when connected
  useEffect(() => {
    if (!isConnected || !accountId) return;

    const interval = setInterval(() => {
      console.log('[PortfolioDashboard] Auto-refreshing portfolio');
      setRefreshKey(prev => prev + 1);
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [isConnected, accountId]);

  const totalValue = vfUsdValue + lpUsdValue;

  // Show compact connect button when disconnected
  if (!isConnected) {
    return (
      <div className="w-full max-w-[800px] mx-auto">
        <button
          onClick={() => void signIn()}
          className="inline-flex items-center justify-center gap-2 border border-verified bg-verified/10 text-primary hover:text-primary px-6 sm:px-8 py-3 sm:py-4 rounded-full font-semibold transition-all hover:shadow-md hover:shadow-verified/20 group text-sm sm:text-base whitespace-nowrap"
        >
          <Wallet className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
          Let's Connect
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="bg-card/50 backdrop-blur-sm border border-verified/30 hover:border-verified/50 rounded-full px-4 sm:px-6 py-3 sm:py-4 transition-all hover:shadow-md hover:shadow-verified/10">
        {/* Compact Grid */}
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Your Holdings Icon */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-verified bg-verified/10 flex items-center justify-center">
              <Wallet className={`w-4 h-4 sm:w-5 sm:h-5 text-primary ${isRefreshing ? 'animate-pulse' : ''}`} />
            </div>
          </div>

          {/* Divider */}
          <div className="h-8 w-px bg-border flex-shrink-0"></div>

          {/* VF Tokens */}
          <div className="flex items-center gap-2 min-w-0">
                {vfIcon ? (
                  <img 
                    src={vfIcon} 
                    alt="VF"
                    className="w-6 h-6 rounded-full flex-shrink-0"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.nextElementSibling;
                      if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-6 h-6 rounded-full bg-verified/20 flex items-center justify-center flex-shrink-0 ${vfIcon ? 'hidden' : ''}`}>
                  <span className="text-verified font-bold text-xs">V</span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">VF</p>
                  {isLoading ? (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <div className={`transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                      <p className="text-sm sm:text-base font-bold text-foreground truncate">{vfBalance}</p>
                      <p className="text-[10px] sm:text-xs text-primary font-semibold truncate">
                        {formatDollarAmount(vfUsdValue)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border flex-shrink-0"></div>

              {/* Pool Contribution */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center justify-center flex-shrink-0">
                  <img 
                    src={nearIcon} 
                    alt="NEAR"
                    className="w-5 h-5 rounded-full relative z-10"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      const fallback = e.currentTarget.parentElement?.querySelector('.fallback-near');
                      if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
                    }}
                  />
                  <div className="fallback-near w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center relative z-10" style={{ display: 'none' }}>
                    <span className="text-primary font-bold text-xs">N</span>
                  </div>
                  {vfIcon ? (
                    <img 
                      src={vfIcon} 
                      alt="VF"
                      className="w-5 h-5 rounded-full -ml-1"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                        const fallback = e.currentTarget.nextElementSibling;
                        if (fallback instanceof HTMLElement) fallback.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-5 h-5 rounded-full bg-verified/20 flex items-center justify-center -ml-1 ${vfIcon ? 'hidden' : ''}`}>
                    <span className="text-verified font-bold text-xs">V</span>
                  </div>
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Pool</p>
                  {isLoading ? (
                    <div className="h-4 w-16 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <div className={`transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                      <p className="text-sm sm:text-base font-bold text-foreground truncate">{lpShares}</p>
                      <p className="text-[10px] sm:text-xs text-primary font-semibold truncate">
                        {formatDollarAmount(lpUsdValue)}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px bg-border flex-shrink-0"></div>

              {/* Total */}
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total</p>
                  {isLoading ? (
                    <div className="h-4 w-20 bg-muted animate-pulse rounded"></div>
                  ) : (
                    <div className={`transition-opacity ${isRefreshing ? 'opacity-50' : 'opacity-100'}`}>
                      <p className="text-sm sm:text-base font-bold text-primary truncate">
                        {formatDollarAmount(totalValue)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
        </div>
      </div>
    </div>
  );
}
