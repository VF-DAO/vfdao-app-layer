/**
 * Governance Module
 * 
 * Sputnik DAO contract integration for vegan-friends.sputnik-dao.near
 */

import { providers } from 'near-api-js';
import type { Policy, Proposal, ProposalKind, RoleKind, WeightKind } from './types';
import Big from 'big.js';

const DAO_CONTRACT = 'vegan-friends.sputnik-dao.near';

// Get RPC provider
function getProvider() {
  const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
  return new providers.JsonRpcProvider({ url: rpcUrl });
}

// Contract service - all Sputnik DAO methods
export const dao = {
  // VIEW METHODS (no gas required)
  
  async getProposals(fromIndex = 0, limit = 50): Promise<Proposal[]> {
    try {
      const provider = getProvider();
      
      // First get the total count to fetch from the end
      const lastIdResult = await provider.query({
        request_type: 'call_function',
        account_id: DAO_CONTRACT,
        method_name: 'get_last_proposal_id',
        args_base64: btoa(JSON.stringify({})),
        finality: 'final',
      }) as unknown as { result: number[] };
      
      const lastId = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(lastIdResult.result))) as number;
      
      // Calculate from_index to get latest proposals
      // If lastId is 100 and we want 50, we start from 50 to get proposals 50-99
      const calculatedFromIndex = Math.max(0, lastId - fromIndex - limit);
      
      const result = await provider.query({
        request_type: 'call_function',
        account_id: DAO_CONTRACT,
        method_name: 'get_proposals',
        args_base64: btoa(JSON.stringify({ from_index: calculatedFromIndex, limit })),
        finality: 'final',
      }) as unknown as { result: number[] };
      
      const proposals = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(result.result))) as Proposal[];
      
      // Reverse to show latest first
      return proposals.reverse();
    } catch (error) {
      console.error('[DAO] Failed to fetch proposals:', error);
      // Return mock data as fallback
      return mockProposals;
    }
  },
  
  async getProposal(id: number): Promise<Proposal | undefined> {
    try {
      const provider = getProvider();
      const result = await provider.query({
        request_type: 'call_function',
        account_id: DAO_CONTRACT,
        method_name: 'get_proposal',
        args_base64: btoa(JSON.stringify({ id })),
        finality: 'final',
      }) as unknown as { result: number[] };
      
      const proposal = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(result.result))) as Proposal;
      return proposal;
    } catch (error) {
      console.error('[DAO] Failed to fetch proposal:', error);
      return mockProposals.find(p => p.id === id);
    }
  },
  
  async getPolicy(): Promise<Policy> {
    try {
      const provider = getProvider();
      const result = await provider.query({
        request_type: 'call_function',
        account_id: DAO_CONTRACT,
        method_name: 'get_policy',
        args_base64: btoa(JSON.stringify({})),
        finality: 'final',
      }) as unknown as { result: number[] };
      
      const policy = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(result.result))) as Policy;
      return policy;
    } catch (error) {
      console.error('[DAO] Failed to fetch policy:', error);
      return mockPolicy;
    }
  },
  
  async getLastProposalId(): Promise<number> {
    try {
      const provider = getProvider();
      const result = await provider.query({
        request_type: 'call_function',
        account_id: DAO_CONTRACT,
        method_name: 'get_last_proposal_id',
        args_base64: btoa(JSON.stringify({})),
        finality: 'final',
      }) as unknown as { result: number[] };
      
      const proposalId = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(result.result))) as number;
      return proposalId;
    } catch (error) {
      console.error('[DAO] Failed to fetch last proposal ID:', error);
      return mockProposals.length;
    }
  },
  
  async getTreasuryBalance(): Promise<{ balance: string; balanceUsd: string }> {
    try {
      const provider = getProvider();
      const result = await provider.query({
        request_type: 'view_account',
        account_id: DAO_CONTRACT,
        finality: 'final',
      }) as unknown as { amount: string };
      
      // Convert yoctoNEAR to NEAR with full precision
      const balanceInNear = new Big(result.amount).div(new Big(10).pow(24));
      // Format with 4 decimals and add commas
      const formatted = balanceInNear.toFixed(4, Big.roundDown);
      const [whole, decimal] = formatted.split('.');
      const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (decimal ? `.${decimal}` : '');
      
      // Fetch NEAR price
      let balanceUsd = '0';
      try {
        const priceResponse = await fetch('https://mainnet-indexer.ref-finance.com/list-token-price');
        if (priceResponse.ok) {
          const prices = await priceResponse.json() as Record<string, { price: string }>;
          const nearPrice = prices['wrap.near']?.price;
          if (nearPrice) {
            const usdValue = balanceInNear.mul(new Big(nearPrice));
            if (usdValue.gte(0.01)) {
              const usdFormatted = usdValue.toFixed(2, Big.roundDown);
              const [usdWhole, usdDecimal] = usdFormatted.split('.');
              balanceUsd = `$${usdWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${usdDecimal ? `.${usdDecimal}` : ''}`;
            } else {
              balanceUsd = '< $0.01';
            }
          }
        }
      } catch (err) {
        console.warn('[DAO] Failed to fetch NEAR price:', err);
      }
      
      return { balance: withCommas, balanceUsd };
    } catch (error) {
      console.error('[DAO] Failed to fetch treasury balance:', error);
      return { balance: '0', balanceUsd: '0' };
    }
  },
  
  async getTokenBalances(): Promise<{ symbol: string; balance: string; balanceUsd: string; contractId: string; decimals: number; icon?: string }[]> {
    try {
      const provider = getProvider();
      const tokensToCheck = [
        { contractId: 'veganfriends.tkn.near', symbol: 'VEGANFRIENDS', decimals: 18 },
        { contractId: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1', symbol: 'USDC', decimals: 6 },
        { contractId: 'usdt.tether-token.near', symbol: 'USDT', decimals: 6 },
        { contractId: 'aaaaaa20d9e0e2461697782ef11675f668207961.factory.bridge.near', symbol: 'AURORA', decimals: 18 },
      ];
      
      // Fetch token prices
      let prices: Record<string, { price: string }> = {};
      try {
        const priceResponse = await fetch('https://mainnet-indexer.ref-finance.com/list-token-price');
        if (priceResponse.ok) {
          prices = await priceResponse.json() as Record<string, { price: string }>;
          
          // Calculate VEGANFRIENDS price from pool if not in indexer (same as swap component)
          if (!prices['veganfriends.tkn.near'] && prices['wrap.near']) {
            try {
              const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
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
                    args_base64: btoa(JSON.stringify({ pool_id: 5094 })),
                    finality: 'final'
                  }
                })
              });

              if (poolResponse.ok) {
                const poolData = await poolResponse.json() as { result: { result: number[] } };
                const pool = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(poolData.result.result))) as {
                  token_account_ids: string[];
                  amounts: string[];
                };
                
                const nearIndex = pool.token_account_ids.indexOf('wrap.near');
                const veganIndex = pool.token_account_ids.indexOf('veganfriends.tkn.near');
                
                if (nearIndex !== -1 && veganIndex !== -1) {
                  const reserveNear = new Big(pool.amounts[nearIndex]);
                  const reserveVegan = new Big(pool.amounts[veganIndex]);
                  
                  if (reserveNear.gt(0) && reserveVegan.gt(0)) {
                    const nearPrice = parseFloat(prices['wrap.near'].price);
                    const rawRatio = reserveNear.div(reserveVegan);
                    const decimalAdjustment = new Big(10).pow(18 - 24); // VEGAN has 18, NEAR has 24
                    const adjustedRatio = rawRatio.mul(decimalAdjustment);
                    const veganPrice = adjustedRatio.mul(nearPrice);
                    
                    prices['veganfriends.tkn.near'] = { price: veganPrice.toString() };
                  }
                }
              }
            } catch (err) {
              console.warn('[DAO] Failed to calculate VEGANFRIENDS price from pool:', err);
            }
          }
        }
      } catch (err) {
        console.warn('[DAO] Failed to fetch token prices:', err);
      }
      
      const balances = await Promise.all(
        tokensToCheck.map(async (token) => {
          try {
            // Fetch token icon from metadata
            let tokenIcon: string | undefined;
            try {
              const metadataResult = await provider.query({
                request_type: 'call_function',
                account_id: token.contractId,
                method_name: 'ft_metadata',
                args_base64: '',
                finality: 'final',
              }) as unknown as { result: number[] };
              
              const metadata = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(metadataResult.result))) as { icon?: string };
              tokenIcon = metadata.icon;
            } catch (_err) {
              // Icon fetch failed - not critical
            }
            
            const result = await provider.query({
              request_type: 'call_function',
              account_id: token.contractId,
              method_name: 'ft_balance_of',
              args_base64: btoa(JSON.stringify({ account_id: DAO_CONTRACT })),
              finality: 'final',
            }) as unknown as { result: number[] };
            
            const rawBalance = JSON.parse(new TextDecoder('utf-8').decode(new Uint8Array(result.result))) as string;
            
            // Format with full precision and commas (no K/M/B abbreviations)
            const balanceInTokens = new Big(rawBalance).div(new Big(10).pow(token.decimals));
            const decimalsToShow = token.decimals === 18 ? 2 : (token.decimals === 6 ? 2 : 4);
            const formatted = balanceInTokens.toFixed(decimalsToShow, Big.roundDown);
            const [whole, decimal] = formatted.split('.');
            const balance = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (decimal ? `.${decimal}` : '');
            
            // Calculate USD value
            let balanceUsd = '0';
            const tokenPrice = prices[token.contractId]?.price;
            if (tokenPrice && rawBalance !== '0') {
              try {
                const valueInTokens = new Big(rawBalance).div(new Big(10).pow(token.decimals));
                const usdValue = valueInTokens.mul(new Big(tokenPrice));
                if (usdValue.gte(0.01)) {
                  const usdFormatted = usdValue.toFixed(2, Big.roundDown);
                  const [usdWhole, usdDecimal] = usdFormatted.split('.');
                  balanceUsd = `$${usdWhole.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}${usdDecimal ? `.${usdDecimal}` : ''}`;
                } else {
                  balanceUsd = '< $0.01';
                }
              } catch (err) {
                console.warn(`[DAO] Failed to calculate USD value for ${token.symbol}:`, err);
              }
            }
            
            // Only return tokens with non-zero balance
            if (rawBalance !== '0') {
              return { symbol: token.symbol, balance, balanceUsd, contractId: token.contractId, decimals: token.decimals, icon: tokenIcon };
            }
            return null;
          } catch (err) {
            console.warn(`[DAO] Failed to fetch ${token.symbol} balance:`, err);
            return null;
          }
        })
      );
      
      const nonZeroBalances = balances.filter((b) => b !== null) as { symbol: string; balance: string; balanceUsd: string; contractId: string; decimals: number; icon?: string }[];
      return nonZeroBalances;
    } catch (error) {
      console.error('[DAO] Failed to fetch token balances:', error);
      return [];
    }
  },
  
  // CALL METHODS (requires gas & wallet signature)
  
  async vote(id: number, action: 'VoteApprove' | 'VoteReject' | 'VoteRemove', wallet: any) {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Sign and send transaction
      const result = await wallet.signAndSendTransaction({
        receiverId: DAO_CONTRACT,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'act_proposal',
              args: {
                id,
                action,
              },
              gas: '300000000000000', // 300 TGas
              deposit: '0', // No deposit required for voting
            },
          },
        ],
      });
      
      // Extract transaction hash
      const transactionHash = result?.transaction?.hash ?? result?.transaction_outcome?.id;
      
      return { 
        success: true, 
        transaction: result,
        transactionHash 
      };
    } catch (error) {
      console.error('[DAO] Vote transaction failed:', error);
      throw error;
    }
  },
  
  async createProposal(proposal: any, wallet: any, deposit = '1000000000000000000000000') {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }
    
    try {
      // Sign and send transaction with 1 NEAR deposit (proposal bond)
      const result = await wallet.signAndSendTransaction({
        receiverId: DAO_CONTRACT,
        actions: [
          {
            type: 'FunctionCall',
            params: {
              methodName: 'add_proposal',
              args: { proposal },
              gas: '300000000000000', // 300 TGas
              deposit, // 1 NEAR bond
            },
          },
        ],
      });
      
      // Extract transaction hash
      const transactionHash = result?.transaction?.hash ?? result?.transaction_outcome?.id;
      
      return { 
        success: true, 
        transaction: result,
        transactionHash 
      };
    } catch (error) {
      console.error('[DAO] Create proposal transaction failed:', error);
      throw error;
    }
  },
};

// Mock data for development (remove when NEAR SDK is integrated)
const mockProposals: Proposal[] = [
  {
    id: 1,
    proposer: 'veganfriend.near',
    description: 'Fund CashewCheese startup with $50k to scale production',
    kind: { Transfer: { token_id: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1', receiver_id: 'cashewcheese.near', amount: '50000000000' } } as ProposalKind,
    status: 'InProgress',
    vote_counts: { council: [2, 1, 0] },
    votes: { 'alice.near': 'Approve', 'bob.near': 'Approve', 'carol.near': 'Reject' },
    submission_time: ((Date.now() - 86400000 * 2) * 1_000_000).toString(), // Convert to nanoseconds
    last_actions_log: [
      { block_height: '100000001' },
      { block_height: '100000120' },
      { block_height: '100000245' },
      { block_height: '100000380' },
    ],
  },
  {
    id: 2,
    proposer: 'activist.near',
    description: 'Community poll: Should we sponsor the annual Vegan Festival?',
    kind: { Vote: null } as ProposalKind,
    status: 'InProgress',
    vote_counts: { council: [4, 0, 0] },
    votes: { 'alice.near': 'Approve', 'bob.near': 'Approve', 'carol.near': 'Approve', 'dave.near': 'Approve' },
    submission_time: ((Date.now() - 86400000) * 1_000_000).toString(), // Convert to nanoseconds
    last_actions_log: [
      { block_height: '100001000' },
      { block_height: '100001050' },
      { block_height: '100001100' },
      { block_height: '100001150' },
      { block_height: '100001200' },
    ],
  },
  {
    id: 3,
    proposer: 'builder.near',
    description: 'Allocate $10k for vegan restaurant POS system development',
    kind: { Transfer: { token_id: '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1', receiver_id: 'devteam.near', amount: '10000000000' } } as ProposalKind,
    status: 'Approved',
    vote_counts: { council: [5, 0, 0] },
    votes: { 'alice.near': 'Approve', 'bob.near': 'Approve', 'carol.near': 'Approve', 'dave.near': 'Approve', 'eve.near': 'Approve' },
    submission_time: ((Date.now() - 86400000 * 7) * 1_000_000).toString(), // Convert to nanoseconds
    last_actions_log: [
      { block_height: '99900000' },
      { block_height: '99900100' },
      { block_height: '99900200' },
      { block_height: '99900300' },
      { block_height: '99900400' },
      { block_height: '99900500' },
    ],
  },
];

const mockPolicy: Policy = {
  roles: [
    {
      name: 'council',
      kind: { Group: ['alice.near', 'bob.near', 'carol.near', 'dave.near', 'eve.near'] } as RoleKind,
      permissions: ['*:*'],
      vote_policy: {
        Transfer: {
          weight_kind: 'RoleWeight' as WeightKind,
          quorum: '0',
          threshold: [1, 2] as [number, number],
        },
      },
    },
  ],
  default_vote_policy: {
    weight_kind: 'RoleWeight' as WeightKind,
    quorum: '0',
    threshold: [1, 2] as [number, number],
  },
  proposal_bond: '1000000000000000000000000', // 1 NEAR
  proposal_period: '604800000000000', // 7 days in nanoseconds
  bounty_bond: '1000000000000000000000000',
  bounty_forgiveness_period: '86400000000000',
};

// Re-export types
export type * from './types';
export * from './hooks';
