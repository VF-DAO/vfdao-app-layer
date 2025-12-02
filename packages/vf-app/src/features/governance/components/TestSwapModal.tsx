'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, X, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { LoadingDots } from '@/components/ui/loading-dots';
import { useWallet } from '@/features/wallet';
import { useSwapExecutor } from '@/hooks/useSwapExecutor';
import Big from 'big.js';

interface TestSwapModalProps {
  isOpen: boolean;
  onClose: () => void;
  swapData: {
    tokenIn: string;
    tokenOut: string;
    amountIn: string;
    minAmountOut: string;
    poolId: string;
  };
  availableTokens: {
    contractId: string;
    symbol: string;
    decimals: number;
    icon?: string;
  }[];
}

export function TestSwapModal({ isOpen, onClose, swapData, availableTokens }: TestSwapModalProps) {
  const { wallet, accountId } = useWallet();
  const { executeDirectSwap, getTransactionPreview: _getTransactionPreview } = useSwapExecutor();
  const [isExecuting, setIsExecuting] = useState(false);
  const [result, setResult] = useState<{
    type: 'success' | 'error' | null;
    message?: string;
    txHash?: string;
  }>({ type: null });

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Convert wrap.near to near for the swap functions (useSwap expects 'near' for NEAR input/output)
  const swapTokenIn = swapData.tokenIn === 'wrap.near' ? 'near' : swapData.tokenIn;
  const swapTokenOut = swapData.tokenOut === 'wrap.near' ? 'near' : swapData.tokenOut;

  if (!isOpen) return null;

  const executeTestSwap = async () => {
    if (!wallet || !accountId) {
      setResult({ type: 'error', message: 'Wallet not connected' });
      return;
    }

    setIsExecuting(true);
    setResult({ type: null });

    try {
      const txHash = await executeDirectSwap(swapData, availableTokens);

      setResult({
        type: 'success',
        message: 'Test swap executed successfully!',
        txHash,
      });
    } catch (error) {
      console.error('Test swap failed:', error);
      setResult({
        type: 'error',
        message: error instanceof Error ? error.message : 'Test swap failed',
      });
    } finally {
      setIsExecuting(false);
    }
  };

  const resetModal = () => {
    setResult({ type: null });
  };

  const tokenInInfo = availableTokens.find(t => t.contractId === swapData.tokenIn);
  const tokenOutInfo = availableTokens.find(t => t.contractId === swapData.tokenOut);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-bold text-foreground">Test Swap Transaction</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Warning */}
          <div className="bg-orange/10 border border-orange/20 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-orange flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-orange mb-1">Test Transaction</p>
                <p className="text-muted-foreground">
                  This will execute the exact same swap logic as the DAO proposal, but directly from your account.
                  Make sure you have sufficient funds and understand the transaction details below.
                </p>
              </div>
            </div>
          </div>

          {/* Swap Details */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">Swap Details</h3>
            <div className="bg-muted/30 rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">From:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tokenInInfo?.symbol ?? swapData.tokenIn}</span>
                  <span className="text-sm text-muted-foreground">{swapData.amountIn}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">To:</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{tokenOutInfo?.symbol ?? swapData.tokenOut}</span>
                  <span className="text-sm text-muted-foreground">≥ {swapData.minAmountOut}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Pool ID:</span>
                <span className="font-medium">{swapData.poolId}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Account:</span>
                <span className="font-medium text-sm">{accountId}</span>
              </div>
            </div>
          </div>

          {/* Pool Information */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">Pool Information</h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="text-sm text-muted-foreground">
                Pool validation handled by Ref Finance integration
              </div>
            </div>
          </div>
          {/* Transaction Structure Preview */}
          <div className="space-y-3">
            <h3 className="font-medium text-foreground">Transaction Preview</h3>
            <div className="bg-muted/30 rounded-lg p-4">
              <pre className="text-xs text-muted-foreground whitespace-pre-wrap overflow-x-auto">
{swapData.tokenIn === 'wrap.near' && swapData.tokenOut === '17208628f84f5d6ad33f0da3bbbeb27ffcb398eac501a31bd6ad2011e36133a1' ? `Receiver: wrap.near
Actions:
1. near_deposit (deposit: ${swapData.amountIn} NEAR)
2. ft_transfer_call to dclv2.ref-labs.near
   msg: ${JSON.stringify({
     Swap: {
       pool_ids: ['${swapData.tokenOut}|${swapData.tokenIn}|100'],
       output_token: '${swapData.tokenOut}',
       min_output_amount: '${new Big(swapData.minAmountOut).times(new Big(10).pow(tokenOutInfo?.decimals || 6)).toString()}'
     }
   }, null, 2)}` : swapData.tokenIn === 'wrap.near' ? `Receiver: wrap.near
Actions:
1. near_deposit (deposit: ${swapData.amountIn} NEAR)
2. ft_transfer_call to v2.ref-finance.near
   msg: ${JSON.stringify({
     force: 0,
     actions: [{
       pool_id: parseInt(swapData.poolId),
       token_in: 'wrap.near',
       token_out: swapTokenOut,
       amount_in: new Big(swapData.amountIn).times(new Big(10).pow(tokenInInfo?.decimals ?? 24)).toString(),
       min_amount_out: new Big(swapData.minAmountOut).toString(),
     }],
   }, null, 2)}` : `Receiver: v2.ref-finance.near
Action: swap
args: ${JSON.stringify({
  force: 0,
  actions: [{
    pool_id: parseInt(swapData.poolId),
    token_in: swapTokenIn,
    token_out: swapTokenOut,
    amount_in: new Big(swapData.amountIn).times(new Big(10).pow(tokenInInfo?.decimals ?? 24)).toString(),
    min_amount_out: new Big(swapData.minAmountOut).toString(),
  }],
  ...(swapTokenOut === 'near' ? { skip_unwrap_near: false } : {}),
}, null, 2)}`}
              </pre>
            </div>
          </div>

          {/* Result */}
          {result.type && (
            <div className={`rounded-lg p-4 ${
              result.type === 'success'
                ? 'bg-verified/10 border border-verified/20'
                : 'bg-orange/10 border border-orange/20'
            }`}>
              <div className="flex items-start gap-3">
                {result.type === 'success' ? (
                  <CheckCircle2 className="h-5 w-5 text-verified flex-shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-orange flex-shrink-0 mt-0.5" />
                )}
                <div className="text-sm">
                  <p className={`font-medium mb-1 ${
                    result.type === 'success' ? 'text-verified' : 'text-orange'
                  }`}>
                    {result.type === 'success' ? 'Success!' : 'Error'}
                  </p>
                  <p className="text-muted-foreground mb-2">{result.message}</p>
                  {result.txHash && (
                    <a
                      href={`https://nearblocks.io/txns/${result.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-verified hover:underline text-sm"
                    >
                      View Transaction →
                    </a>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <Button
              variant="muted"
              onClick={onClose}
              className="flex-1"
              disabled={isExecuting}
            >
              Close
            </Button>
            {!result.type || result.type === 'error' ? (
              <Button
                variant="verified"
                onClick={() => void executeTestSwap()}
                disabled={isExecuting || !wallet}
                className="flex-1"
              >
                {isExecuting ? (
                  <LoadingDots />
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Execute Test Swap
                  </>
                )}
              </Button>
            ) : (
              <Button
                variant="outline"
                onClick={resetModal}
                className="flex-1"
              >
                Test Again
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}