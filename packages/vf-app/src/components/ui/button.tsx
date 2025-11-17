import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed',
  {
    variants: {
      variant: {
        // Primary brand button - verified color with shadows
        verified: 'border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20 hover:bg-verified/20 hover:shadow-lg hover:shadow-verified/30 disabled:bg-transparent disabled:text-muted-foreground disabled:border-verified/30 disabled:shadow-none disabled:hover:bg-transparent',
        
        // Secondary action button
        secondary: 'border border-primary bg-primary/10 text-primary hover:bg-primary/20 disabled:hover:bg-primary/10',
        
        // Destructive/error button
        destructive: 'border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20',
        
        // Small percentage buttons (25%, 50%, 75%)
        percentage: 'border border-border bg-card text-primary hover:bg-muted opacity-70 hover:opacity-80',
        
        // Slippage preset buttons (inactive state)
        preset: 'bg-card hover:bg-muted-foreground/10 text-foreground font-medium',
        
        // Slippage preset buttons (active state)
        presetActive: 'bg-primary text-primary-foreground font-medium',
        
        // Cancel/outline button - subtle border style
        outline: 'border border-border text-foreground/70 hover:text-foreground hover:bg-muted/20 hover:border-muted-foreground/30',
        
        // Ghost button for minimal actions
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        
        // Link style button
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'px-4 py-3 text-sm',        // Main action buttons
        sm: 'px-3 py-2 text-xs',             // Slippage preset buttons
        lg: 'px-4 py-3 sm:py-4 text-sm',     // Large buttons (swap)
        xs: 'px-1 py-0.5 text-xs',           // Percentage buttons
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'verified',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
