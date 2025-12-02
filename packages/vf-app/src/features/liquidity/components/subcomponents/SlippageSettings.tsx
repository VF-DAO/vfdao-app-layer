import React from 'react';
import { Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TokenInput } from '@/features/swap/components/TokenInput';

interface SlippageSettingsProps {
  slippage: number;
  customSlippage: string;
  onSlippageChange: (value: number) => void;
  onCustomSlippageChange: (value: string) => void;
  presets?: { value: number; label: string }[];
}

const DEFAULT_SLIPPAGE_PRESETS = [
  { value: 0.1, label: '0.1%' },
  { value: 0.5, label: '0.5%' },
  { value: 1.0, label: '1.0%' },
];

export function SlippageSettings({
  slippage,
  customSlippage,
  onSlippageChange,
  onCustomSlippageChange,
  presets = DEFAULT_SLIPPAGE_PRESETS,
}: SlippageSettingsProps) {
  return (
    <div className="bg-card border border-border rounded-2xl p-4 sm:p-6 md:p-8 shadow-modal dark:shadow-primary/20 space-y-3">
      <div>
        <p className="text-xs sm:text-sm font-medium text-foreground mb-2">Slippage Tolerance</p>
        <div className="flex gap-2 mb-2">
          {presets.map((preset) => (
            <Button
              key={preset.value}
              onClick={() => onSlippageChange(preset.value)}
              variant={slippage === preset.value && !customSlippage ? 'presetActive' : 'preset'}
              size="sm"
              className="flex-1"
            >
              {preset.label}
            </Button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <TokenInput
            value={customSlippage}
            onChange={onCustomSlippageChange}
            placeholder="Custom"
            className="flex-1 px-3 py-2 bg-transparent border border-border rounded-full text-xs focus:outline-none focus:border-muted-foreground/50 transition-all placeholder:text-primary placeholder:font-medium placeholder:opacity-60"
            decimalLimit={2}
          />
          <span className="text-xs text-muted-foreground">%</span>
        </div>
      </div>
      <div className="flex items-start gap-2 p-2 bg-primary/10 rounded-full">
        <Info className="w-4 h-4 text-primary mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Your transaction will revert if the price changes unfavorably by more than this percentage.
        </p>
      </div>
    </div>
  );
}
