'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import { Check, ChevronDown } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { dropdownStyles } from '@/components/ui/dropdown-menu';
import { TokenInput } from '@/features/swap/components/TokenInput';
import { AddressInput } from '../shared/AddressInput';
import type { ProposalComponentProps } from '../shared/types';

export function TransferProposal({
  formData,
  onFormDataChange,
  validationErrors,
  availableTokens,
  onValidationChange,
  nearBalance,
}: ProposalComponentProps) {
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const tokenRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tokenRef.current && !tokenRef.current.contains(event.target as Node)) {
        setTokenDropdownOpen(false);
      }
    };

    if (tokenDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [tokenDropdownOpen]);

  const selectedToken = availableTokens.find(t => t.contractId === formData.tokenId);

  // Get available balance for the selected token
  const availableBalance = useMemo(() => {
    if (!formData.tokenId) return null;
    
    // NEAR balance
    if (formData.tokenId === 'wrap.near') {
      return nearBalance ? { amount: nearBalance, symbol: 'NEAR' } : null;
    }
    
    // Token balance
    const token = availableTokens.find(t => t.contractId === formData.tokenId);
    if (token?.balance) {
      return { amount: token.balance, symbol: token.symbol };
    }
    
    return null;
  }, [formData.tokenId, nearBalance, availableTokens]);

  // Determine token dropdown border class
  const getTokenBorderClass = () => {
    return 'border-border hover:border-muted-foreground/50 focus:border-muted-foreground/50';
  };

  // Determine amount field border class
  const getAmountBorderClass = () => {
    return 'border-border hover:border-muted-foreground/50 focus:border-muted-foreground/50';
  };

  return (
    <div className="space-y-4">
      <div className="text-sm font-medium text-foreground">Transfer Details</div>

      <div className="grid grid-cols-1 gap-4">
        {/* Token Selection */}
        <div className="space-y-1">
          <Label htmlFor="token" className="text-xs text-muted-foreground">Token</Label>
          <div className="relative flex items-center" ref={tokenRef}>
            <button
              type="button"
              onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
              className={`w-full h-12 bg-transparent border rounded-full text-sm focus:outline-none px-4 flex items-center justify-between transition-colors ${getTokenBorderClass()}`}
            >
              <div className="flex items-center gap-2">
                {selectedToken?.icon ? (
                  <Image
                    src={selectedToken.icon}
                    alt={selectedToken.symbol}
                    width={20}
                    height={20}
                    className="rounded-full"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center">
                    <span className="text-[10px] font-bold">{selectedToken?.symbol.slice(0, 2)}</span>
                  </div>
                )}
                <span className="text-foreground">
                  {selectedToken?.symbol ?? 'Select token...'}
                </span>
              </div>
              <ChevronDown className="w-5 h-5 text-muted-foreground" />
            </button>

            {/* Dropdown Menu */}
            {tokenDropdownOpen && (
              <div className={`absolute top-full left-0 right-0 mt-1 ${dropdownStyles.base} max-h-48 overflow-y-auto p-2 space-y-0.5`}>
                {availableTokens.map((token) => (
                  <button
                    key={token.contractId}
                    type="button"
                    onClick={() => {
                      onFormDataChange({ tokenId: token.contractId });
                      setTokenDropdownOpen(false);
                    }}
                    className={dropdownStyles.item}
                  >
                    {token.icon ? (
                      <Image
                        src={token.icon}
                        alt={token.symbol}
                        width={20}
                        height={20}
                        className="rounded-full flex-shrink-0"
                      />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        <span className="text-[10px] font-bold">{token.symbol.slice(0, 2)}</span>
                      </div>
                    )}
                    <span className={dropdownStyles.itemText}>{token.symbol}</span>
                    <Check className={dropdownStyles.check(formData.tokenId === token.contractId)} />
                  </button>
                ))}
              </div>
            )}
          </div>
          {validationErrors.tokenId && (
            <p className="text-xs text-orange">{validationErrors.tokenId}</p>
          )}
        </div>

        {/* Amount */}
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <Label htmlFor="amount" className="text-xs text-muted-foreground">Amount</Label>
            {availableBalance && (
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                Available: <span className="text-primary font-medium">{availableBalance.amount} {availableBalance.symbol}</span>
              </span>
            )}
          </div>
          <div className="relative flex items-center">
            <TokenInput
              value={formData.amount ?? ''}
              onChange={(value) => onFormDataChange({ amount: value })}
              placeholder="0.0"
              decimalLimit={selectedToken?.decimals ?? 24}
              variant="form"
              className={`w-full h-12 bg-transparent border rounded-full focus:outline-none placeholder:text-primary placeholder:font-medium placeholder:opacity-60 leading-tight ${getAmountBorderClass()}`}
            />
          </div>
          {validationErrors.amount && (
            <p className="text-xs text-orange">{validationErrors.amount}</p>
          )}
        </div>
      </div>

      {/* Recipient */}
      <AddressInput
        id="receiver"
        value={formData.receiverId ?? ''}
        onChange={(value) => onFormDataChange({ receiverId: value })}
        placeholder="Enter recipient address"
        label="Recipient Address"
        error={validationErrors.receiverId}
        onValidationChange={(exists) => onValidationChange?.('receiverId', exists)}
      />
    </div>
  );
}