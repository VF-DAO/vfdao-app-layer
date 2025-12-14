// "I'm With You" - Solidarity system for VF DAO
// Simple. Human. Meaningful.

import type { WithYouData, WithYouStats, WithYouContext } from '@/types/with-you';

const SOCIAL_DB_CONTRACT = 'social.near';
const WITHYOU_NAMESPACE = 'vfdao/withyou';

/**
 * Service for managing "I'm With You" solidarity connections
 * Uses Social DB with vfdao namespace - completely separate from social graph
 */
export class WithYouService {
  
  /**
   * Build the transaction to express solidarity
   * "I'm with you"
   */
  static buildWithYouTransaction(
    fromAccountId: string,
    toAccountId: string,
    context?: WithYouContext
  ): {
    receiverId: string;
    actions: Array<{
      type: 'FunctionCall';
      params: {
        methodName: string;
        args: Record<string, unknown>;
        gas: string;
        deposit: string;
      };
    }>;
  } {
    const data: WithYouData = {
      since: Date.now().toString(),
    };
    
    if (context) {
      data.context = context.type;
      if ('proposalId' in context) {
        data.contextId = context.proposalId.toString();
      } else if ('actionId' in context) {
        data.contextId = context.actionId;
      } else if ('milestone' in context && context.milestone) {
        data.contextId = context.milestone;
      }
    }

    // Social DB data structure
    const socialData = {
      [fromAccountId]: {
        [WITHYOU_NAMESPACE]: {
          [toAccountId]: JSON.stringify(data),
        },
      },
    };

    return {
      receiverId: SOCIAL_DB_CONTRACT,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: 'set',
            args: { data: socialData },
            gas: '30000000000000', // 30 TGas
            deposit: '50000000000000000000000', // 0.05 NEAR for storage
          },
        },
      ],
    };
  }

  /**
   * Build transaction to remove solidarity
   * (Rare - but sometimes needed)
   */
  static buildRemoveWithYouTransaction(
    fromAccountId: string,
    toAccountId: string
  ): {
    receiverId: string;
    actions: Array<{
      type: 'FunctionCall';
      params: {
        methodName: string;
        args: Record<string, unknown>;
        gas: string;
        deposit: string;
      };
    }>;
  } {
    // Social DB uses null to delete
    const socialData = {
      [fromAccountId]: {
        [WITHYOU_NAMESPACE]: {
          [toAccountId]: null,
        },
      },
    };

    return {
      receiverId: SOCIAL_DB_CONTRACT,
      actions: [
        {
          type: 'FunctionCall',
          params: {
            methodName: 'set',
            args: { data: socialData },
            gas: '30000000000000',
            deposit: '1', // 1 yoctoNEAR for deletion
          },
        },
      ],
    };
  }

  /**
   * Fetch who is with a specific account
   */
  static async getWhoIsWithThem(
    accountId: string,
    rpcUrl: string
  ): Promise<string[]> {
    try {
      // Query Social DB for all accounts that have withyou/[accountId]
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'withyou-query',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: SOCIAL_DB_CONTRACT,
            method_name: 'keys',
            args_base64: btoa(JSON.stringify({
              keys: [`*/${WITHYOU_NAMESPACE}/${accountId}`],
            })),
          },
        }),
      });

      const result = await response.json();
      
      if (result.result?.result) {
        const bytes = new Uint8Array(result.result.result);
        const decoded = new TextDecoder().decode(bytes);
        const data = JSON.parse(decoded);
        
        // Extract account IDs from keys
        return Object.keys(data || {});
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch who is with them:', error);
      return [];
    }
  }

  /**
   * Fetch who an account is with
   */
  static async getWhoTheyreWith(
    accountId: string,
    rpcUrl: string
  ): Promise<string[]> {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'withyou-query',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: SOCIAL_DB_CONTRACT,
            method_name: 'keys',
            args_base64: btoa(JSON.stringify({
              keys: [`${accountId}/${WITHYOU_NAMESPACE}/*`],
            })),
          },
        }),
      });

      const result = await response.json();
      
      if (result.result?.result) {
        const bytes = new Uint8Array(result.result.result);
        const decoded = new TextDecoder().decode(bytes);
        const data = JSON.parse(decoded);
        
        // Extract target account IDs
        const accountData = data?.[accountId]?.[WITHYOU_NAMESPACE.split('/')[0]]?.[WITHYOU_NAMESPACE.split('/')[1]];
        return Object.keys(accountData || {});
      }
      
      return [];
    } catch (error) {
      console.error('Failed to fetch who they are with:', error);
      return [];
    }
  }

  /**
   * Check if one account is with another
   */
  static async isWithThem(
    fromAccountId: string,
    toAccountId: string,
    rpcUrl: string
  ): Promise<boolean> {
    try {
      const response = await fetch(rpcUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 'withyou-check',
          method: 'query',
          params: {
            request_type: 'call_function',
            finality: 'final',
            account_id: SOCIAL_DB_CONTRACT,
            method_name: 'get',
            args_base64: btoa(JSON.stringify({
              keys: [`${fromAccountId}/${WITHYOU_NAMESPACE}/${toAccountId}`],
            })),
          },
        }),
      });

      const result = await response.json();
      
      if (result.result?.result) {
        const bytes = new Uint8Array(result.result.result);
        const decoded = new TextDecoder().decode(bytes);
        const data = JSON.parse(decoded);
        
        return !!data?.[fromAccountId]?.vfdao?.withyou?.[toAccountId];
      }
      
      return false;
    } catch (error) {
      console.error('Failed to check if with them:', error);
      return false;
    }
  }

  /**
   * Get complete stats for an account
   */
  static async getStats(
    accountId: string,
    viewerAccountId: string | null,
    rpcUrl: string
  ): Promise<WithYouStats> {
    const [withThem, theyreWith, imWithThem] = await Promise.all([
      this.getWhoIsWithThem(accountId, rpcUrl),
      this.getWhoTheyreWith(accountId, rpcUrl),
      viewerAccountId 
        ? this.isWithThem(viewerAccountId, accountId, rpcUrl)
        : Promise.resolve(false),
    ]);

    return {
      withThem: withThem.length,
      theyreWith: theyreWith.length,
      imWithThem,
    };
  }
}
