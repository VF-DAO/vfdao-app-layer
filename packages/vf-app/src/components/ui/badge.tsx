import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const badgeVariants = cva(
  'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
  {
    variants: {
      variant: {
        default:
          'border-transparent bg-verified text-verified-foreground',
        verified:
          'border border-verified bg-verified/10 text-primary shadow-sm shadow-verified/20',
        primary:
          'border border-primary bg-secondary/10 text-primary shadow-sm shadow-primary/20',
        secondary:
          'border border-primary bg-secondary/10 text-primary shadow-sm shadow-primary/20',
        destructive:
          'border border-orange bg-orange/10 text-orange shadow-sm shadow-orange/20',
        orange:
          'border border-orange bg-orange/10 text-orange shadow-sm shadow-orange/20',
        muted:
          'border border-muted-foreground/50 bg-muted/50 text-muted-foreground shadow-sm shadow-muted-foreground/10',
        outline: 'text-foreground',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

/**
 * Usage Examples:
 * 
 * Status Indicators:
 * <Badge variant="verified">InProgress</Badge>
 * <Badge variant="secondary">Approved</Badge>
 * <Badge variant="orange">Rejected</Badge>
 * <Badge variant="muted">Expired</Badge>
 * 
 * Informational:
 * <Badge variant="primary">Council</Badge>
 * <Badge variant="outline">Transfer</Badge>
 * <Badge variant="default">New</Badge>
 * 
 * With Custom Styling:
 * <Badge variant="verified" className="text-xs">Active</Badge>
 * <Badge variant="muted">Archived</Badge>
 */
