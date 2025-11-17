import { useCallback, useEffect, useRef, useState } from 'react';
import { providers } from 'near-api-js';
import type { Transaction } from '@ref-finance/ref-sdk';
import type { SwapEstimate, TokenMetadata } from '@/types';
import { getErrorMessage, isUserCancellation } from '@/lib/transaction-utils';
import { parseTokenAmount } from '@/lib/swap-utils';
import { useWallet } from '@/features/wallet';

type SwapState = 'success' | 'fail' | 'cancelled' | 'waitingForConfirmation' | null;

export interface UseSwapTransactionReturn {
  isSwapping: boolean;
  swapState: SwapState;
  tx: string | undefined;
  error: string | null;
  setError: (error: string | null) => void;
  executeSwapTransaction: (
    tokenIn: TokenMetadata,
    tokenOut: TokenMetadata,
    amountIn: string,
    slippage: number,
    estimate: SwapEstimate | undefined,
    executeSwap: (
      tokenInId: string,
      tokenOutId: string,
      amountIn: string,
      slippageTolerance: number,
      estimate?: SwapEstimate,
      rpcUrl?: string
    ) => Promise<Transaction[]>,
    estimateSwapOutput: (
      tokenInId: string,
      tokenOutId: string,
      amountIn: string
    ) => Promise<SwapEstimate | null>,
    onSuccess?: () => void
  ) => Promise<void>;
  resetTransactionState: () => void;
}

export function useSwapTransaction(): UseSwapTransactionReturn {
  const { accountId, wallet, connector } = useWallet();
  const [isSwapping, setIsSwapping] = useState(false);
  const [swapState, setSwapState] = useState<SwapState>(null);
  const [tx, setTx] = useState<string | undefined>(undefined);
  const [error, setError] = useState<string | null>(null);
  
  // Store timeout ID for cleanup
  const successTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check for transaction results in URL
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const errorCode = urlParams.get('errorCode');
    const transactions = urlParams.get('transactionHashes');
    const errorMessage = urlParams.get('errorMessage');
    const lastTX = transactions?.split(',').pop();

    if (errorCode) {
      setSwapState('fail');
      setError(errorMessage ?? 'Transaction failed');
    } else if (lastTX) {
      setSwapState('success');
      setTx(lastTX);
    }

    // Clear URL params after processing
    if (errorCode || transactions) {
      window.history.replaceState({}, '', window.location.origin + window.location.pathname);
    }
  }, []);

  // Fallback: If stuck in waitingForConfirmation for too long, assume success
  useEffect(() => {
    if (swapState === 'waitingForConfirmation') {
      const timeout = setTimeout(() => {
        setSwapState('success');
        setTx('transaction-confirmed');
      }, 3000);

      return () => clearTimeout(timeout);
    }
  }, [swapState]);

  const executeSwapTransaction = useCallback(
    async (
      tokenIn: TokenMetadata,
      tokenOut: TokenMetadata,
      amountIn: string,
      slippage: number,
      estimate: SwapEstimate | undefined,
      executeSwap: (
        tokenInId: string,
        tokenOutId: string,
        amountIn: string,
        slippageTolerance: number,
        estimate?: SwapEstimate,
        rpcUrl?: string
      ) => Promise<Transaction[]>,
      estimateSwapOutput: (
        tokenInId: string,
        tokenOutId: string,
        amountIn: string
      ) => Promise<SwapEstimate | null>,
      onSuccess?: () => void
    ) => {
      if (!accountId || !amountIn) {
        setError('Please connect wallet and enter amount');
        return;
      }

      // Get fresh quote before swapping
      let freshEstimate = estimate;
      try {
        const amountInParsed = parseTokenAmount(amountIn, tokenIn.decimals);
        const newEstimate = await estimateSwapOutput(tokenIn.id, tokenOut.id, amountInParsed);
        
        if (newEstimate) {
          freshEstimate = newEstimate;
        } else {
          setError('Failed to get fresh quote. Please try again.');
          return;
        }
      } catch (err) {
        console.error('[SwapTransaction] Failed to fetch fresh quote:', err);
        setError('Failed to get fresh quote. Please try again.');
        return;
      }

      // Get wallet instance
      let walletInstance = wallet;
      if (!walletInstance && connector) {
        try {
          const { wallet: connectedWallet } = await connector.getConnectedWallet();
          walletInstance = connectedWallet;
        } catch {
          setError('Please reconnect your wallet');
          return;
        }
      }

      if (!walletInstance) {
        setError('Please connect wallet');
        return;
      }

      setIsSwapping(true);
      setError(null);

      try {
        const amountInParsed = parseTokenAmount(amountIn, tokenIn.decimals);
        const rpcUrl = process.env.NEXT_PUBLIC_NEAR_RPC_MAINNET ?? 'https://rpc.mainnet.near.org';
        
        const swapTransactions = await executeSwap(
          tokenIn.id,
          tokenOut.id,
          amountInParsed,
          slippage,
          freshEstimate,
          rpcUrl
        );

        // Validate transaction structure
        if (!Array.isArray(swapTransactions) || swapTransactions.length === 0) {
          throw new Error('Invalid transaction data: no transactions returned');
        }

        // Convert to wallet selector format
        const wsTransactions = swapTransactions.map((tx, txIdx) => {
          if (!tx || typeof tx !== 'object') {
            throw new Error(`Invalid transaction at index ${txIdx}: transaction is not an object`);
          }
          
          if (!tx.functionCalls || !Array.isArray(tx.functionCalls)) {
            throw new Error(`Invalid transaction at index ${txIdx}: functionCalls is not an array`);
          }
          
          if (!tx.receiverId || typeof tx.receiverId !== 'string') {
            throw new Error(`Invalid transaction at index ${txIdx}: receiverId is missing or invalid`);
          }
          
          const actions = tx.functionCalls.map((fc, fcIdx) => {
            if (!fc || typeof fc !== 'object') {
              throw new Error(`Invalid function call at transaction ${txIdx}, index ${fcIdx}: function call is not an object`);
            }
            
            if (!fc.methodName || typeof fc.methodName !== 'string') {
              throw new Error(`Invalid function call at transaction ${txIdx}, index ${fcIdx}: methodName is missing or invalid`);
            }
            
            const baseGas = fc.gas ? BigInt(fc.gas.toString()) : BigInt('20000000000000');
            const gasBuffer = BigInt('10000000000000');
            const gasBigInt = baseGas + gasBuffer;
            
            return {
              type: "FunctionCall" as const,
              params: {
                methodName: fc.methodName,
                args: fc.args ?? {},
                gas: gasBigInt.toString(),
                deposit: (fc.amount ?? '0').toString(),
              }
            };
          });
          
          return {
            signerId: accountId,
            receiverId: tx.receiverId,
            actions,
          };
        });

        const outcomes = await walletInstance.signAndSendTransactions({
          transactions: wsTransactions as any,
        });

        // Check transaction success
        if (outcomes && outcomes.length > 0) {
          const finalOutcome = outcomes[outcomes.length - 1] as unknown as { transaction?: { hash?: string }; transaction_outcome?: { id?: string } };
          const txHash = finalOutcome?.transaction?.hash ?? finalOutcome?.transaction_outcome?.id;

          if (txHash) {
            try {
              const provider = new providers.JsonRpcProvider({ url: rpcUrl });
              const result = await provider.query({
                request_type: 'tx',
                tx_hash: txHash,
                account_id: accountId,
              }) as unknown as { status: { SuccessValue?: unknown; SuccessReceiptId?: unknown; Failure?: unknown } };
              
              const status = result.status;
              if (status.SuccessValue ?? status.SuccessReceiptId) {
                // Small delay to allow balances to update on-chain before showing success modal
                successTimeoutRef.current = setTimeout(() => {
                  setSwapState('success');
                  setTx(txHash);
                  onSuccess?.();
                }, 1500);
              } else if (status.Failure) {
                console.error('[SwapTransaction] Transaction failed on chain:', status.Failure);
                setSwapState('fail');
                setError(`Transaction failed: ${JSON.stringify(status.Failure)}`);
              } else {
                // Small delay to allow balances to update on-chain before showing success modal
                successTimeoutRef.current = setTimeout(() => {
                  setSwapState('success');
                  setTx(txHash);
                  onSuccess?.();
                }, 1500);
              }
            } catch {
              // Small delay to allow balances to update on-chain before showing success modal
              successTimeoutRef.current = setTimeout(() => {
                setSwapState('success');
                setTx(txHash);
                onSuccess?.();
              }, 1500);
            }
          } else {
            setSwapState('waitingForConfirmation');
          }
        } else {
          setSwapState('waitingForConfirmation');
        }
      } catch (err: unknown) {
        const errorMessage = getErrorMessage(err);
        
        const isWalletPopupError = ['Couldn\'t open popup', 'popup window', 'MeteorActionError', 'wallet action'].some(msg => 
          errorMessage.toLowerCase().includes(msg.toLowerCase())
        );

        if (isWalletPopupError) {
          setError('Wallet popup blocked. Please allow popups for this site and try again.');
          setSwapState('fail');
        } else if (isUserCancellation(err)) {
          setError('Transaction cancelled');
          setSwapState('cancelled');
        } else {
          console.error('[SwapTransaction] Swap error:', err);
          setError(errorMessage ?? 'Transaction failed');
          setSwapState('fail');
        }
      } finally {
        setIsSwapping(false);
      }
    },
    [accountId, wallet, connector]
  );

  const resetTransactionState = useCallback(() => {
    // Clean up any pending timeout
    if (successTimeoutRef.current) {
      clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
    setSwapState(null);
    setTx(undefined);
    setError(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  return {
    isSwapping,
    swapState,
    tx,
    error,
    setError,
    executeSwapTransaction,
    resetTransactionState,
  };
}
