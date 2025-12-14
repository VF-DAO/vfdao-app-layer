import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const dividerVariants = cva(
  'flex-shrink-0',
  {
    variants: {
      variant: {
        // Horizontal divider - subtle border (used between sections)
        horizontal: 'w-full border-t border-border/30',
        
        // Vertical divider - matching horizontal style
        vertical: 'h-8 w-px border-l border-border/30',
        
        // Vertical divider - verified/green color (used in portfolio dashboard)
        verticalVerified: 'h-8 w-px border-l border-verified/30',
        
        // Left accent border - primary/cyan color (used in DAO info card)
        leftAccentPrimary: 'border-l-2 border-primary/20',
      },
    },
    defaultVariants: {
      variant: 'horizontal',
    },
  }
);

export interface DividerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof dividerVariants> {}

function Divider({ className, variant, ...props }: DividerProps) {
  return (
    <div className={cn(dividerVariants({ variant }), className)} {...props} />
  );
}

export { Divider, dividerVariants };
