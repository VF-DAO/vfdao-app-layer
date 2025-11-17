import React from 'react';
import { Droplets } from 'lucide-react';

export function EmptyLiquidityState() {
  return (
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
  );
}
