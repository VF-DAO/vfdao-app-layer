'use client';

/**
 * Liquidity Management Component
 *
 * This component provides functionality to add and remove liquidity from the NEAR-VEGANFRIENDS pool.
 * It integrates with Ref Finance's liquidity pool operations.
 */

import React, { useState, useCallback, useEffect } from 'react';
import { providers } from 'near-api-js';
import Big from 'big.js';
import { useWallet } from '@/contexts/wallet-context';
import {
  formatTokenAmount,
  formatTokenAmountNoAbbrev,
  parseTokenAmount,
  getMainnetTokens,
  checkStorageDeposit,
  getMinStorageBalance,
  type TokenMetadata,
} from '@/lib/swap-utils';
import { toInternationalCurrencySystemLongString } from '@ref-finance/ref-sdk';
import { TokenInput } from '@/components/swap/TokenInput';
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  Loader2,
  Plus,
  Minus,
  Settings,
  ChevronLeft,
  Droplets,
} from 'lucide-react';

type LiquidityState = 'add' | 'remove' | null;
type TransactionState = 'success' | 'fail' | 'waitingForConfirmation' | null;

interface PoolInfo {
  id: number;
  token1: TokenMetadata;
  token2: TokenMetadata;
  reserves: { [key: string]: string };
  shareSupply: string;  // Changed from totalShares to match Ref Finance
}

const SLIPPAGE_PRESETS = [
  { label: '0.1%', value: 0.1 },
  { label: '0.5%', value: 0.5 },
  { label: '1%', value: 1 },
];

export const LiquidityCard: React.FC = () => {
  const { accountId, wallet, connector, signIn } = useWallet();

  // UI State
  const [liquidityState, setLiquidityState] = useState<LiquidityState>(null);
  const [transactionState, setTransactionState] = useState<TransactionState>(null);
  const [tx, setTx] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  
  // Settings
  const [slippage, setSlippage] = useState(0.5);
  const [showSettings, setShowSettings] = useState(false);
  const [customSlippage, setCustomSlippage] = useState('');

  // Form State
  const [token1Amount, setToken1Amount] = useState('');
  const [token2Amount, setToken2Amount] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);

  // Pool Data
  const [poolInfo, setPoolInfo] = useState<PoolInfo | null>(null);
  const [userShares, setUserShares] = useState('0');
  const [isLoadingPool, setIsLoadingPool] = useState(true);
  const [isLoadingShares, setIsLoadingShares] = useState(false);

  // Available tokens
  const [availableTokens, setAvailableTokens] = useState<TokenMetadata[]>([]);

  // Balances
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [rawBalances, setRawBalances] = useState<Record<string, string>>({});
  const [isLoadingBalances, setIsLoadingBalances] = useState(false);

  // Token Prices
  const [tokenPrices, setTokenPrices] = useState<Record<string, number>>({});

  // Pool Stats (Volume, Fee, APY)
  const [poolStats, setPoolStats] = useState<{
    volume24h: string;
    fee24h: string;
    apy: number;
  }>({
    volume24h: '0',
    fee24h: '0',
    apy: 0,
  });
  
  // Gas reserve notification
  const [showGasReserveInfo, setShowGasReserveInfo] = useState(false);
  const [showGasReserveMessage, setShowGasReserveMessage] = useState(false);

  // Constants
  const POOL_ID = 5094; // NEAR-VEGANFRIENDS pool
  const REF_FINANCE_CONTRACT = 'v2.ref-finance.near';
  const VF_TOKEN = 'veganfriends.tkn.near';

  // Fetch token metadata
  useEffect(() => {
    const fetchTokens = async () => {
      try {
        const tokens = await getMainnetTokens();
        setAvailableTokens(tokens);
      } catch (error) {
        console.error('[LiquidityCard] Failed to fetch token metadata:', error);
      }
    };
    void fetchTokens();
  }, []);

  // Fetch token prices from Ref Finance API
  useEffect(() => {
    const fetchTokenPrices = async () => {
      try {
        const response = await fetch('https://indexer.ref.finance/list-token-price');
        const prices = await response.json() as Record<string, { price: string }>;
        
        const priceMap: Record<string, number> = {};
        
        // Get NEAR price (wrap.near in the API)
        if (prices['wrap.near']) {
          priceMap['near'] = parseFloat(prices['wrap.near'].price);
          priceMap['wrap.near'] = parseFloat(prices['wrap.near'].price);
          console.log('[LiquidityCard] NEAR price loaded:', priceMap['wrap.near']);
        }
        
        // Get VF token price - from API if available, otherwise calculate from pool ratio
        if (prices['veganfriends.tkn.near']) {
          priceMap['veganfriends.tkn.near'] = parseFloat(prices['veganfriends.tkn.near'].price);
          console.log('[LiquidityCard] VF price from API:', priceMap['veganfriends.tkn.near']);
        } else if (poolInfo && priceMap['wrap.near']) {
          // Calculate VF price from pool ratio (exact same method as TokenBalance component)
          const reserveNear = Big(poolInfo.reserves[poolInfo.token1.id]); // wrap.near reserve (24 decimals)
          const reserveVegan = Big(poolInfo.reserves[poolInfo.token2.id]); // veganfriends.tkn.near reserve (18 decimals)
          const nearPrice = priceMap['wrap.near'];
          
          const rawRatio = reserveNear.div(reserveVegan);
          const decimalAdjustment = Big(10).pow(18 - 24); // VEGAN has 18, NEAR has 24
          const adjustedRatio = rawRatio.mul(decimalAdjustment);
          const vfPrice = adjustedRatio.mul(nearPrice).toNumber();
          
          priceMap['veganfriends.tkn.near'] = vfPrice;
          console.log('[LiquidityCard] VF price calculated from pool:', vfPrice);
        }
        
        console.log('[LiquidityCard] All prices loaded:', priceMap);
        setTokenPrices(priceMap);
      } catch (error) {
        console.error('[fetchTokenPrices] Failed to fetch token prices:', error);
      }
    };
    
    void fetchTokenPrices();
    // Refresh prices every 60 seconds
    const interval = setInterval(() => void fetchTokenPrices(), 60000);
    return () => clearInterval(interval);
  }, [poolInfo]);

  // Fetch pool stats (Volume, Fee, APY)
  const fetchPoolStats = useCallback(async () => {
    console.log('[LiquidityCard] fetchPoolStats called');
    try {
      let volume24h = '0';
      
      // Fetch 24h volume from our Next.js API route (avoids CORS)
      // The API route proxies the request to Ref Finance server-side
      try {
        console.log('[LiquidityCard] Fetching volume for pool:', POOL_ID);
        const volumeResponse = await fetch(
          `/api/pool-volume?pool_id=${POOL_ID}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          }
        );
        
        console.log('[LiquidityCard] Volume response status:', volumeResponse.status);
        
        if (volumeResponse.ok) {
          const data = await volumeResponse.json();
          console.log('[LiquidityCard] Volume data received:', data);
          volume24h = data.volume || '0';
          console.log('[LiquidityCard] Parsed 24h volume:', volume24h);
        } else {
          const errorText = await volumeResponse.text();
          console.warn('[LiquidityCard] API returned error:', volumeResponse.status, errorText);
        }
      } catch (volumeError) {
        // Network error - volume will remain '0'
        console.error('[LiquidityCard] Could not fetch 24h volume:', volumeError);
      }

      console.log('[LiquidityCard] Volume24h value:', volume24h, 'Number:', Number(volume24h));

      // Calculate Fee (24h) and APY if we have pool info and volume
      let fee24h = '0';
      let apy = 0;
      
      if (poolInfo && Number(volume24h) > 0) {
        console.log('[LiquidityCard] Calculating fees and APY...');
        // Fee calculation: (pool.total_fee / 10000) * 0.8 * volume24h
        // Ref Finance pools typically have 0.3% fee (30 basis points), 80% goes to LPs
        const poolFee = 30; // 0.3% = 30 basis points
        const fee24hValue = (poolFee / 10000) * 0.8 * Number(volume24h);
        fee24h = fee24hValue.toString();
        console.log('[LiquidityCard] Calculated fee24h:', fee24h);

        // APY calculation: ((fee24h * 365) / tvl) * 100
        // Calculate TVL from pool reserves
        const token1Price = tokenPrices[poolInfo.token1.id] || tokenPrices['near'] || tokenPrices['wrap.near'] || 0;
        const token2Price = tokenPrices[poolInfo.token2.id] || 0;
        
        console.log('[LiquidityCard] Token prices:', { token1Price, token2Price });
        
        if (token1Price > 0) {
          const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id])
            .div(Big(10).pow(poolInfo.token1.decimals));
          const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id])
            .div(Big(10).pow(poolInfo.token2.decimals));
          
          const token1TVL = token1Reserve.mul(token1Price);
          const token2TVL = token2Reserve.mul(token2Price > 0 ? token2Price : 0);
          const tvl = token1TVL.plus(token2TVL).toNumber();
          
          console.log('[LiquidityCard] Calculated TVL:', tvl);
          
          if (tvl > 0) {
            apy = ((fee24hValue * 365) / tvl) * 100;
            console.log('[LiquidityCard] Calculated APY:', apy);
          }
        }
      } else {
        console.log('[LiquidityCard] Skipping calculations - poolInfo:', !!poolInfo, 'volume24h:', volume24h);
      }

      console.log('[LiquidityCard] Setting pool stats:', { volume24h, fee24h, apy });
      setPoolStats({
        volume24h,
        fee24h,
        apy,
      });
    } catch (error) {
      console.error('[LiquidityCard] Failed to fetch pool stats:', error);
      // Set default values on error
      setPoolStats({
        volume24h: '0',
        fee24h: '0',
        apy: 0,
      });
    }
  }, [poolInfo, tokenPrices]);

  // Fetch pool stats when pool info or prices change
  useEffect(() => {
    if (poolInfo && Object.keys(tokenPrices).length > 0) {
      void fetchPoolStats();
    }
  }, [poolInfo, tokenPrices, fetchPoolStats]);

  // Fetch pool information
  const fetchPoolInfo = useCallback(async () => {
    try {
      setIsLoadingPool(true);
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });

      // Get pool data
      const poolResponse = await provider.query({
        request_type: 'call_function',
        account_id: 'v2.ref-finance.near',
        method_name: 'get_pool',
        args_base64: Buffer.from(JSON.stringify({ pool_id: POOL_ID })).toString('base64'),
        finality: 'final',
      }) as unknown as { result: number[] };

      const pool = JSON.parse(Buffer.from(poolResponse.result).toString()) as {
        token_account_ids: string[];
        amounts: string[];
        total_shares: string;
        shares_total_supply?: string; // Alternative field name
      };
      
      // Use shares_total_supply if total_shares is not available
      const shareSupply = pool.total_shares || pool.shares_total_supply || '0';

      // Get token metadata with icons
      const nearToken = availableTokens.find(t => t.symbol === 'NEAR') || {
        id: 'near',
        symbol: 'NEAR',
        name: 'Near',
        decimals: 24,
        icon: 'https://assets.ref.finance/images/near.svg',
      };
      const vfToken = availableTokens.find(t => t.id === 'veganfriends.tkn.near') || {
        id: 'veganfriends.tkn.near',
        symbol: 'VEGANFRIENDS',
        name: 'Vegan Friends Token',
        decimals: 18,
        icon: undefined,
      };

      if (nearToken && vfToken) {
        // Map reserves based on token_account_ids order from the contract
        const reserves: { [key: string]: string } = {};
        pool.token_account_ids.forEach((tokenId: string, index: number) => {
          reserves[tokenId] = pool.amounts[index];
        });

        // The pool contract uses token ids like 'wrap.near'. Our UI prefers showing 'NEAR',
        // but the token id used to index reserves must match the contract. Create a token
        // metadata object for the pool's NEAR entry with the correct id (e.g. 'wrap.near')
        // Prefer explicit wrapped NEAR id ('wrap.near') if present, otherwise fallback to any token id matching 'near'
        const poolNearId = pool.token_account_ids.find((id: string) => id === 'wrap.near' || id === 'near')
          ?? pool.token_account_ids.find((id: string) => id.includes('near'))
          ?? nearToken.id;
        const nearMetaForPool: typeof nearToken = {
          ...nearToken,
          id: poolNearId,
          // Keep symbol and decimals as NEAR display
          symbol: 'NEAR',
          decimals: nearToken.decimals,
        };

        // Ensure vfToken id matches contract id (it usually does)
        const vfMetaForPool: typeof vfToken = {
          ...vfToken,
          id: pool.token_account_ids.find((id: string) => id === vfToken.id) ?? vfToken.id,
        };

        // Set token1 as NEAR (pool id-aware) and token2 as VEGANFRIENDS
        setPoolInfo({
          id: POOL_ID,
          token1: nearMetaForPool,
          token2: vfMetaForPool,
          reserves,
          shareSupply: shareSupply,  // Using shareSupply to match Ref Finance
        });
      }
    } catch (error) {
      console.error('[LiquidityCard] Failed to fetch pool info:', error);
      setError('Failed to load pool information');
    } finally {
      setIsLoadingPool(false);
    }
  }, [availableTokens]);

  // Fetch user balances
  const fetchBalances = useCallback(async () => {
    if (!accountId) return;

    setIsLoadingBalances(true);
    try {
      const newBalances: Record<string, string> = {};
      const newRawBalances: Record<string, string> = {};
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });

      // Fetch NEAR balance
      try {
        const account = (await provider.query({
          request_type: 'view_account',
          account_id: accountId,
          finality: 'final',
        }) as unknown) as { amount: string; storage_usage: string };

        const STORAGE_PRICE_PER_BYTE = BigInt('10000000000000000000');
        const storageCost = BigInt(account.storage_usage) * STORAGE_PRICE_PER_BYTE;
        const availableNearBalance = BigInt(account.amount) - storageCost;

        // Store raw balance for calculations
        const rawBalance = availableNearBalance.toString();
        newRawBalances.near = rawBalance;
        newRawBalances['wrap.near'] = rawBalance;
        
        // Store formatted balance for display
        const nearBalanceStr = availableNearBalance.toString();
        const nearBalanceNum = Big(nearBalanceStr).div(Big(10).pow(24));
        const nearBalanceDisplay = nearBalanceNum.toFixed(6, 0); // Round down, 6 decimals
        newBalances.near = nearBalanceDisplay;
        newBalances['wrap.near'] = nearBalanceDisplay;
      } catch (nearError) {
        console.error('[LiquidityCard] Failed to fetch NEAR balance:', nearError);
        newBalances.near = '0';
        newBalances['wrap.near'] = '0';
        newRawBalances.near = '0';
        newRawBalances['wrap.near'] = '0';
      }

      // Fetch VF token balance
      try {
        const vfResult = (await provider.query({
          request_type: 'call_function',
          account_id: 'veganfriends.tkn.near',
          method_name: 'ft_balance_of',
          args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
          finality: 'final',
        })) as unknown as { result: number[] };
        const vfBalance = JSON.parse(Buffer.from(vfResult.result).toString());
        
        // Store raw balance for calculations
        newRawBalances['veganfriends.tkn.near'] = vfBalance;
        
        // Store formatted balance for display
        const vfBalanceNum = Big(vfBalance).div(Big(10).pow(18));
        const vfBalanceDisplay = vfBalanceNum.toFixed(6, 0); // Round down, 6 decimals
        newBalances['veganfriends.tkn.near'] = vfBalanceDisplay;
      } catch {
        newBalances['veganfriends.tkn.near'] = '0';
        newRawBalances['veganfriends.tkn.near'] = '0';
      }

      setBalances(newBalances);
      setRawBalances(newRawBalances);
    } catch (error) {
      console.error('[LiquidityCard] Failed to fetch balances:', error);
    } finally {
      setIsLoadingBalances(false);
    }
  }, [accountId]);

  // Fetch user shares in the pool
  const fetchUserShares = useCallback(async () => {
    if (!accountId) return;

    setIsLoadingShares(true);
    try {
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });

      // Try get_pool_shares first (standard method)
      try {
        const sharesResult = (await provider.query({
          request_type: 'call_function',
          account_id: 'v2.ref-finance.near',
          method_name: 'get_pool_shares',
          args_base64: Buffer.from(JSON.stringify({
            pool_id: POOL_ID,
            account_id: accountId
          })).toString('base64'),
          finality: 'final',
        }) as unknown) as { result: number[] };

        const shares = JSON.parse(Buffer.from(sharesResult.result).toString()) as string;
        setUserShares(shares);
        return;
      } catch (getPoolSharesError) {
        // Fallback to mft_balance_of (alternative method)
        const mftResult = (await provider.query({
          request_type: 'call_function',
          account_id: 'v2.ref-finance.near',
          method_name: 'mft_balance_of',
          args_base64: Buffer.from(JSON.stringify({
            token_id: `:${POOL_ID}`,
            account_id: accountId
          })).toString('base64'),
          finality: 'final',
        }) as unknown) as { result: number[] };

        const shares = JSON.parse(Buffer.from(mftResult.result).toString()) as string;
        setUserShares(shares);
      }
    } catch (error) {
      console.error('[LiquidityCard] Failed to fetch user shares (both methods):', error);
      setUserShares('0');
    } finally {
      setIsLoadingShares(false);
    }
  }, [accountId]);

  // Fetch Ref Finance internal balances (tokens deposited but not in pool)
  const fetchRefInternalBalances = useCallback(async () => {
    if (!accountId) return;
    
    const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
    const provider = new providers.JsonRpcProvider({ url: rpcUrl });
    
    try {
      // Check wrap.near balance in Ref
      const wrapResult = (await provider.query({
        request_type: 'call_function',
        account_id: REF_FINANCE_CONTRACT,
        method_name: 'get_deposit',
        args_base64: Buffer.from(JSON.stringify({ 
          account_id: accountId,
          token_id: 'wrap.near'
        })).toString('base64'),
        finality: 'final',
      }) as unknown) as { result: number[] };
      const wrapBalance = JSON.parse(Buffer.from(wrapResult.result).toString()) as string;
      
      // Check VF token balance in Ref
      const vfResult = (await provider.query({
        request_type: 'call_function',
        account_id: REF_FINANCE_CONTRACT,
        method_name: 'get_deposit',
        args_base64: Buffer.from(JSON.stringify({ 
          account_id: accountId,
          token_id: VF_TOKEN
        })).toString('base64'),
        finality: 'final',
      }) as unknown) as { result: number[] };
      const vfBalance = JSON.parse(Buffer.from(vfResult.result).toString()) as string;
      
      if (wrapBalance !== "0" || vfBalance !== "0") {
        console.info('[LiquidityCard] Ref Finance internal balances detected - will be automatically used');
      }
    } catch (error) {
      console.error('[LiquidityCard] Failed to fetch Ref internal balances:', error);
    }
  }, [accountId]);

  // Get deposited token balances in Ref Finance (returns contract amounts as strings)
  const getRefDepositedBalances = useCallback(async (tokenIds: string[]): Promise<Record<string, string>> => {
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
            args_base64: Buffer.from(JSON.stringify({ 
              account_id: accountId,
              token_id: tokenId
            })).toString('base64'),
            finality: 'final',
          }) as unknown) as { result: number[] };
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
  }, [accountId]);

  // Load data on mount and when account changes
  useEffect(() => {
    if (availableTokens.length > 0) {
      void fetchPoolInfo();
    }
    if (accountId) {
      void fetchBalances();
      void fetchUserShares();
      void fetchRefInternalBalances();
    } else {
      setUserShares('0');
      setIsLoadingShares(false);
    }
  }, [availableTokens, accountId, fetchPoolInfo, fetchBalances, fetchUserShares, fetchRefInternalBalances]);

  // Calculate optimal token amounts for adding liquidity
  const calculateOptimalAmount = useCallback((inputAmount: string, inputTokenId: string) => {
    if (!poolInfo || !inputAmount) return '';

    // Convert input amount to contract units
    const inputToken = inputTokenId === poolInfo.token1.id ? poolInfo.token1 : poolInfo.token2;
    const inputAmountContract = parseTokenAmount(inputAmount, inputToken.decimals);

    const inputReserve = Big(poolInfo.reserves[inputTokenId]);
    const outputReserve = Big(poolInfo.reserves[inputTokenId === poolInfo.token1.id ? poolInfo.token2.id : poolInfo.token1.id]);

    // For liquidity provision, provide tokens in the exact ratio of current reserves
    // Formula: optimalAmount = (inputAmount * outputReserve) / inputReserve
    const optimalOutputContract = Big(inputAmountContract).mul(outputReserve).div(inputReserve);

    // Convert back to display units - use same formatting as swap widget
    const outputToken = inputTokenId === poolInfo.token1.id ? poolInfo.token2 : poolInfo.token1;
    const optimalOutputDisplay = formatTokenAmountNoAbbrev(
      optimalOutputContract.toFixed(0), 
      outputToken.decimals, 
      6
    );

    return optimalOutputDisplay;
  }, [poolInfo]);

  // Calculate token amounts user will receive when removing liquidity
  const calculateRemoveLiquidityAmounts = useCallback((sharesAmount: string) => {
    if (!poolInfo || !sharesAmount || sharesAmount === '0') {
      return { token1Amount: '0', token2Amount: '0' };
    }

    try {
      // Parse shares amount to contract units (24 decimals for LP tokens)
      const sharesContract = parseTokenAmount(sharesAmount, 24);
      
      // Ensure shareSupply is a string and handle potential formatting issues
      const shareSupplyStr = String(poolInfo.shareSupply || '0');
      
      if (shareSupplyStr === '0' || shareSupplyStr === '') {
        console.error('[calculateRemoveLiquidityAmounts] Pool has zero shareSupply!');
        return { token1Amount: '0', token2Amount: '0' };
      }
      
      const totalShares = Big(shareSupplyStr);

      // Calculate proportional share of each reserve
      // Formula: tokenAmount = (sharesAmount * tokenReserve) / totalShares
      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id] || '0');
      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id] || '0');

      const token1Contract = Big(sharesContract).mul(token1Reserve).div(totalShares);
      const token2Contract = Big(sharesContract).mul(token2Reserve).div(totalShares);

      // Convert to display units
      const token1Display = Big(token1Contract.toFixed(0)).div(Big(10).pow(poolInfo.token1.decimals)).toFixed(6, 0);
      const token2Display = Big(token2Contract.toFixed(0)).div(Big(10).pow(poolInfo.token2.decimals)).toFixed(6, 0);

      return {
        token1Amount: token1Display,
        token2Amount: token2Display,
      };
    } catch (error) {
      console.error('[LiquidityCard] Error calculating remove amounts:', error);
      console.error('[LiquidityCard] poolInfo:', poolInfo);
      console.error('[LiquidityCard] sharesAmount:', sharesAmount);
      return { token1Amount: '0', token2Amount: '0' };
    }
  }, [poolInfo]);

  // Calculate token amounts directly from contract units (for LP shares display)
  const calculateRemoveLiquidityAmountsFromContract = useCallback((sharesContractUnits: string) => {
    if (!poolInfo || !sharesContractUnits || sharesContractUnits === '0') {
      return { token1Amount: '0', token2Amount: '0' };
    }

    try {
      const shareSupplyStr = String(poolInfo.shareSupply || '0');
      
      if (shareSupplyStr === '0' || shareSupplyStr === '') {
        console.error('[calculateRemoveLiquidityAmountsFromContract] Pool has zero shareSupply!');
        return { token1Amount: '0', token2Amount: '0' };
      }
      
      const totalShares = Big(shareSupplyStr);
      const userShares = Big(sharesContractUnits);

      // Calculate proportional share of each reserve
      // Formula: tokenAmount = (userShares * tokenReserve) / totalShares
      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id] || '0');
      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id] || '0');

      const token1Contract = userShares.mul(token1Reserve).div(totalShares);
      const token2Contract = userShares.mul(token2Reserve).div(totalShares);

      // Convert to display units
      const token1Display = Big(token1Contract.toFixed(0)).div(Big(10).pow(poolInfo.token1.decimals)).toFixed(6, 0);
      const token2Display = Big(token2Contract.toFixed(0)).div(Big(10).pow(poolInfo.token2.decimals)).toFixed(6, 0);

      return {
        token1Amount: token1Display,
        token2Amount: token2Display,
      };
    } catch (error) {
      console.error('[LiquidityCard] Error calculating remove amounts from contract:', error);
      console.error('[LiquidityCard] poolInfo:', poolInfo);
      console.error('[LiquidityCard] sharesContractUnits:', sharesContractUnits);
      return { token1Amount: '0', token2Amount: '0' };
    }
  }, [poolInfo]);

  // Handle token amount changes
  const handleToken1AmountChange = (amount: string) => {
    setToken1Amount(amount);
    
    // Clear the message when user manually types
    setShowGasReserveMessage(false);
    
    // Check if we need to show gas reserve warning
    if (poolInfo && (poolInfo.token1.id === 'wrap.near' || poolInfo.token1.id === 'near') && amount && rawBalances[poolInfo.token1.id]) {
      const rawBalance = rawBalances[poolInfo.token1.id];
      const reserveAmount = Big(0.25).mul(Big(10).pow(24)); // 0.25 NEAR in yocto
      const requestedAmount = Big(amount).mul(Big(10).pow(poolInfo.token1.decimals)); // User input in yocto
      const maxAvailable = Big(rawBalance).minus(reserveAmount); // Max they can have
      
      // Only show gas reserve message if amount is within balance but exceeds (balance - 0.25)
      // If amount exceeds total balance, insufficient funds message will show instead
      if (requestedAmount.lte(Big(rawBalance)) && requestedAmount.gt(maxAvailable) && maxAvailable.gt(0)) {
        setShowGasReserveInfo(true);
      } else {
        setShowGasReserveInfo(false);
      }
    } else {
      setShowGasReserveInfo(false);
    }
    
    if (liquidityState === 'add') {
      if (amount && amount !== '0') {
        const optimalAmount = calculateOptimalAmount(amount, poolInfo?.token1.id || '');
        setToken2Amount(optimalAmount);
      } else {
        // Clear the other field when this field is empty or 0
        setToken2Amount('');
      }
    }
  };

  const handleToken2AmountChange = (amount: string) => {
    setToken2Amount(amount);
    if (liquidityState === 'add') {
      if (amount && amount !== '0') {
        const optimalAmount = calculateOptimalAmount(amount, poolInfo?.token2.id || '');
        setToken1Amount(optimalAmount);
      } else {
        // Clear the other field when this field is empty or 0
        setToken1Amount('');
      }
    }
  };

  // Slippage handlers
  const handleSlippageChange = (value: number) => {
    setSlippage(value);
    setCustomSlippage('');
  };

  const handleCustomSlippage = (value: string) => {
    setCustomSlippage(value);
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 100) {
      setSlippage(numValue);
    }
  };

  // Format dollar amount with special handling for small numbers (matches swap widget)
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
        const decimalPart = fixedStr.split('.')[1] || '';
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

  // Handle liquidity operations
  const handleAddLiquidity = async () => {
    /**
     * Add Liquidity Flow - EXACTLY matches Ref Finance implementation
     * 
     * This implementation is verified against ref-finance/ref-ui source code:
     * - ref-ui/src/services/pool.ts (addLiquidityToPool function)
     * - ref-ui/src/services/token.ts (getDepositTransactions function)
     * - ref-ui/src/services/wrap-near.ts (nearDepositTransaction function)
     * 
     * Transaction Order (CRITICAL - matches Ref Finance exactly):
     * 1. register_tokens: Whitelist tokens on Ref Finance (if not already registered)
     * 2. storage_deposit: Register Ref Finance contract on token contracts (so tokens can be transferred)
     * 3. storage_deposit: Register user on token contracts (if not already registered)
     * 4. near_deposit: Wrap NEAR to wNEAR on wrap.near contract (if pool uses wNEAR)
     *    - Check if user registered on wrap.near (ftGetStorageBalance check)
     *    - Call storage_deposit on wrap.near if needed (0.00125 NEAR)
     *    - Call near_deposit with NEAR amount (50T gas)
     * 5. ft_transfer_call: Deposit tokens to Ref Finance's internal balance (100T gas each token)
     *    - receiver_id: v2.ref-finance.near
     *    - amount: token amount in yocto units
     *    - msg: '' (empty string - just deposit, don't swap)
     * 6. add_liquidity: Add tokens from Ref Finance balance to pool (150T gas)
     *    - For SIMPLE pools: { pool_id, amounts } - NO min_shares parameter
     *    - For STABLE pools: { pool_id, amounts, min_shares } - requires slippage protection
     * 
     * Key Differences from Stable Pools:
     * - Simple pools: Contract auto-calculates shares using sqrt(amount1 * amount2) for new pools
     *                 or proportional shares for existing pools
     * - Stable pools: Must specify min_shares for slippage protection
     * 
     * Pattern verified against:
     * - pool.ts lines 854-941: addLiquidityToPool
     * - pool.ts lines 982-1022: addLiquidityToStablePool
     * - wrap-near.ts lines 44-58: nearDepositTransaction
     * - token.ts lines 147-180: getDepositTransactions
     */
    if (!accountId || !poolInfo || !token1Amount || !token2Amount) return;

    setTransactionState('waitingForConfirmation');
    setError(null);

    try {
      let walletInstance = wallet;
      if (!walletInstance && connector) {
        const { wallet: connectedWallet } = await connector.getConnectedWallet();
        walletInstance = connectedWallet;
      }

      if (!walletInstance) {
        throw new Error('Please connect wallet');
      }

      // Parse amounts to contract format
      let amount1Parsed = parseTokenAmount(token1Amount, poolInfo.token1.decimals);
      let amount2Parsed = parseTokenAmount(token2Amount, poolInfo.token2.decimals);

      // Validate that inputs are not empty and contain valid numbers
      if (!token1Amount.trim() || !token2Amount.trim()) {
        throw new Error('Please enter amounts for both tokens');
      }

      // Check if parsing failed (returned '0' for invalid input)
      const amount1Num = parseFloat(token1Amount.replace(/,/g, '').trim());
      const amount2Num = parseFloat(token2Amount.replace(/,/g, '').trim());
      if (isNaN(amount1Num) || isNaN(amount2Num)) {
        throw new Error('Please enter valid numeric amounts');
      }

      // Check if amounts are positive
      if (amount1Num <= 0 || amount2Num <= 0) {
        throw new Error('Please enter positive amounts greater than 0');
      }

      // If parseTokenAmount failed but input is valid, try fallback parsing
      if (amount1Parsed === '0' && amount1Num > 0) {
        try {
          if (isNaN(amount1Num) || !isFinite(amount1Num) || amount1Num <= 0) {
            throw new Error(`Invalid NEAR amount for fallback parsing: ${amount1Num}`);
          }
          const fallbackAmount = new Big(amount1Num.toString()).times(new Big(10).pow(poolInfo.token1.decimals));
          amount1Parsed = fallbackAmount.toFixed(0);
        } catch (fallbackError) {
          console.error('[LiquidityCard] Fallback parsing failed for token1:', fallbackError);
          throw new Error('Failed to process NEAR amount. Please try a different amount.');
        }
      }

      if (amount2Parsed === '0' && amount2Num > 0) {
        try {
          if (isNaN(amount2Num) || !isFinite(amount2Num) || amount2Num <= 0) {
            throw new Error(`Invalid VEGANFRIENDS amount for fallback parsing: ${amount2Num}`);
          }
          const fallbackAmount = new Big(amount2Num.toString()).times(new Big(10).pow(poolInfo.token2.decimals));
          amount2Parsed = fallbackAmount.toFixed(0);
        } catch (fallbackError) {
          console.error('[LiquidityCard] Fallback parsing failed for token2:', fallbackError);
          throw new Error('Failed to process VEGANFRIENDS amount. Please try a different amount.');
        }
      }

      // Get the correct token order from the pool contract
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const provider = new providers.JsonRpcProvider({ url: rpcUrl });
      const poolResponse = await provider.query({
        request_type: 'call_function',
        account_id: 'v2.ref-finance.near',
        method_name: 'get_pool',
        args_base64: Buffer.from(JSON.stringify({ pool_id: POOL_ID })).toString('base64'),
        finality: 'final',
      }) as unknown as { result: number[] };

      const poolData = JSON.parse(Buffer.from(poolResponse.result).toString()) as {
        token_account_ids: string[];
        amounts: string[];
        total_shares: string;
      };

      // Create amounts array in the same order as token_account_ids
      const amounts: string[] = [];
      poolData.token_account_ids.forEach((tokenId: string) => {
        if (tokenId === 'wrap.near') {
          amounts.push(amount1Parsed);
        } else if (tokenId === 'veganfriends.tkn.near') {
          amounts.push(amount2Parsed);
        }
      });

      // For simple pools, the contract calculates shares automatically
      // We don't need to predict or specify minimum shares like stable pools do
      // The contract uses the formula: shares = sqrt(amount1 * amount2) for new pools
      // or proportional shares for existing pools
      // We just need to send min_amounts for slippage protection instead
      const minSharesWithSlippage = '0';

      // SMART DEPOSIT DETECTION: Check what's already deposited in Ref Finance
      const depositedBalances = await getRefDepositedBalances(poolData.token_account_ids);

      // Calculate what needs to be deposited (needed - already_deposited)
      const depositsNeeded: Record<string, { needed: string; alreadyDeposited: string; toDeposit: string }> = {};
      poolData.token_account_ids.forEach((tokenId: string, index: number) => {
        const needed = Big(amounts[index]);
        const alreadyDeposited = Big(depositedBalances[tokenId] || '0');
        const toDeposit = needed.gt(alreadyDeposited) ? needed.minus(alreadyDeposited) : Big(0);
        
        depositsNeeded[tokenId] = {
          needed: needed.toFixed(0),
          alreadyDeposited: alreadyDeposited.toFixed(0),
          toDeposit: toDeposit.toFixed(0),
        };
      });
      
      // Check if we can skip all deposits (already have enough deposited)
      const canSkipAllDeposits = Object.values(depositsNeeded).every(d => d.toDeposit === '0');
      if (canSkipAllDeposits) {
        console.warn('[LiquidityCard] ✅ All tokens already deposited! Skipping deposit step, going straight to add_liquidity.');
      }

      // Check token registrations
      const token1Registered = await checkStorageDeposit(poolInfo.token1.id, accountId, rpcUrl);
      const token2Registered = await checkStorageDeposit(poolInfo.token2.id, accountId, rpcUrl);

      // Build transactions array - Ref Finance builds in forward order then executes
      // DO NOT use unshift() - array index 0 executes first
      const transactions: any[] = [];

      // Step 1: Wrap NEAR first if needed (only wrap the difference if some already deposited)
      const wNearIndex = poolData.token_account_ids.indexOf('wrap.near');
      if (wNearIndex !== -1) {
        const wNearToDeposit = depositsNeeded['wrap.near']?.toDeposit || '0';
        
        if (wNearToDeposit !== '0') {
          console.warn(`[LiquidityCard] Need to wrap ${formatTokenAmount(wNearToDeposit, 24, 6)} NEAR (already deposited: ${formatTokenAmount(depositsNeeded['wrap.near']?.alreadyDeposited || '0', 24, 6)})`);
          
          // Check if user is registered on wrap.near FIRST
          const wrapNearRegistered = await checkStorageDeposit('wrap.near', accountId, rpcUrl);
          if (!wrapNearRegistered) {
            // Add storage_deposit for wrap.near FIRST
            transactions.push({
              receiverId: 'wrap.near',
              actions: [{
                type: 'FunctionCall',
                params: {
                  methodName: 'storage_deposit',
                  args: {
                    account_id: accountId,
                    registration_only: true,
                  },
                  gas: '30000000000000',
                  deposit: '1250000000000000000000', // 0.00125 NEAR for storage
                },
              }],
            });
          }

          // Then wrap NEAR (only the amount needed)
          transactions.push({
            receiverId: 'wrap.near',
            actions: [{
              type: 'FunctionCall',
              params: {
                methodName: 'near_deposit',
                args: {},
                gas: '50000000000000',
                deposit: wNearToDeposit, // Only wrap what we need
              },
            }],
          });
        } else {
          console.warn(`[LiquidityCard] ✅ Skipping NEAR wrap - already have ${formatTokenAmount(depositsNeeded['wrap.near']?.alreadyDeposited || '0', 24, 6)} NEAR deposited`);
        }
      }

      // Step 2: Register user on token contracts if needed
      if (!token1Registered) {
        const minDeposit1 = await getMinStorageBalance(poolInfo.token1.id, rpcUrl);
        transactions.push({
          receiverId: poolInfo.token1.id,
          actions: [{
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              deposit: minDeposit1,
            },
          }],
        });
      }

      if (!token2Registered) {
        const minDeposit2 = await getMinStorageBalance(poolInfo.token2.id, rpcUrl);
        transactions.push({
          receiverId: poolInfo.token2.id,
          actions: [{
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              deposit: minDeposit2,
            },
          }],
        });
      }

      // Step 3: Register Ref Finance on token contracts if needed
      for (const tokenId of poolData.token_account_ids) {
        const refRegisteredOnToken = await checkStorageDeposit(tokenId, 'v2.ref-finance.near', rpcUrl);
        if (!refRegisteredOnToken) {
          const minDeposit = await getMinStorageBalance(tokenId, rpcUrl);
          transactions.push({
            receiverId: tokenId,
            actions: [{
              type: 'FunctionCall',
              params: {
                methodName: 'storage_deposit',
                args: {
                  account_id: 'v2.ref-finance.near',
                  registration_only: true,
                },
                gas: '30000000000000',
                deposit: minDeposit,
              },
            }],
          });
        }
      }

      // Step 4: Register tokens on Ref Finance whitelist if needed
      try {
        const userTokensResponse = await provider.query({
          request_type: 'call_function',
          account_id: 'v2.ref-finance.near',
          method_name: 'get_user_whitelisted_tokens',
          args_base64: Buffer.from(JSON.stringify({ account_id: accountId })).toString('base64'),
          finality: 'final',
        }) as unknown as { result: number[] };
        
        const userWhitelistedTokens = JSON.parse(Buffer.from(userTokensResponse.result).toString()) as string[];
        const needsWhitelistToken1 = !userWhitelistedTokens.includes(poolInfo.token1.id);
        const needsWhitelistToken2 = !userWhitelistedTokens.includes(poolInfo.token2.id);
        
        if (needsWhitelistToken1 || needsWhitelistToken2) {
          const tokensToRegister: string[] = [];
          if (needsWhitelistToken1) tokensToRegister.push(poolInfo.token1.id);
          if (needsWhitelistToken2) tokensToRegister.push(poolInfo.token2.id);
          
          console.warn('[LiquidityCard] Registering tokens on Ref Finance:', tokensToRegister);
          
          transactions.push({
            receiverId: 'v2.ref-finance.near',
            actions: [{
              type: 'FunctionCall',
              params: {
                methodName: 'register_tokens',
                args: {
                  token_ids: tokensToRegister,
                },
                gas: '30000000000000',
                deposit: '1', // 1 yoctoNEAR
              },
            }],
          });
        }
      } catch (whitelistError) {
        console.warn('[LiquidityCard] Could not check whitelisted tokens, skipping:', whitelistError);
      }

      // Step 5: Deposit tokens to Ref Finance contract using ft_transfer_call
      // This is CRITICAL - tokens must be deposited before add_liquidity can use them
      // SMART: Only deposit the difference (needed - already_deposited)
      poolData.token_account_ids.forEach((tokenId: string, index: number) => {
        const toDeposit = depositsNeeded[tokenId]?.toDeposit || '0';
        
        if (toDeposit !== '0') {
          console.warn(`[LiquidityCard] Will deposit ${formatTokenAmount(toDeposit, tokenId === 'wrap.near' ? 24 : 18, 6)} of ${tokenId}`);
          transactions.push({
            receiverId: tokenId,
            actions: [{
              type: 'FunctionCall',
              params: {
                methodName: 'ft_transfer_call',
                args: {
                  receiver_id: 'v2.ref-finance.near',
                  amount: toDeposit, // Only deposit what we need
                  msg: '', // Empty string means just deposit to Ref Finance balance
                },
                gas: '100000000000000',
                deposit: '1', // 1 yoctoNEAR
              },
            }],
          });
        } else {
          console.warn(`[LiquidityCard] ✅ Skipping deposit for ${tokenId} - already have ${formatTokenAmount(depositsNeeded[tokenId]?.alreadyDeposited || '0', tokenId === 'wrap.near' ? 24 : 18, 6)} deposited`);
        }
      });

      // Step 6: Main add liquidity transaction
      // For simple pools, we only pass pool_id and amounts (NO min_shares - that's for stable pools only)
      // IMPORTANT: Ref Finance requires 0.00078 NEAR for LP storage deposit
      transactions.push({
        receiverId: 'v2.ref-finance.near',
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'add_liquidity',
            args: {
              pool_id: POOL_ID,
              amounts,
            },
            gas: '150000000000000',
            deposit: '780000000000000000000', // 0.00078 NEAR - required for LP storage
          },
        }],
      });

      console.warn('[LiquidityCard] Sending add liquidity transactions:', transactions.length);

      try {
        const outcomes = await walletInstance.signAndSendTransactions({
          transactions,
        });

        // Some wallets return the transaction hash directly, others return outcomes array
        if (outcomes) {
          // If outcomes is a string, it's likely a transaction hash
          if (typeof outcomes === 'string') {
            setTx(outcomes);
            // Wait for blockchain to finalize (add_liquidity needs more time)
            await new Promise(resolve => setTimeout(resolve, 1500));
            // Start fetches immediately (they will set loading states)
            const balancePromise = fetchBalances();
            const sharesPromise = fetchUserShares();
            const poolPromise = fetchPoolInfo();
            // Small delay to ensure fetch functions have set their loading states
            await new Promise(resolve => setTimeout(resolve, 100));
            setTransactionState('success');
            return;
          }
          
          // If outcomes is an array with results
          if (Array.isArray(outcomes) && outcomes.length > 0) {
            const finalOutcome = outcomes[outcomes.length - 1];
            const txHash = finalOutcome?.transaction?.hash ?? finalOutcome?.transaction_outcome?.id;

            if (txHash) {
              setTx(txHash);
              // Wait for blockchain to finalize (add_liquidity needs more time)
              await new Promise(resolve => setTimeout(resolve, 1500));
              // Start fetches immediately (they will set loading states)
              const balancePromise = fetchBalances();
              const sharesPromise = fetchUserShares();
              const poolPromise = fetchPoolInfo();
              // Small delay to ensure fetch functions have set their loading states
              await new Promise(resolve => setTimeout(resolve, 100));
              setTransactionState('success');
              return;
            }
          }
        }
        
        // If we didn't get a clear success, mark as waiting for confirmation
        setTransactionState('waitingForConfirmation');
      } catch (txError: any) {
        // Re-throw to be caught by outer catch
        throw txError;
      }
    } catch (err: any) {
      console.error('[LiquidityCard] Add liquidity error:', err);
      
      // Handle case where err is null (user rejected transaction)
      if (err === null || err === undefined) {
        setError('Transaction was cancelled');
        setTransactionState(null);
      } else {
        setError(err?.message || String(err) || 'Failed to add liquidity');
        setTransactionState('fail');
      }
    }
  };

  const handleRemoveLiquidity = async () => {
    if (!accountId || !poolInfo || !token1Amount) return;

    setTransactionState('waitingForConfirmation');
    setError(null);

    try {
      let walletInstance = wallet;
      if (!walletInstance && connector) {
        const { wallet: connectedWallet } = await connector.getConnectedWallet();
        walletInstance = connectedWallet;
      }

      if (!walletInstance) {
        throw new Error('Please connect wallet');
      }

      // Parse shares amount to contract format
      const sharesToRemove = parseTokenAmount(token1Amount, 24); // LP tokens have 24 decimals

      // Validate shares amount
      if (sharesToRemove === '0') {
        throw new Error('Please enter a valid amount of LP shares to remove');
      }

      // Validate that amount is positive and doesn't exceed user shares
      const sharesNum = parseFloat(token1Amount);
      if (isNaN(sharesNum) || sharesNum <= 0) {
        throw new Error('Please enter a valid positive amount');
      }
      
      // Compare using Big.js to avoid floating point precision issues
      const requestedShares = Big(sharesToRemove);
      const availableShares = Big(userShares);
      if (requestedShares.gt(availableShares)) {
        throw new Error('Cannot remove more shares than you own');
      }

      // Get the correct token order from the pool contract
      const provider = new providers.JsonRpcProvider({ url: process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org' });
      const poolResponse = await provider.query({
        request_type: 'call_function',
        account_id: 'v2.ref-finance.near',
        method_name: 'get_pool',
        args_base64: Buffer.from(JSON.stringify({ pool_id: POOL_ID })).toString('base64'),
        finality: 'final',
      }) as unknown as { result: number[] };

      const poolData = JSON.parse(Buffer.from(poolResponse.result).toString()) as {
        token_account_ids: string[];
        amounts: string[];
        total_shares: string;
      };

      // Calculate minimum amounts to receive (with slippage protection)
      const shareSupplyStr = String(poolInfo.shareSupply || '0');
      const totalReserve1Str = String(poolInfo.reserves['wrap.near'] || poolInfo.reserves[poolInfo.token1.id] || '0');
      const totalReserve2Str = String(poolInfo.reserves['veganfriends.tkn.near'] || poolInfo.reserves[poolInfo.token2.id] || '0');
      
      // Check for zero total shares (empty pool)
      if (shareSupplyStr === '0' || !shareSupplyStr) {
        throw new Error('Pool has no total shares. Cannot calculate removal amounts.');
      }
      
      const totalShares = Big(shareSupplyStr);
      const sharesToRemoveBig = Big(sharesToRemove);
      const totalReserve1 = Big(totalReserve1Str);
      const totalReserve2 = Big(totalReserve2Str);

      // Calculate proportional amounts: amount = (shares_to_remove / total_shares) * reserve
      const amount1 = sharesToRemoveBig.mul(totalReserve1).div(totalShares);
      const amount2 = sharesToRemoveBig.mul(totalReserve2).div(totalShares);

      // Apply slippage protection based on user setting
      const slippageMultiplier = Big(1 - slippage / 100);
      const minAmount1 = amount1.mul(slippageMultiplier).toFixed(0);
      const minAmount2 = amount2.mul(slippageMultiplier).toFixed(0);

      // Create min_amounts array in the same order as token_account_ids
      const minAmounts: string[] = [];
      poolData.token_account_ids.forEach((tokenId: string) => {
        if (tokenId === 'wrap.near') {
          minAmounts.push(minAmount1);
        } else if (tokenId === 'veganfriends.tkn.near') {
          minAmounts.push(minAmount2);
        }
      });

      // Check token registrations
      const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
      const token1Registered = await checkStorageDeposit(poolInfo.token1.id, accountId, rpcUrl);
      const token2Registered = await checkStorageDeposit(poolInfo.token2.id, accountId, rpcUrl);

      const transactions: any[] = [];

      // Add registration transactions if needed
      if (!token1Registered) {
        const minDeposit1 = await getMinStorageBalance(poolInfo.token1.id, rpcUrl);
        transactions.push({
          receiverId: poolInfo.token1.id,
          actions: [{
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              deposit: minDeposit1,
            },
          }],
        });
      }

      if (!token2Registered) {
        const minDeposit2 = await getMinStorageBalance(poolInfo.token2.id, rpcUrl);
        transactions.push({
          receiverId: poolInfo.token2.id,
          actions: [{
            type: 'FunctionCall',
            params: {
              methodName: 'storage_deposit',
              args: {
                registration_only: true,
                account_id: accountId,
              },
              gas: '30000000000000',
              deposit: minDeposit2,
            },
          }],
        });
      }

      // Main remove liquidity transaction - this puts tokens in Ref Finance internal balance
      transactions.push({
        receiverId: 'v2.ref-finance.near',
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'remove_liquidity',
            args: {
              pool_id: POOL_ID,
              shares: sharesToRemove,
              min_amounts: minAmounts,
            },
            gas: '150000000000000',
            deposit: '1',
          },
        }],
      });

      // Withdraw token 1 from Ref Finance internal balance to wallet
      // skip_unwrap_near: false means wNEAR will be automatically unwrapped to native NEAR
      transactions.push({
        receiverId: 'v2.ref-finance.near',
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'withdraw',
            args: {
              token_id: poolInfo.token1.id,
              amount: '0', // '0' means withdraw all available balance
              unregister: false,
              skip_unwrap_near: false, // Auto-unwrap wNEAR to native NEAR
            },
            gas: '100000000000000',
            deposit: '1',
          },
        }],
      });

      // Withdraw token 2 from Ref Finance internal balance to wallet
      transactions.push({
        receiverId: 'v2.ref-finance.near',
        actions: [{
          type: 'FunctionCall',
          params: {
            methodName: 'withdraw',
            args: {
              token_id: poolInfo.token2.id,
              amount: '0', // '0' means withdraw all available balance
              unregister: false,
              skip_unwrap_near: false, // Auto-unwrap wNEAR to native NEAR (no effect for other tokens)
            },
            gas: '100000000000000',
            deposit: '1',
          },
        }],
      });

      const outcomes = await walletInstance.signAndSendTransactions({
        transactions,
      });

      if (outcomes && outcomes.length > 0) {
        const finalOutcome = outcomes[outcomes.length - 1];
        const txHash = finalOutcome?.transaction?.hash ?? finalOutcome?.transaction_outcome?.id;

        if (txHash) {
          setTx(txHash);
          // Wait for blockchain to finalize
          await new Promise(resolve => setTimeout(resolve, 1500));
          // Start fetches immediately (they will set loading states)
          const balancePromise = fetchBalances();
          const sharesPromise = fetchUserShares();
          const poolPromise = fetchPoolInfo();
          // Small delay to ensure fetch functions have set their loading states
          await new Promise(resolve => setTimeout(resolve, 100));
          setTransactionState('success');
        } else {
          setTransactionState('waitingForConfirmation');
        }
      } else {
        setTransactionState('waitingForConfirmation');
      }
    } catch (err: any) {
      console.error('[LiquidityCard] Remove liquidity error:', err);
      
      // Handle case where err is null (user rejected transaction)
      if (err === null || err === undefined) {
        setError('Transaction was cancelled');
        setTransactionState(null);
      } else {
        setError(err?.message || String(err) || 'Failed to remove liquidity');
        setTransactionState('fail');
      }
    }
  };

  return (
    <div className="w-full max-w-[480px] mx-auto">
      {/* Main Card */}
      <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-lg relative">
        {/* Loading Overlay */}
        {isLoadingPool && (
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
            <div className="flex flex-col items-center gap-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="text-sm text-muted-foreground">Loading pool information...</span>
            </div>
          </div>
        )}
        
        {/* Header */}
        <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 rounded-t-2xl -m-4 sm:-m-6 md:-m-8 mb-4 md:mb-6 shadow-sm">
          <div className="p-4 sm:p-5 md:p-6">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center justify-center">
                  {poolInfo?.token1.icon ? (
                    <img
                      src={poolInfo.token1.icon}
                      alt={poolInfo.token1.symbol}
                      className="w-8 h-8 rounded-full relative z-10"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center relative z-10">
                      <span className="text-primary font-bold text-sm">N</span>
                    </div>
                  )}
                  {poolInfo?.token2.icon ? (
                    <img
                      src={poolInfo.token2.icon}
                      alt={poolInfo.token2.symbol}
                      className="w-8 h-8 rounded-full -ml-1"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-verified/20 flex items-center justify-center -ml-1">
                      <span className="text-verified font-bold text-sm">V</span>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold">
                    {poolInfo ? `${poolInfo.token1.symbol} / ${poolInfo.token2.symbol}` : 'NEAR / VEGANFRIENDS'}
                  </h3>
                  <p className="text-muted-foreground text-xs">Pool #{POOL_ID}</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 bg-card/50 hover:bg-card border border-border/50 rounded-full transition-all duration-200 hover:shadow-md"
              >
                <Settings className="w-5 h-5 text-muted-foreground hover:text-primary transition-colors" />
              </button>
            </div>
            {poolInfo && (
              <div className="space-y-2 pt-3 border-t border-border/30">
                <div className="flex items-center justify-center gap-4 text-sm pb-3 border-b border-border/30">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">NEAR:</span>
                    <span className="font-semibold text-primary">{formatTokenAmount(poolInfo.reserves[poolInfo.token1.id], poolInfo.token1.decimals, 2)}</span>
                  </div>
                  <span className="text-muted-foreground">•</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground">VF:</span>
                    <span className="font-semibold text-primary">{formatTokenAmount(poolInfo.reserves[poolInfo.token2.id], poolInfo.token2.decimals, 2)}</span>
                  </div>
                </div>
                <div className="grid grid-cols-4 gap-3 text-xs">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-0.5">TVL</p>
                    <p className="font-semibold text-primary">{(() => {
                      const token1Price = tokenPrices[poolInfo.token1.id] || tokenPrices['near'] || tokenPrices['wrap.near'] || 0;
                      const token2Price = tokenPrices[poolInfo.token2.id] || 0;
                      
                      if (token1Price > 0 || token2Price > 0) {
                        const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id]).div(Big(10).pow(poolInfo.token1.decimals));
                        const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id]).div(Big(10).pow(poolInfo.token2.decimals));
                        const token1TVL = token1Reserve.mul(token1Price);
                        const token2TVL = token2Reserve.mul(token2Price);
                        const totalTVL = token1TVL.plus(token2TVL).toNumber();
                        
                        return formatDollarAmount(totalTVL);
                      }
                      return '-';
                    })()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground mb-0.5">Volume</p>
                    <p className="font-semibold text-primary">{(() => {
                      const vol = Number(poolStats.volume24h);
                      if (vol === 0) return '$0';
                      if (vol < 0.01) return '<$0.01';
                      return formatDollarAmount(vol);
                    })()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground mb-0.5">Fee(24h)</p>
                    <p className="font-semibold text-primary">{(() => {
                      const fee = Number(poolStats.fee24h);
                      if (fee === 0) return '$0';
                      if (fee < 0.01) return '<$0.01';
                      return formatDollarAmount(fee);
                    })()}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-muted-foreground mb-0.5">APY</p>
                    <p className="font-semibold text-primary">{(() => {
                      if (poolStats.apy === 0) return '0%';
                      if (poolStats.apy < 0.01) return '<0.01%';
                      return `${poolStats.apy.toFixed(2)}%`;
                    })()}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Settings Panel */}
        {showSettings && (
          <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-lg space-y-3">
            <div>
              <p className="text-xs sm:text-sm font-medium text-foreground mb-2">Slippage Tolerance</p>
              <div className="flex gap-2 mb-2">
                {SLIPPAGE_PRESETS.map((preset) => (
                  <button
                    key={preset.value}
                    onClick={() => handleSlippageChange(preset.value)}
                    className={`flex-1 px-3 py-2 rounded-full text-xs font-medium transition-colors ${
                      slippage === preset.value && !customSlippage
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-card hover:bg-muted-foreground/10'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <TokenInput
                  value={customSlippage}
                  onChange={handleCustomSlippage}
                  placeholder="Custom"
                  className="flex-1 px-3 py-2 bg-transparent border border-border rounded-full text-xs focus:outline-none focus:border-primary/50 focus:shadow-lg transition-all placeholder:text-primary placeholder:font-medium placeholder:opacity-60"
                  decimalLimit={2}
                />
                <span className="text-xs text-muted-foreground">%</span>
              </div>
            </div>
            <div className="flex items-start gap-2 p-2 bg-primary/10 rounded-full">
              <Info className="w-4 h-4 text-primary mt-0.5" />
              <p className="text-xs text-muted-foreground">
                Your transaction will revert if the price changes unfavorably by more than this
                percentage.
              </p>
            </div>
          </div>
        )}

        {/* Your Liquidity Summary */}
        {poolInfo && userShares && Number(userShares) > 0 && (
          <div className="bg-card border border-border rounded-2xl p-4 shadow-lg space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <p className="text-sm font-medium text-foreground">Your Liquidity</p>
                <span className="text-sm text-muted-foreground">
                  {(() => {
                    // Calculate percentage of total pool shares
                    const userSharesBig = Big(userShares);
                    const totalSharesBig = Big(poolInfo.shareSupply || '0');
                    
                    if (totalSharesBig.gt(0)) {
                      const percentage = userSharesBig.div(totalSharesBig).mul(100);
                      const percentageValue = percentage.toNumber();
                      
                      if (percentageValue < 0.01) {
                        return '(< 0.01%)';
                      } else {
                        return `(${percentageValue.toFixed(2)}%)`;
                      }
                    }
                    
                    return '';
                  })()}
                </span>
              </div>
              <div className="text-sm font-medium text-foreground">
                {formatTokenAmount(userShares, 24, 6)}
                <span className="text-muted-foreground ml-1">
                  ({(() => {
                    // Calculate USD value using pool TVL method (like Ref Finance)
                    let usdDisplay = '$0.00';
                    let token1Price = tokenPrices[poolInfo.token1.id] || tokenPrices['near'] || 0;
                    let token2Price = tokenPrices[poolInfo.token2.id] || 0;
                    
                    // If one token price is missing, derive it from pool ratio (AMM formula)
                    if (token1Price > 0 && token2Price === 0) {
                      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id])
                        .div(Big(10).pow(poolInfo.token1.decimals));
                      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id])
                        .div(Big(10).pow(poolInfo.token2.decimals));
                      token2Price = token1Reserve.div(token2Reserve).mul(token1Price).toNumber();
                    } else if (token2Price > 0 && token1Price === 0) {
                      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id])
                        .div(Big(10).pow(poolInfo.token1.decimals));
                      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id])
                        .div(Big(10).pow(poolInfo.token2.decimals));
                      token1Price = token2Reserve.div(token1Reserve).mul(token2Price).toNumber();
                    }
                    
                    // Show USD value if at least one token has a price
                    if (token1Price > 0 || token2Price > 0) {
                      const token1Reserve = Big(poolInfo.reserves[poolInfo.token1.id])
                        .div(Big(10).pow(poolInfo.token1.decimals));
                      const token2Reserve = Big(poolInfo.reserves[poolInfo.token2.id])
                        .div(Big(10).pow(poolInfo.token2.decimals));
                      
                      const token1TVL = token1Reserve.mul(token1Price);
                      const token2TVL = token2Reserve.mul(token2Price);
                      const poolTVL = token1TVL.plus(token2TVL);
                      
                      const readableShares = Big(userShares).div(Big(10).pow(24));
                      const totalShares = Big(poolInfo.shareSupply).div(Big(10).pow(24));
                      const singleLpValue = poolTVL.div(totalShares);
                      const totalUsdValue = singleLpValue.mul(readableShares).toNumber();
                      
                      if (totalUsdValue < 0.01 && totalUsdValue > 0) {
                        usdDisplay = '< $0.01';
                      } else if (totalUsdValue > 0) {
                        usdDisplay = `$${totalUsdValue.toLocaleString('en-US', { 
                          minimumFractionDigits: 2, 
                          maximumFractionDigits: 2 
                        })}`;
                      }
                    }
                    
                    return usdDisplay;
                  })()})
                </span>
              </div>
            </div>
            {(() => {
              // userShares is already in contract units, use the contract-based calculation
              const amounts = calculateRemoveLiquidityAmountsFromContract(userShares);

              return (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {poolInfo.token1.icon ? (
                        <img
                          src={poolInfo.token1.icon}
                          alt={poolInfo.token1.symbol}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gradient-to-br from-verified/20 to-verified/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-verified">N</span>
                        </div>
                      )}
                      <span className="text-muted-foreground text-xs">{poolInfo.token1.symbol}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-xs">
                        {amounts.token1Amount}
                        {tokenPrices[poolInfo.token1.id] && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatDollarAmount(parseFloat(amounts.token1Amount) * (tokenPrices[poolInfo.token1.id] || tokenPrices['near'] || tokenPrices['wrap.near'] || 0))})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {poolInfo.token2.icon ? (
                        <img
                          src={poolInfo.token2.icon}
                          alt={poolInfo.token2.symbol}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">V</span>
                        </div>
                      )}
                      <span className="text-muted-foreground text-xs">{poolInfo.token2.symbol}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-xs">
                        {formatTokenAmount(
                          parseTokenAmount(amounts.token2Amount, poolInfo.token2.decimals),
                          poolInfo.token2.decimals,
                          2
                        )}
                        {tokenPrices[poolInfo.token2.id] && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatDollarAmount(parseFloat(amounts.token2Amount) * tokenPrices[poolInfo.token2.id])})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* Empty State - No Liquidity */}
        {poolInfo && accountId && (!userShares || Number(userShares) === 0) && (
          <div className="bg-gradient-to-br from-verified/5 to-primary/5 border border-border rounded-xl p-4 space-y-2">
            <div className="flex items-start gap-3">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-verified/10 text-primary flex-shrink-0 mt-0.5">
                <Droplets className="w-5 h-5" />
              </div>
              <div className="space-y-1 flex-1 min-w-0">
                <h3 className="text-sm font-semibold text-foreground">Help Others Trade</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Your tokens help others swap easily. You'll get a share of fees as a thank-you.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {!liquidityState && (
          <div className="space-y-3">
            <button
              onClick={() => setLiquidityState('add')}
              disabled={!accountId}
              className="w-full py-3 px-4 bg-verified/10 hover:bg-verified/20 border border-verified text-primary font-semibold rounded-full transition-colors flex items-center justify-center gap-2 text-sm shadow-md shadow-verified/20 hover:shadow-lg hover:shadow-verified/30 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-verified/10 disabled:shadow-none"
            >
              <Plus className="w-4 h-4" />
              Add Liquidity
            </button>
            <button
              onClick={() => setLiquidityState('remove')}
              disabled={!accountId}
              className="w-full py-3 px-4 bg-primary/10 hover:bg-primary/20 border border-primary text-primary font-semibold rounded-full transition-colors flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary/10"
            >
              <Minus className="w-4 h-4" />
              Remove Liquidity
            </button>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg shadow-md">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500 flex-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setTransactionState(null);
              }}
              className="text-red-500 hover:text-red-600 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Powered by Ref Finance • Earn trading fees
          </p>
        </div>
      </div>

      {/* Add Liquidity Form - Separate Card */}
      {liquidityState === 'add' && poolInfo && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-lg mt-4">
          <div className="space-y-4">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <button
                onClick={() => {
                  setLiquidityState(null);
                  setToken1Amount('');
                  setToken2Amount('');
                  setShowGasReserveInfo(false);
                  setShowGasReserveMessage(false);
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group p-2 rounded-md"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </button>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-primary">Add Liquidity</h4>
              </div>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>

            {/* Token 1 Input */}
            <div className="space-y-2">
              {accountId && rawBalances[poolInfo.token1.id] && rawBalances[poolInfo.token1.id] !== '0' && (
                <div className="flex gap-2 justify-end">
                  {[25, 50, 75].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => {
                        const rawBalance = rawBalances[poolInfo.token1.id];
                        if (rawBalance) {
                          let availableBalance = Big(rawBalance);
                          let reserveApplied = false;
                          
                          // Check if user is trying to use more than available (need to reduce for gas reserve)
                          if (poolInfo.token1.id === 'wrap.near' || poolInfo.token1.id === 'near') {
                            const reserveAmount = Big(0.25).mul(Big(10).pow(24)); // 0.25 NEAR in yocto
                            const requestedAmount = Big(rawBalance).mul(percent).div(100); // What user wants
                            const maxAvailable = Big(rawBalance).minus(reserveAmount); // Max they can have
                            
                            // Only show message if requested amount exceeds what's available after reserve
                            if (requestedAmount.gt(maxAvailable) && maxAvailable.gt(0)) {
                              reserveApplied = true;
                            }
                            // Always use max available (balance - 0.25) for calculation
                            availableBalance = maxAvailable.lt(0) ? Big(0) : maxAvailable;
                          }
                          
                          const percentBalance = availableBalance.mul(percent).div(100);
                          const displayValue = percentBalance.div(Big(10).pow(poolInfo.token1.decimals)).toFixed(poolInfo.token1.decimals, Big.roundDown);
                          
                          // Update states BEFORE setting amount to avoid race conditions
                          setShowGasReserveInfo(reserveApplied);
                          setShowGasReserveMessage(reserveApplied);
                          setToken1Amount(displayValue);
                          
                          // Calculate optimal amount for token2 if adding liquidity
                          if (liquidityState === 'add' && displayValue && displayValue !== '0') {
                            const optimalAmount = calculateOptimalAmount(displayValue, poolInfo.token1.id);
                            setToken2Amount(optimalAmount);
                          }
                        }
                      }}
                      className="px-1 py-0.5 text-xs bg-card hover:bg-muted rounded-full border border-border text-primary font-semibold opacity-60 hover:opacity-80 transition-all whitespace-nowrap"
                    >
                      {percent}%
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const rawBalance = rawBalances[poolInfo.token1.id];
                      if (rawBalance) {
                        let availableBalance = Big(rawBalance);
                        let reserveApplied = false;
                        
                        // Check if user is trying to use more than available (need to reduce for gas reserve)
                        if (poolInfo.token1.id === 'wrap.near' || poolInfo.token1.id === 'near') {
                          const reserveAmount = Big(0.25).mul(Big(10).pow(24)); // 0.25 NEAR in yocto
                          const maxAvailable = Big(rawBalance).minus(reserveAmount); // Max they can have
                          
                          // MAX button always reduces amount to keep 0.25 NEAR, so show message
                          if (Big(rawBalance).gt(reserveAmount)) {
                            reserveApplied = true;
                          }
                          // Always use max available (balance - 0.25) for calculation
                          availableBalance = maxAvailable.lt(0) ? Big(0) : maxAvailable;
                        }
                        
                        const displayValue = availableBalance.div(Big(10).pow(poolInfo.token1.decimals)).toFixed(poolInfo.token1.decimals, Big.roundDown);
                        
                        // Update states BEFORE setting amount to avoid race conditions
                        setShowGasReserveInfo(false); // MAX doesn't disable button
                        setShowGasReserveMessage(reserveApplied); // But does show message
                        setToken1Amount(displayValue);
                        
                        // Calculate optimal amount for token2 if adding liquidity
                        if (liquidityState === 'add' && displayValue && displayValue !== '0') {
                          const optimalAmount = calculateOptimalAmount(displayValue, poolInfo.token1.id);
                          setToken2Amount(optimalAmount);
                        }
                      }
                    }}
                    className="px-1 py-0.5 text-xs bg-card hover:bg-muted rounded-full border border-border text-primary font-semibold opacity-60 hover:opacity-80 transition-all whitespace-nowrap"
                  >
                    MAX
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 p-4 border border-border rounded-full transition-all hover:border-primary/50 hover:shadow-lg">
                {poolInfo.token1.icon ? (
                  <img 
                    src={poolInfo.token1.icon} 
                    alt={poolInfo.token1.symbol}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-verified/20 to-verified/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-verified">N</span>
                  </div>
                )}
                <div className="flex flex-col items-start w-[200px]">
                  <span className="font-semibold text-foreground text-sm">{poolInfo.token1.symbol}</span>
                  {accountId && (
                    <div className="flex flex-col items-start mt-1 ml-3">
                      <span className="text-xs text-muted-foreground">
                        Balance: {isLoadingBalances ? '...' : (() => {
                          const rawBalance = rawBalances[poolInfo.token1.id];
                          if (!rawBalance || rawBalance === '0') return '0';
                          return formatTokenAmount(rawBalance, poolInfo.token1.decimals, 6);
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <TokenInput
                    value={token1Amount}
                    onChange={handleToken1AmountChange}
                    placeholder="0.0"
                    disabled={!accountId}
                    decimalLimit={poolInfo.token1.decimals}
                  />
                  {token1Amount && (() => {
                    const price = tokenPrices[poolInfo.token1.id] || tokenPrices['near'] || tokenPrices['wrap.near'];
                    console.log('[LiquidityCard] Token1 display - ID:', poolInfo.token1.id, 'All prices:', tokenPrices, 'Selected price:', price, 'Amount:', token1Amount);
                    if (!price) {
                      console.warn('[LiquidityCard] No price found for NEAR token!');
                      return null;
                    }
                    const usdValue = parseFloat(token1Amount) * price;
                    console.log('[LiquidityCard] USD value calculated:', usdValue);
                    return (
                      <div className="absolute top-8 right-4 text-xs text-muted-foreground">
                        ≈ {formatDollarAmount(usdValue)}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Token 2 Input */}
            <div className="space-y-2">
              {accountId && rawBalances[poolInfo.token2.id] && rawBalances[poolInfo.token2.id] !== '0' && (
                <div className="flex gap-2 justify-end">
                  {[25, 50, 75].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => {
                        const rawBalance = rawBalances[poolInfo.token2.id];
                        if (rawBalance) {
                          const availableBalance = Big(rawBalance);
                          const percentBalance = availableBalance.mul(percent).div(100);
                          const displayValue = percentBalance.div(Big(10).pow(poolInfo.token2.decimals)).toFixed(poolInfo.token2.decimals, Big.roundDown);
                          
                          setToken2Amount(displayValue);
                          
                          // Calculate optimal amount for token1 if adding liquidity
                          if (liquidityState === 'add' && displayValue && displayValue !== '0') {
                            const optimalAmount = calculateOptimalAmount(displayValue, poolInfo.token2.id);
                            setToken1Amount(optimalAmount);
                            // Clear gas reserve warnings since we're recalculating token1 amount
                            setShowGasReserveInfo(false);
                            setShowGasReserveMessage(false);
                          }
                        }
                      }}
                      className="px-1 py-0.5 text-xs bg-card hover:bg-muted rounded-full border border-border text-primary font-semibold opacity-60 hover:opacity-80 transition-all whitespace-nowrap"
                    >
                      {percent}%
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const rawBalance = rawBalances[poolInfo.token2.id];
                      if (rawBalance) {
                        const availableBalance = Big(rawBalance);
                        const displayValue = availableBalance.div(Big(10).pow(poolInfo.token2.decimals)).toFixed(poolInfo.token2.decimals, Big.roundDown);
                        
                        setToken2Amount(displayValue);
                        
                        // Calculate optimal amount for token1 if adding liquidity
                        if (liquidityState === 'add' && displayValue && displayValue !== '0') {
                          const optimalAmount = calculateOptimalAmount(displayValue, poolInfo.token2.id);
                          setToken1Amount(optimalAmount);
                          // Clear gas reserve warnings since we're recalculating token1 amount
                          setShowGasReserveInfo(false);
                          setShowGasReserveMessage(false);
                        }
                      }
                    }}
                    className="px-1 py-0.5 text-xs bg-card hover:bg-muted rounded-full border border-border text-primary font-semibold opacity-60 hover:opacity-80 transition-all whitespace-nowrap"
                  >
                    MAX
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 p-4 border border-border rounded-full transition-all hover:border-primary/50 hover:shadow-lg">
                {poolInfo.token2.icon ? (
                  <img 
                    src={poolInfo.token2.icon} 
                    alt={poolInfo.token2.symbol}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <div className="w-6 h-6 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                    <span className="text-xs font-bold text-primary">V</span>
                  </div>
                )}
                <div className="flex flex-col items-start w-[200px]">
                  <span className="font-semibold text-foreground text-sm">{poolInfo.token2.symbol}</span>
                  {accountId && (
                    <div className="flex flex-col items-start mt-1 ml-3">
                      <span className="text-xs text-muted-foreground">
                        Balance: {isLoadingBalances ? '...' : (() => {
                          const rawBalance = rawBalances[poolInfo.token2.id];
                          if (!rawBalance || rawBalance === '0') return '0';
                          return formatTokenAmount(rawBalance, poolInfo.token2.decimals, 6);
                        })()}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex-1 relative">
                  <TokenInput
                    value={token2Amount}
                    onChange={handleToken2AmountChange}
                    placeholder="0.0"
                    disabled={!accountId}
                    decimalLimit={poolInfo.token2.decimals}
                  />
                  {token2Amount && tokenPrices[poolInfo.token2.id] && (() => {
                    const price = tokenPrices[poolInfo.token2.id];
                    console.log('[LiquidityCard] Token2 display - ID:', poolInfo.token2.id, 'Price:', price, 'Amount:', token2Amount);
                    return (
                      <div className="absolute top-8 right-4 text-xs text-muted-foreground">
                        ≈ {formatDollarAmount(parseFloat(token2Amount) * price)}
                      </div>
                    );
                  })()}
                </div>
              </div>
            </div>

            {/* Preview: You will add */}
            {token1Amount && token2Amount && parseFloat(token1Amount) > 0 && parseFloat(token2Amount) > 0 && (
              <div className="bg-card border border-border rounded-2xl p-4 shadow-lg space-y-2 text-xs">
                <p className="text-sm font-medium text-foreground mb-2">You will add:</p>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {poolInfo.token1.icon ? (
                      <img 
                        src={poolInfo.token1.icon} 
                        alt={poolInfo.token1.symbol}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-gradient-to-br from-verified/20 to-verified/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-verified">N</span>
                      </div>
                    )}
                    <span className="text-muted-foreground text-xs">{poolInfo.token1.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-xs">
                      {(() => {
                        const num = parseFloat(token1Amount);
                        return num >= 1000 
                          ? toInternationalCurrencySystemLongString(token1Amount, 2)
                          : token1Amount;
                      })()}
                      {tokenPrices[poolInfo.token1.id] && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatDollarAmount(parseFloat(token1Amount) * (tokenPrices[poolInfo.token1.id] || tokenPrices['near'] || tokenPrices['wrap.near'] || 0))})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {poolInfo.token2.icon ? (
                      <img 
                        src={poolInfo.token2.icon} 
                        alt={poolInfo.token2.symbol}
                        className="w-5 h-5 rounded-full"
                      />
                    ) : (
                      <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                        <span className="text-xs font-bold text-primary">V</span>
                      </div>
                    )}
                    <span className="text-muted-foreground text-xs">{poolInfo.token2.symbol}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-medium text-xs">
                      {(() => {
                        const num = parseFloat(token2Amount);
                        return num >= 1000 
                          ? toInternationalCurrencySystemLongString(token2Amount, 2)
                          : token2Amount;
                      })()}
                      {tokenPrices[poolInfo.token2.id] && (
                        <span className="text-xs text-muted-foreground ml-1">
                          ({formatDollarAmount(parseFloat(token2Amount) * tokenPrices[poolInfo.token2.id])})
                        </span>
                      )}
                    </span>
                  </div>
                </div>
                {/* Minimum LP Shares */}
                <div className="pt-2 mt-2 border-t border-border">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground text-xs">Min LP Received</span>
                    <span className="font-medium text-xs">
                      {(() => {
                        try {
                          // Calculate expected LP shares
                          const amount1Raw = Big(token1Amount).mul(Big(10).pow(poolInfo.token1.decimals));
                          const amount2Raw = Big(token2Amount).mul(Big(10).pow(poolInfo.token2.decimals));
                          const reserve1 = Big(poolInfo.reserves[poolInfo.token1.id] || '0');
                          const reserve2 = Big(poolInfo.reserves[poolInfo.token2.id] || '0');
                          const totalShares = Big(poolInfo.shareSupply || '0');
                          
                          let expectedShares: Big;
                          
                          // If pool is empty (first liquidity provider)
                          if (totalShares.eq(0) || reserve1.eq(0) || reserve2.eq(0)) {
                            // shares = sqrt(amount1 * amount2)
                            expectedShares = amount1Raw.mul(amount2Raw).sqrt();
                          } else {
                            // shares = min(amount1/reserve1, amount2/reserve2) * totalShares
                            const shares1 = amount1Raw.mul(totalShares).div(reserve1);
                            const shares2 = amount2Raw.mul(totalShares).div(reserve2);
                            expectedShares = shares1.lt(shares2) ? shares1 : shares2;
                          }
                          
                          // Apply slippage tolerance (default 0.5%)
                          const minShares = expectedShares.mul(1 - slippage / 100);
                          
                          // Convert to readable format
                          const minSharesDisplay = minShares.div(Big(10).pow(24)).toFixed(6, Big.roundDown);
                          
                          // Calculate USD value based on pool TVL
                          let usdValue = null;
                          const token1Price = tokenPrices[poolInfo.token1.id] || tokenPrices['near'] || tokenPrices['wrap.near'] || 0;
                          const token2Price = tokenPrices[poolInfo.token2.id] || 0;
                          
                          if (token1Price > 0 || token2Price > 0) {
                            const token1Reserve = Big(reserve1).div(Big(10).pow(poolInfo.token1.decimals));
                            const token2Reserve = Big(reserve2).div(Big(10).pow(poolInfo.token2.decimals));
                            
                            const token1TVL = token1Reserve.mul(token1Price);
                            const token2TVL = token2Reserve.mul(token2Price);
                            const poolTVL = token1TVL.plus(token2TVL);
                            
                            const readableShares = minShares.div(Big(10).pow(24));
                            const readableTotalShares = totalShares.div(Big(10).pow(24));
                            
                            if (readableTotalShares.gt(0)) {
                              const singleLpValue = poolTVL.div(readableTotalShares);
                              const totalUsdValue = singleLpValue.mul(readableShares).toNumber();
                              usdValue = formatDollarAmount(totalUsdValue);
                            }
                          }
                          
                          return (
                            <>
                              {minSharesDisplay}
                              {usdValue && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({usdValue})
                                </span>
                              )}
                            </>
                          );
                        } catch (error) {
                          console.error('Error calculating min LP shares:', error);
                          return '0';
                        }
                      })()}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Gas Reserve Info */}
            {showGasReserveMessage && accountId && (
              <div className="flex items-start gap-2 p-2 bg-primary/10 rounded-full">
                <Info className="w-4 h-4 text-primary mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Keeping 0.25 NEAR in your wallet for gas fees
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLiquidityState(null);
                  setToken1Amount('');
                  setToken2Amount('');
                  setShowGasReserveInfo(false);
                  setShowGasReserveMessage(false);
                  void fetchBalances();
                }}
                className="flex-1 py-2 px-4 border border-border text-muted-foreground hover:bg-muted/20 hover:border-muted-foreground/30 rounded-full transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleAddLiquidity}
                disabled={
                  !accountId || 
                  !token1Amount || 
                  !token2Amount || 
                  transactionState === 'waitingForConfirmation' || 
                  isLoadingPool || 
                  !!showGasReserveInfo ||
                  // Check if token1 amount exceeds balance
                  !!(poolInfo && token1Amount && rawBalances[poolInfo.token1.id] && 
                    Big(token1Amount).times(Big(10).pow(poolInfo.token1.decimals)).gt(Big(rawBalances[poolInfo.token1.id]))) ||
                  // Check if token2 amount exceeds balance
                  !!(poolInfo && token2Amount && rawBalances[poolInfo.token2.id] && 
                    Big(token2Amount).times(Big(10).pow(poolInfo.token2.decimals)).gt(Big(rawBalances[poolInfo.token2.id]))) ||
                  // Check minimum NEAR balance
                  !!(poolInfo && (poolInfo.token1.id === 'near' || poolInfo.token1.id === 'wrap.near') && 
                    rawBalances.near && Big(rawBalances.near).lt(Big('250000000000000000000000')))
                }
                className="flex-1 py-2 px-4 bg-verified/10 hover:bg-verified/20 border border-verified text-primary font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm shadow-md shadow-verified/20 hover:shadow-lg hover:shadow-verified/30"
              >
                {transactionState === 'waitingForConfirmation' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : showGasReserveInfo ? (
                  'Need 0.25N for gas'
                ) : (poolInfo && token1Amount && rawBalances[poolInfo.token1.id] && 
                    Big(token1Amount).times(Big(10).pow(poolInfo.token1.decimals)).gt(Big(rawBalances[poolInfo.token1.id]))) ? (
                  'Insufficient Funds'
                ) : (poolInfo && token2Amount && rawBalances[poolInfo.token2.id] && 
                    Big(token2Amount).times(Big(10).pow(poolInfo.token2.decimals)).gt(Big(rawBalances[poolInfo.token2.id]))) ? (
                  'Insufficient Funds'
                ) : (
                  'Add Liquidity'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Remove Liquidity Form - Separate Card */}
      {liquidityState === 'remove' && poolInfo && (
        <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 space-y-4 shadow-lg mt-4">
          <div className="space-y-4">
            {/* Header with Back Button */}
            <div className="flex items-center justify-between pb-3 border-b border-border">
              <button
                onClick={() => {
                  setLiquidityState(null);
                  setToken1Amount('');
                  setToken2Amount('');
                  setShowGasReserveInfo(false);
                  setShowGasReserveMessage(false);
                }}
                className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors group p-2 rounded-md"
              >
                <ChevronLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
              </button>
              <div className="flex items-center gap-2">
                <h4 className="text-lg font-bold text-primary">Remove Liquidity</h4>
              </div>
              <div className="w-16"></div> {/* Spacer for centering */}
            </div>

            {/* Share Amount Input */}
            <div className="space-y-2">
              {accountId && userShares && userShares !== '0' && (
                <div className="flex gap-2 justify-end">
                  {[25, 50, 75].map((percent) => (
                    <button
                      key={percent}
                      onClick={() => {
                        const percentShares = Big(userShares).mul(percent).div(100);
                        const displayValue = percentShares.div(Big(10).pow(24)).toFixed(24, Big.roundDown);
                        setToken1Amount(displayValue);
                      }}
                      className="px-1 py-0.5 text-xs bg-card hover:bg-muted rounded-full border border-border text-primary font-semibold opacity-60 hover:opacity-80 transition-all whitespace-nowrap"
                    >
                      {percent}%
                    </button>
                  ))}
                  <button
                    onClick={() => {
                      const displayValue = Big(userShares).div(Big(10).pow(24)).toFixed(24, Big.roundDown);
                      setToken1Amount(displayValue);
                    }}
                    className="px-1 py-0.5 text-xs bg-card hover:bg-muted rounded-full border border-border text-primary font-semibold opacity-60 hover:opacity-80 transition-all whitespace-nowrap"
                  >
                    MAX
                  </button>
                </div>
              )}
              <div className="flex items-center gap-2 p-4 border border-border rounded-full transition-all hover:border-primary/50 hover:shadow-lg">
                <div className="flex flex-col items-start w-[200px]">
                  <span className="font-semibold text-foreground text-sm">LP Shares</span>
                  <div className="flex flex-col items-start mt-1 ml-3">
                    <span className="text-xs text-muted-foreground">
                      Balance: {formatTokenAmount(userShares, 24, 6)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 relative">
                  <TokenInput
                    value={token1Amount}
                    onChange={setToken1Amount}
                    placeholder="0.0"
                    disabled={!accountId}
                    decimalLimit={24}
                  />
                </div>
              </div>
            </div>

            {/* Show token amounts user will receive */}
            {token1Amount && parseFloat(token1Amount) > 0 && (() => {
              const amounts = calculateRemoveLiquidityAmounts(token1Amount);
              return (
                <div className="bg-card border border-border rounded-2xl p-4 shadow-lg space-y-2 text-xs">
                  <p className="text-sm font-medium text-foreground mb-2">You will receive:</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {poolInfo.token1.icon ? (
                        <img 
                          src={poolInfo.token1.icon} 
                          alt={poolInfo.token1.symbol}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gradient-to-br from-verified/20 to-verified/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-verified">N</span>
                        </div>
                      )}
                      <span className="text-muted-foreground text-xs">{poolInfo.token1.symbol}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-xs">
                        {(() => {
                          const num = parseFloat(amounts.token1Amount);
                          return num >= 1000 
                            ? toInternationalCurrencySystemLongString(amounts.token1Amount, 2)
                            : amounts.token1Amount;
                        })()}
                        {tokenPrices[poolInfo.token1.id] && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatDollarAmount(parseFloat(amounts.token1Amount) * (tokenPrices[poolInfo.token1.id] || tokenPrices['near'] || tokenPrices['wrap.near'] || 0))})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {poolInfo.token2.icon ? (
                        <img 
                          src={poolInfo.token2.icon} 
                          alt={poolInfo.token2.symbol}
                          className="w-5 h-5 rounded-full"
                        />
                      ) : (
                        <div className="w-5 h-5 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full flex items-center justify-center">
                          <span className="text-xs font-bold text-primary">V</span>
                        </div>
                      )}
                      <span className="text-muted-foreground text-xs">{poolInfo.token2.symbol}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-medium text-xs">
                        {(() => {
                          const num = parseFloat(amounts.token2Amount);
                          return num >= 1000 
                            ? toInternationalCurrencySystemLongString(amounts.token2Amount, 2)
                            : amounts.token2Amount;
                        })()}
                        {tokenPrices[poolInfo.token2.id] && (
                          <span className="text-xs text-muted-foreground ml-1">
                            ({formatDollarAmount(parseFloat(amounts.token2Amount) * tokenPrices[poolInfo.token2.id])})
                          </span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Action Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setLiquidityState(null);
                  setToken1Amount('');
                  setToken2Amount('');
                  setShowGasReserveInfo(false);
                  setShowGasReserveMessage(false);
                  void fetchBalances();
                }}
                className="flex-1 py-2 px-4 border border-border text-muted-foreground hover:bg-muted/20 hover:border-muted-foreground/30 rounded-full transition-colors text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveLiquidity}
                disabled={
                  !accountId || 
                  !token1Amount || 
                  transactionState === 'waitingForConfirmation' ||
                  // Check if user has enough shares
                  !!(userShares && token1Amount && Big(token1Amount).gt(Big(userShares)))
                }
                className="flex-1 py-2 px-4 bg-primary/10 hover:bg-primary/20 border border-primary text-primary font-semibold rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                {transactionState === 'waitingForConfirmation' ? (
                  <Loader2 className="w-4 h-4 animate-spin mx-auto" />
                ) : (userShares && token1Amount && Big(token1Amount).gt(Big(userShares))) ? (
                  'Insufficient Shares'
                ) : (
                  'Remove Liquidity'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modals and Error Display */}
      <div className="mt-4">
        {/* Error Display */}
        {error && (
          <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg shadow-md">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
            <p className="text-sm text-red-500 flex-1">{error}</p>
            <button
              onClick={() => {
                setError(null);
                setTransactionState(null);
              }}
              className="text-red-500 hover:text-red-600 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Modal */}
        {transactionState === 'success' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 max-w-md w-full shadow-xl">
              <div className="text-center space-y-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 sm:w-8 sm:h-8 text-green-500" />
                </div>
                <h3 className="text-base sm:text-lg font-bold">
                  {liquidityState === 'add' ? 'Liquidity Added!' : 'Liquidity Removed!'}
                </h3>
                <div className="space-y-2 text-xs sm:text-sm">
                  {liquidityState === 'add' && token1Amount && poolInfo && (
                    <>
                      <div className="flex justify-between items-center py-2 px-3 border border-border rounded-full">
                        <span className="text-muted-foreground">Added {poolInfo.token1.symbol}</span>
                        <span className="font-semibold">
                          {(() => {
                            const num = parseFloat(token1Amount);
                            return num >= 1000 
                              ? toInternationalCurrencySystemLongString(token1Amount, 2)
                              : token1Amount;
                          })()} {poolInfo.token1.symbol}
                        </span>
                      </div>
                      {token2Amount && (
                        <div className="flex justify-between items-center py-2 px-3 border border-border rounded-full">
                          <span className="text-muted-foreground">Added {poolInfo.token2.symbol}</span>
                          <span className="font-semibold">
                            {(() => {
                              const num = parseFloat(token2Amount);
                              return num >= 1000 
                                ? toInternationalCurrencySystemLongString(token2Amount, 2)
                                : token2Amount;
                            })()} {poolInfo.token2.symbol}
                          </span>
                        </div>
                      )}
                    </>
                  )}
                  {liquidityState === 'remove' && token1Amount && (
                    <div className="flex justify-between items-center py-2 px-3 border border-border rounded-full">
                      <span className="text-muted-foreground">LP Shares Removed</span>
                      <span className="font-semibold">{token1Amount}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center py-2 px-3 border border-border rounded-full">
                    <span className="text-muted-foreground">LP Shares</span>
                    <span className="font-semibold">
                      {isLoadingShares || isLoadingBalances ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        formatTokenAmount(userShares, 24, 6)
                      )}
                    </span>
                  </div>
                </div>
                {tx && (
                  <a
                    href={`https://nearblocks.io/txns/${tx}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-primary hover:underline text-xs sm:text-sm"
                  >
                    View Transaction <ExternalLink className="w-3 h-3 sm:w-4 sm:h-4" />
                  </a>
                )}
                <button
                  onClick={() => {
                    setTransactionState(null);
                    setLiquidityState(null);
                    setToken1Amount('');
                    setToken2Amount('');
                    setTx(undefined);
                    void fetchBalances();
                    void fetchUserShares();
                  }}
                  className="w-full py-2 sm:py-3 border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 font-bold rounded-full transition-colors transition-shadow duration-200 hover:bg-verified/20 hover:shadow-lg hover:shadow-verified/30 flex items-center justify-center text-sm"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fail Modal */}
        {transactionState === 'fail' && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-xl">
              <div className="text-center space-y-4">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
                <h3 className="text-lg font-bold">Transaction Failed</h3>
                {error && (
                  <p className="text-sm text-muted-foreground">{error}</p>
                )}
                <button
                  onClick={() => {
                    setTransactionState(null);
                    setError(null);
                  }}
                  className="w-full py-2 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 font-semibold rounded-full transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LiquidityCard;