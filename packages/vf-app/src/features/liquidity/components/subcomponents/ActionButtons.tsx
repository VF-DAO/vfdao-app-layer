import React from 'react';
import { Minus, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ActionButtonsProps {
  isWalletConnected: boolean;
  onAddLiquidity: () => void;
  onRemoveLiquidity: () => void;
}

export function ActionButtons({ isWalletConnected, onAddLiquidity, onRemoveLiquidity }: ActionButtonsProps) {
  return (
    <div className="space-y-3">
      <Button
        onClick={onAddLiquidity}
        disabled={!isWalletConnected}
        variant="verified"
        className="w-full gap-2"
      >
        <Plus className="w-4 h-4" />
        Add Liquidity
      </Button>
      <Button
        onClick={onRemoveLiquidity}
        disabled={!isWalletConnected}
        variant="secondary"
        className="w-full gap-2"
      >
        <Minus className="w-4 h-4" />
        Remove Liquidity
      </Button>
    </div>
  );
}
