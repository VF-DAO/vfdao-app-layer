import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const iconContainerVariants = cva(
  'rounded-full flex items-center justify-center transition-all duration-200',
  {
    variants: {
      variant: {
        // Active/highlighted state - verified border with glow
        active: 'border-2 border-verified bg-verified/10 scale-110 shadow-md shadow-verified/20',
        
        // Inactive state - no border or background, verified background on hover
        inactive: 'border border-transparent bg-transparent hover:bg-verified/10 group-hover:bg-verified/10',
        
        // Inactive without hover
        inactiveStatic: 'border border-transparent bg-transparent',
      },
      size: {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
      },
    },
    defaultVariants: {
      variant: 'inactive',
      size: 'lg',
    },
  }
);

const iconVariants = cva(
  'transition-colors',
  {
    variants: {
      variant: {
        active: 'text-primary',
        inactive: 'text-foreground group-hover:text-primary',
        inactiveStatic: 'text-muted-foreground',
      },
    },
    defaultVariants: {
      variant: 'inactive',
    },
  }
);

export interface IconContainerProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof iconContainerVariants> {}

function IconContainer({ className, variant, size, ...props }: IconContainerProps) {
  return (
    <div className={cn(iconContainerVariants({ variant, size }), className)} {...props} />
  );
}

// Helper to get icon classes based on container variant
function getIconClasses(variant: 'active' | 'inactive' | 'inactiveStatic' = 'inactive') {
  return iconVariants({ variant });
}

export { IconContainer, iconContainerVariants, iconVariants, getIconClasses };
