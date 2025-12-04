'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Leaf, Pencil, Plus, Sparkles, UserPlus } from 'lucide-react';
import { useWallet } from '@/features/wallet';
import { useProfile } from '@/hooks/use-profile';
import { LoadingDots } from '@/components/ui/loading-dots';
import { ProfileAvatar } from '@/components/ui/profile-avatar';
import { ProfileEditorModal } from '@/components/ui/profile-editor-modal';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { providers } from 'near-api-js';
import Big from 'big.js';
import { formatTokenAmount, calculateVfPriceFromPool } from '@/lib/swap-utils';
import Image from 'next/image';
import { usePersonalVotingStats } from '@/features/governance/hooks';
import { usePolicy } from '@/features/governance/hooks';
import { JoinDaoModal } from '@/features/governance/components/JoinDaoModal';

const VF_TOKEN_CONTRACT = 'veganfriends.tkn.near';
const VF_TOKEN_DECIMALS = 18;
const POOL_ID = 5094;
const REF_FINANCE_CONTRACT = 'v2.ref-finance.near';

export function PortfolioDashboard() {
  const router = useRouter();
  const { accountId, isConnected, signIn, isConnecting } = useWallet();
  const { profileImageUrl, loading: profileLoading, refetch: refetchProfile } = useProfile(accountId ?? undefined);
  
  // Profile editor modal state
  const [profileEditorOpen, setProfileEditorOpen] = useState(false);
  
  // Separate loading states for each data type
  const [vfBalance, setVfBalance] = useState<string>('0');
  const [rawVfBalance, setRawVfBalance] = useState<string>('0');
  const [vfUsdValue, setVfUsdValue] = useState<number>(0);
  const [lpShares, setLpShares] = useState<string>('0');
  const [rawLpShares, setRawLpShares] = useState<string>('0');
  const [lpUsdValue, setLpUsdValue] = useState<number>(0);
  
  // Granular loading states
  const [isLoadingVf, setIsLoadingVf] = useState(true);
  const [isLoadingLp, setIsLoadingLp] = useState(true);
  const [isLoadingPrices, setIsLoadingPrices] = useState(true);
  
  // Refresh states (for fade effect on subsequent loads)
  const [isRefreshingVf, setIsRefreshingVf] = useState(false);
  const [isRefreshingLp, setIsRefreshingLp] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  
  // Track if we've loaded once
  const hasLoadedVf = useRef(false);
  const hasLoadedLp = useRef(false);
  const hasLoadedPrices = useRef(false);
  
  const [refreshKey, setRefreshKey] = useState(0);
  const [vfIcon, setVfIcon] = useState<string | undefined>(undefined);
  const [isLoadingVfIcon, setIsLoadingVfIcon] = useState(true);
  const [nearIcon] = useState<string>(`data:image/svg+xml;base64,${Buffer.from(`<svg width="32" height="32" viewBox="2 2 28 28" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="32" height="32" fill="white"/><path fill-rule="evenodd" clip-rule="evenodd" d="M2.84211 3.21939V12.483L7.57895 8.94375L8.05263 9.35915L4.08047 14.954C2.6046 16.308 0 15.3919 0 13.5188V2.08119C0 0.143856 2.75709 -0.738591 4.18005 0.743292L15.1579 12.1757V3.29212L10.8947 6.4513L10.4211 6.03589L13.7996 0.813295C15.2097 -0.696027 18 0.178427 18 2.12967V13.3139C18 15.2512 15.2429 16.1336 13.8199 14.6518L2.84211 3.21939Z" fill="black" transform="translate(8,8) scale(0.9, 1)"/></svg>`).toString('base64')}`);
  
  // Price data for USD calculations
  const [tokenPrices, setTokenPrices] = useState<{ nearPrice: number; vfPrice: number }>({ nearPrice: 0, vfPrice: 0 });
  const [poolData, setPoolData] = useState<{ nearReserve: string; vfReserve: string; totalShares: string } | null>(null);

  const { stats: votingStats, isLoading: votingStatsLoading } = usePersonalVotingStats(accountId ?? undefined);
  const { data: policy } = usePolicy();

  // Calculate user groups
  const userGroups = accountId && policy ? policy.roles.filter((r: any) =>
    typeof r.kind === 'object' && r.kind !== null && 'Group' in r.kind && r.kind.Group.includes(accountId)
  ).map((r: any) => r.name) : [];

  // Check if user can create proposals (has AddProposal permission in a group, not Everyone)
  const canAddProposal = useMemo(() => {
    if (!accountId || !policy?.roles) return false;
    
    return policy.roles.some((role: any) => {
      // Skip "Everyone" role - only group members can create proposals
      if (role.kind === 'Everyone') return false;
      
      // Check if user is in this group
      const isInRole = typeof role.kind === 'object' && 'Group' in role.kind && role.kind.Group.includes(accountId);
      
      if (!isInRole) return false;
      
      // Check if role has AddProposal permission
      return role.permissions?.some((p: string) => 
        p === '*:*' || 
        p === '*:AddProposal' || 
        p.includes(':AddProposal')
      );
    });
  }, [accountId, policy]);

  // Join DAO modal state
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const isMember = userGroups.length > 0;

  // Format dollar amounts with special handling for small values
  const formatDollarAmount = useCallback((amount: number) => {
    try {
      if (amount === 0) {
        return '$0.00';
      }
      if (amount >= 0.01) {
        return `$${amount.toFixed(2)}`;
      } else {
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
      if (vfIcon) {
        setIsLoadingVfIcon(false);
        return;
      }
      
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
        
        const metadata = JSON.parse(Buffer.from(metadataResult.result).toString()) as { icon?: string };
        if (metadata.icon) {
          setVfIcon(metadata.icon);
        }
      } catch (error) {
        console.warn('[PortfolioDashboard] Could not fetch VF icon:', error);
      } finally {
        setIsLoadingVfIcon(false);
      }
    };

    void fetchVfIcon();
  }, [vfIcon]);

  // Calculate USD values when we have both balances and prices
  useEffect(() => {
    if (tokenPrices.vfPrice > 0 && rawVfBalance !== '0') {
      const numericVfBalance = new Big(rawVfBalance).div(new Big(10).pow(VF_TOKEN_DECIMALS));
      const vfUsdVal = numericVfBalance.times(tokenPrices.vfPrice).toNumber();
      setVfUsdValue(vfUsdVal);
    }
  }, [tokenPrices.vfPrice, rawVfBalance]);

  // Calculate LP USD value when we have pool data, prices, and shares
  useEffect(() => {
    if (poolData && tokenPrices.nearPrice > 0 && tokenPrices.vfPrice > 0 && rawLpShares !== '0') {
      const token1Reserve = Big(poolData.nearReserve).div(Big(10).pow(24));
      const token2Reserve = Big(poolData.vfReserve).div(Big(10).pow(18));
      
      const token1TVL = token1Reserve.mul(tokenPrices.nearPrice);
      const token2TVL = token2Reserve.mul(tokenPrices.vfPrice);
      const poolTVL = token1TVL.plus(token2TVL);
      
      const totalShares = Big(poolData.totalShares);
      if (totalShares.gt(0)) {
        const readableShares = Big(rawLpShares).div(Big(10).pow(24));
        const readableTotalShares = totalShares.div(Big(10).pow(24));
        const singleLpValue = poolTVL.div(readableTotalShares);
        const totalLpUsdValue = singleLpValue.mul(readableShares).toNumber();
        setLpUsdValue(totalLpUsdValue);
      }
    }
  }, [poolData, tokenPrices, rawLpShares]);

  // Fetch VF Balance (fast - direct RPC call)
  useEffect(() => {
    if (!isConnected || !accountId) {
      setVfBalance('0');
      setRawVfBalance('0');
      setVfUsdValue(0);
      hasLoadedVf.current = false;
      setIsLoadingVf(true);
      return;
    }

    const fetchVfBalance = async () => {
      if (hasLoadedVf.current) {
        setIsRefreshingVf(true);
      }
      
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
        const provider = new providers.JsonRpcProvider({ url: rpcUrl });
        
        const result = (await provider.query({
          request_type: 'call_function',
          account_id: VF_TOKEN_CONTRACT,
          method_name: 'ft_balance_of',
          args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
          finality: 'final',
        })) as unknown as { result: number[] };
        
        const rawBalance = JSON.parse(Buffer.from(result.result).toString()) as string;
        setRawVfBalance(rawBalance);
        setVfBalance(formatTokenAmount(rawBalance, VF_TOKEN_DECIMALS, 6));
        hasLoadedVf.current = true;
      } catch (error) {
        console.warn('[PortfolioDashboard] Could not fetch VF balance:', error);
      } finally {
        setIsLoadingVf(false);
        setIsRefreshingVf(false);
      }
    };

    void fetchVfBalance();
  }, [accountId, isConnected, refreshKey]);

  // Fetch LP Shares (fast - direct RPC call)
  useEffect(() => {
    if (!isConnected || !accountId) {
      setLpShares('0');
      setRawLpShares('0');
      setLpUsdValue(0);
      hasLoadedLp.current = false;
      setIsLoadingLp(true);
      return;
    }

    const fetchLpShares = async () => {
      if (hasLoadedLp.current) {
        setIsRefreshingLp(true);
      }
      
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
        const provider = new providers.JsonRpcProvider({ url: rpcUrl });
        
        let userShares = '0';
        try {
          const sharesResult = (await provider.query({
            request_type: 'call_function',
            account_id: REF_FINANCE_CONTRACT,
            method_name: 'get_pool_shares',
            args_base64: Buffer.from(JSON.stringify({ pool_id: POOL_ID, account_id: accountId })).toString('base64'),
            finality: 'final',
          })) as unknown as { result: number[] };
          userShares = JSON.parse(Buffer.from(sharesResult.result).toString()) as string;
        } catch {
          // Fallback to mft_balance_of
          try {
            const mftResult = (await provider.query({
              request_type: 'call_function',
              account_id: REF_FINANCE_CONTRACT,
              method_name: 'mft_balance_of',
              args_base64: Buffer.from(JSON.stringify({ token_id: `:${POOL_ID}`, account_id: accountId })).toString('base64'),
              finality: 'final',
            })) as unknown as { result: number[] };
            userShares = JSON.parse(Buffer.from(mftResult.result).toString()) as string;
          } catch (mftError) {
            console.warn('[PortfolioDashboard] Could not fetch LP shares:', mftError);
          }
        }
        
        setRawLpShares(userShares);
        setLpShares(formatTokenAmount(userShares, 24, 6));
        hasLoadedLp.current = true;
      } catch (error) {
        console.warn('[PortfolioDashboard] Could not fetch LP shares:', error);
      } finally {
        setIsLoadingLp(false);
        setIsRefreshingLp(false);
      }
    };

    void fetchLpShares();
  }, [accountId, isConnected, refreshKey]);

  // Fetch Token Prices + Pool Data (slower - external API + RPC)
  useEffect(() => {
    if (!isConnected || !accountId) {
      hasLoadedPrices.current = false;
      setIsLoadingPrices(true);
      return;
    }

    const fetchPricesAndPool = async () => {
      if (hasLoadedPrices.current) {
        setIsRefreshingPrices(true);
      }
      
      try {
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
        let nearPrice = 0;
        let vfPrice = 0;
        
        // Fetch prices from API
        try {
          const priceResponse = await fetch('https://indexer.ref.finance/list-token-price');
          if (priceResponse.ok) {
            const prices = await priceResponse.json() as Record<string, { price: string }>;
            if (prices['wrap.near']) {
              nearPrice = parseFloat(prices['wrap.near'].price);
            }
            if (prices[VF_TOKEN_CONTRACT]) {
              vfPrice = parseFloat(prices[VF_TOKEN_CONTRACT].price);
            }
          }
        } catch {
          console.warn('[PortfolioDashboard] Could not fetch prices from API');
        }
        
        // If no VF price from API, calculate from pool
        if (nearPrice > 0 && vfPrice === 0) {
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
              const poolResult = await poolResponse.json();
              if (poolResult.result?.result) {
                const pool = JSON.parse(Buffer.from(poolResult.result.result).toString());
                const nearIndex = pool.token_account_ids.indexOf('wrap.near');
                const veganIndex = pool.token_account_ids.indexOf('veganfriends.tkn.near');
                
                if (nearIndex !== -1 && veganIndex !== -1) {
                  const nearReserve = String(pool.amounts[nearIndex]);
                  const vfReserve = String(pool.amounts[veganIndex]);
                  
                  vfPrice = calculateVfPriceFromPool(nearReserve, vfReserve, nearPrice);
                  
                  // Store pool data for LP value calculation
                  setPoolData({
                    nearReserve,
                    vfReserve,
                    totalShares: String(pool.total_shares ?? pool.shares_total_supply ?? '0')
                  });
                }
              }
            }
          } catch (poolError) {
            console.warn('[PortfolioDashboard] Could not fetch pool data:', poolError);
          }
        }
        
        setTokenPrices({ nearPrice, vfPrice });
        hasLoadedPrices.current = true;
      } catch (error) {
        console.warn('[PortfolioDashboard] Could not fetch prices:', error);
      } finally {
        setIsLoadingPrices(false);
        setIsRefreshingPrices(false);
      }
    };

    void fetchPricesAndPool();
  }, [accountId, isConnected, refreshKey]);

  // Auto-refresh every 30 seconds when connected
  useEffect(() => {
    if (!isConnected || !accountId) return;

    const interval = setInterval(() => {
      setRefreshKey(prev => prev + 1);
    }, 30000);

    return () => clearInterval(interval);
  }, [isConnected, accountId]);

  const totalValue = vfUsdValue + lpUsdValue;
  
  // Check if we have valid price data (not just loading state false, but actual prices)
  const hasValidPrices = tokenPrices.vfPrice > 0;
  
  // Show loading dots for USD values until we have valid prices
  const showPriceLoading = isLoadingPrices || !hasValidPrices;

  // Show compact connect button when disconnected
  if (!isConnected) {
    return (
      <div className="w-full max-w-[800px] mx-auto">
        <div className="flex justify-center">
          <Button
            onClick={() => void signIn()}
            disabled={isConnecting}
            variant="verified"
            className="px-6 sm:px-8 py-3 sm:py-4 h-12"
          >
            <Leaf className="w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0" />
            <span className="inline-flex items-center justify-center min-h-[20px] sm:min-h-[24px]">
              {isConnecting ? <LoadingDots /> : "Let's Connect"}
            </span>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[800px] mx-auto">
      <div className="px-4 sm:px-6 py-3 sm:py-4">
        {/* Compact Grid */}
        <div className="flex items-center justify-between gap-3 sm:gap-6">
          {/* Your Holdings Icon - Clickable to edit profile */}
          <button
            onClick={() => setProfileEditorOpen(true)}
            className="relative group flex items-center gap-2 flex-shrink-0"
            title="Edit profile"
          >
            {profileLoading ? (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-verified bg-verified/10 animate-pulse flex-shrink-0" />
            ) : profileImageUrl ? (
              <ProfileAvatar
                accountId={accountId}
                size="md"
                profileImageUrl={profileImageUrl}
                showFallback={false}
                className="w-8 h-8 sm:w-10 sm:h-10 border border-verified/30 group-hover:border-primary/50 transition-colors"
              />
            ) : (
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full border border-verified bg-verified/10 flex items-center justify-center flex-shrink-0 group-hover:border-primary/50 transition-colors">
                <Leaf className={`w-4 h-4 sm:w-5 sm:h-5 text-primary ${(isRefreshingVf || isRefreshingLp || isRefreshingPrices) ? 'animate-pulse' : ''}`} />
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Pencil className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
            </div>
          </button>

          {/* Divider */}
          <div className="h-8 w-px border-l border-verified/30 flex-shrink-0"></div>

          {/* VF Tokens */}
          <div className="flex items-center gap-2 min-w-0">
                {isLoadingVfIcon ? (
                  <div className="w-6 h-6 rounded-full bg-verified/20 animate-pulse flex-shrink-0" />
                ) : vfIcon ? (
                  <Image 
                    src={vfIcon} 
                    alt="VF"
                    width={24}
                    height={24}
                    className="rounded-full flex-shrink-0"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-verified/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-verified font-bold text-xs">V</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">VF</p>
                  <div className="h-[32px] flex flex-col justify-center">
                    {isLoadingVf ? (
                      <LoadingDots />
                    ) : (
                      <>
                        <span className={`text-sm sm:text-base font-bold text-foreground truncate block transition-opacity ${isRefreshingVf ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>{vfBalance}</span>
                        <span className={`text-[10px] sm:text-xs text-primary font-semibold truncate block transition-opacity ${isRefreshingPrices ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
                          {showPriceLoading ? <LoadingDots size="xs" /> : formatDollarAmount(vfUsdValue)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
          </div>

              {/* Pool icons */}
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex items-center justify-center flex-shrink-0">
                  <Image 
                    src={nearIcon} 
                    alt="NEAR"
                    width={20}
                    height={20}
                    className="rounded-full relative z-10"
                  />
                  {isLoadingVfIcon ? (
                    <div className="w-5 h-5 rounded-full bg-verified/20 animate-pulse -ml-1" />
                  ) : vfIcon ? (
                    <Image 
                      src={vfIcon} 
                      alt="VF"
                      width={20}
                      height={20}
                      className="rounded-full -ml-1"
                    />
                  ) : (
                    <div className="w-5 h-5 rounded-full bg-verified/20 flex items-center justify-center -ml-1">
                      <span className="text-verified font-bold text-xs">V</span>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Pool</p>
                  <div className="h-[32px] flex flex-col justify-center">
                    {isLoadingLp ? (
                      <LoadingDots />
                    ) : (
                      <>
                        <span className={`text-sm sm:text-base font-bold text-foreground truncate block transition-opacity ${isRefreshingLp ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>{lpShares}</span>
                        <span className={`text-[10px] sm:text-xs text-primary font-semibold truncate block transition-opacity ${isRefreshingPrices ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
                          {showPriceLoading ? <LoadingDots size="xs" /> : formatDollarAmount(lpUsdValue)}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-8 w-px border-l border-verified/30 flex-shrink-0"></div>

              {/* Total */}
              <div className="flex items-center gap-2 min-w-0">
                <Sparkles className="w-4 h-4 text-primary flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <div className="h-[18px] flex items-center">
                    {showPriceLoading ? (
                      <LoadingDots />
                    ) : (
                      <div className={`transition-opacity ${isRefreshingPrices ? 'opacity-50 animate-pulse' : 'opacity-100'}`}>
                        <p className="text-sm sm:text-base font-bold text-primary truncate">
                          {formatDollarAmount(totalValue)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
        </div>

        {/* Bottom Row: DAO Governance */}
        <div className="px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-center pt-2 border-t border-verified/30">
            <div className="flex flex-col items-center gap-2">
              {/* Row 1: VF DAO • Member • votes cast */}
              <div className="flex items-center gap-2 flex-wrap justify-center">
                {votingStatsLoading ? (
                  <LoadingDots />
                ) : (
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold text-foreground whitespace-nowrap">VF DAO</p>
                    <span className="text-muted-foreground">•</span>
                    {isMember ? (
                      <>
                        <p className="text-sm text-primary font-semibold whitespace-nowrap">Member</p>
                        <span className="text-muted-foreground">•</span>
                        <p className="text-sm text-primary font-semibold whitespace-nowrap">
                          {votingStats.totalVotes} votes cast
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground font-semibold whitespace-nowrap">Not a member</p>
                    )}
                  </div>
                )}
              </div>
              
              {isMember ? (
                <>
                  {/* Row 2: Groups • badges */}
                  <div className="flex flex-wrap items-center gap-2 justify-center">
                    <span className="text-xs text-muted-foreground">Groups</span>
                    <span className="text-muted-foreground">•</span>
                    {userGroups.map((group: string) => (
                      <Badge key={group} variant="primary" className="text-[10px] sm:text-xs px-1.5 py-0 capitalize">
                        {group}
                      </Badge>
                    ))}
                  </div>
                  
                  {/* Row 3: Create Proposal button */}
                  {canAddProposal && (
                    <Button
                      onClick={() => router.push('/dao/create')}
                      variant="verified"
                      size="sm"
                      className="text-xs h-7 px-3"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Create Proposal
                    </Button>
                  )}
                </>
              ) : (
                <Button
                  variant="verified"
                  size="sm"
                  onClick={() => setJoinModalOpen(true)}
                  className="text-xs h-8 px-3"
                >
                  <UserPlus className="w-3 h-3 mr-1.5" />
                  Request to Join
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Join DAO Modal */}
      {!isMember && accountId && (
        <JoinDaoModal
          isOpen={joinModalOpen}
          onClose={() => setJoinModalOpen(false)}
          policy={policy}
          accountId={accountId}
        />
      )}

      {/* Profile Editor Modal */}
      <ProfileEditorModal
        isOpen={profileEditorOpen}
        onClose={() => setProfileEditorOpen(false)}
        onSuccess={() => refetchProfile()}
      />
    </div>
  );
}

export default PortfolioDashboard;
