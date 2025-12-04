import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';
import { LoadingDots } from './loading-dots';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed shadow-sm hover:shadow-md disabled:shadow-none',
  {
    variants: {
      variant: {
        // Primary brand button - verified color with shadows
        verified: 'border border-verified bg-verified/10 text-primary shadow-verified/20 hover:bg-verified/20 hover:shadow-verified/30 disabled:bg-transparent disabled:text-muted-foreground disabled:border-verified/30 disabled:hover:bg-transparent',
        
        // Primary button - forest green with shadows
        primary: 'border border-primary bg-primary/10 text-primary shadow-primary/20 hover:bg-primary/20 hover:shadow-primary/30 disabled:opacity-50',
        
        // Secondary action button - sage background with primary text
        secondary: 'border border-primary bg-secondary/10 text-primary shadow-primary/20 hover:bg-secondary/20 hover:shadow-primary/30 disabled:opacity-50',
        
        // Destructive/danger button - orange with shadows
        destructive: 'border border-orange bg-orange/10 text-orange shadow-orange/20 hover:bg-orange/20 hover:shadow-orange/30 disabled:opacity-50',
        
        // Orange button alias
        orange: 'border border-orange bg-orange/10 text-orange shadow-orange/20 hover:bg-orange/20 hover:shadow-orange/30 disabled:opacity-50',
        
        // Small percentage buttons (25%, 50%, 75%)
        percentage: 'border border-border bg-card text-muted-foreground hover:border-muted-foreground/50 hover:text-primary shadow-none hover:shadow-none',
        
        // Slippage preset buttons (inactive state)
        preset: 'border border-border bg-card text-muted-foreground hover:border-muted-foreground/50 hover:text-primary font-medium shadow-none hover:shadow-none',
        
        // Slippage preset buttons (active state)
        presetActive: 'border border-primary bg-secondary/10 text-primary shadow-primary/20 hover:bg-secondary/20 hover:shadow-primary/30 font-medium',
        
        // Filter/tab buttons (inactive state) - matches nav icon style exactly
        filter: 'border border-border bg-card text-muted-foreground hover:border-muted-foreground/50 hover:text-primary shadow-none hover:shadow-none',
        
        // Filter/tab buttons (active state) - verified/gold
        filterActive: 'border border-verified bg-verified/10 text-primary shadow-md shadow-verified/20',
        
        // Filter/tab buttons (active state) - primary/green
        filterPrimary: 'border border-primary bg-primary/10 text-primary shadow-md shadow-primary/20',
        
        // Filter/tab buttons (active state) - primary/green (success/approved)
        filterSecondary: 'border border-primary bg-secondary/10 text-primary shadow-md shadow-primary/20',
        
        // Filter/tab buttons (active state) - orange (warning/rejected)
        filterOrange: 'border border-orange bg-orange/10 text-orange shadow-md shadow-orange/20',
        
        // Filter/tab buttons (active state) - muted (inactive/expired)
        filterMuted: 'border border-muted-foreground/50 bg-muted/50 text-muted-foreground shadow-md shadow-muted-foreground/10',
        
        // Navigation buttons (inactive) - for prev/next, pagination
        nav: 'border border-border bg-card text-muted-foreground hover:border-muted-foreground/50 hover:text-primary shadow-none hover:shadow-none disabled:opacity-50',
        
        // Navigation buttons (active/primary state)
        navActive: 'border border-primary bg-primary/10 text-primary shadow-md shadow-primary/20',
        
        // Subtle action buttons - for explorer, share, secondary actions (same hover as nav)
        navMuted: 'border border-border bg-card text-muted-foreground hover:border-muted-foreground/50 hover:text-primary shadow-none hover:shadow-none',
        
        // Cancel/outline button - subtle border style
        outline: 'border border-border bg-card text-muted-foreground hover:border-muted-foreground/50 hover:text-primary shadow-none hover:shadow-none',
        
        // Cancel button - muted with shadows like other action buttons
        muted: 'border border-muted-foreground/50 bg-muted/50 text-muted-foreground shadow-muted-foreground/20 hover:bg-muted/70 hover:shadow-muted-foreground/30 disabled:opacity-50',
        
        // Ghost button for minimal actions
        ghost: 'border border-transparent bg-transparent text-muted-foreground hover:border-muted-foreground/50 hover:text-primary shadow-none hover:shadow-none',
        
        // Link style button - no underline
        link: 'text-primary hover:text-primary/80 shadow-none hover:shadow-none',
      },
      size: {
        default: 'px-4 py-3 text-sm',        // Main action buttons
        sm: 'px-3 py-2 text-xs',             // Slippage preset buttons
        lg: 'px-4 py-3 sm:py-4 text-sm',     // Large buttons (swap)
        xs: 'px-1 py-0.5 text-xs',           // Percentage buttons
        icon: 'h-10 w-10',
        filter: 'px-2.5 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm', // Filter/tab buttons
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

// LoadingButton - Button with built-in loading state
export interface LoadingButtonProps extends ButtonProps {
  /** Whether the button is in a loading state */
  isLoading?: boolean;
  /** Text to show when loading (if omitted, only dots are shown) */
  loadingText?: string;
  /** Size of loading dots (defaults to 'sm' for buttons) */
  dotSize?: 'xs' | 'sm' | 'md' | 'lg';
}

/**
 * A button component with built-in loading state support.
 * Shows LoadingDots when isLoading is true.
 * 
 * @example
 * // Just dots when loading
 * <LoadingButton isLoading={isSaving}>Save Profile</LoadingButton>
 * 
 * @example
 * // With loading text
 * <LoadingButton isLoading={isSubmitting} loadingText="Processing...">Submit</LoadingButton>
 */
const LoadingButton = React.forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ 
    children, 
    isLoading = false, 
    loadingText,
    dotSize = 'sm',
    disabled,
    className,
    ...props 
  }, ref) => {
    return (
      <Button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(className)}
        {...props}
      >
        <span className="inline-flex items-center justify-center min-h-[20px]">
          {isLoading ? (
            loadingText ? (
              <span className="flex items-center gap-2">
                <LoadingDots size={dotSize} />
                <span>{loadingText}</span>
              </span>
            ) : (
              <LoadingDots size={dotSize} />
            )
          ) : (
            children
          )}
        </span>
      </Button>
    );
  }
);

LoadingButton.displayName = 'LoadingButton';

export { LoadingButton };

/**
 * Usage Examples:
 * 
 * Primary Actions:
 * <Button variant="verified">Swap</Button>
 * <Button variant="verified">Approve Proposal</Button>
 * <Button variant="secondary">Add Liquidity</Button>
 * 
 * Destructive/Warning Actions:
 * <Button variant="orange">Reject Proposal</Button>
 * <Button variant="destructive">Delete</Button>
 * 
 * Secondary/Cancel Actions:
 * <Button variant="muted">Cancel</Button>
 * <Button variant="outline">Close</Button>
 * <Button variant="ghost">Dismiss</Button>
 * 
 * Sizes:
 * <Button size="xs">25%</Button>
 * <Button size="sm">Auto</Button>
 * <Button size="default">Submit</Button>
 * <Button size="lg">Swap Tokens</Button>
 * <Button size="icon"><Icon /></Button>
 * 
 * States:
 * <Button disabled>Loading...</Button>
 * <Button variant="presetActive">1.0%</Button>
 * <Button variant="preset">0.5%</Button>
 */
