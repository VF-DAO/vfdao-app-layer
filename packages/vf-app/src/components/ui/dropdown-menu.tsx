'use client';

import * as React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { dropdownVariants, transitions } from '@/lib/animations';

/**
 * Shared dropdown styling constants
 * Use these when creating custom dropdowns that don't use the DropdownMenu component
 */
export const dropdownStyles = {
  /** Base container styles for dropdown menus */
  container: 'bg-card border border-border rounded-2xl shadow-dropdown p-3 z-10',
  /** Animation classes for Tailwind-only dropdowns */
  animation: 'animate-in fade-in slide-in-from-top-1 duration-150',
  /** Combined container + animation for quick use */
  base: 'bg-card border border-border rounded-2xl shadow-dropdown p-3 z-10 animate-in fade-in slide-in-from-top-1 duration-150',
  /** Item styles for custom dropdown buttons */
  item: 'w-full px-4 py-2.5 flex items-center gap-2 rounded-full hover:bg-muted/50 hover:text-primary transition-colors text-left text-sm',
  /** Text styles for dropdown item labels */
  itemText: 'truncate flex-1 text-muted-foreground',
  /** Check mark that always reserves space (use with selected condition for color) */
  check: (selected: boolean) => `w-4 h-4 flex-shrink-0 ${selected ? 'text-verified' : 'text-transparent'}`,
} as const;

interface DropdownMenuContextValue {
  isOpen: boolean;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}

const DropdownMenuContext = React.createContext<DropdownMenuContextValue | null>(null);

function useDropdownMenu() {
  const context = React.useContext(DropdownMenuContext);
  if (!context) {
    throw new Error('DropdownMenu components must be used within a DropdownMenu');
  }
  return context;
}

interface DropdownMenuProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

/**
 * Root dropdown menu component
 * Provides context for controlled or uncontrolled state
 */
function DropdownMenu({ children, open, onOpenChange }: DropdownMenuProps) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = React.useCallback((value: React.SetStateAction<boolean>) => {
    const newValue = typeof value === 'function' ? value(isOpen) : value;
    if (!isControlled) {
      setInternalOpen(newValue);
    }
    onOpenChange?.(newValue);
  }, [isControlled, isOpen, onOpenChange]);

  // Close on click outside
  React.useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (triggerRef.current && !triggerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, setIsOpen]);

  // Close on Escape key
  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, setIsOpen]);

  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen, triggerRef }}>
      <div className="relative">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  );
}

interface DropdownMenuTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

/**
 * Trigger button for the dropdown menu
 */
const DropdownMenuTrigger = React.forwardRef<HTMLButtonElement, DropdownMenuTriggerProps>(
  ({ className, children, asChild, onClick, ...props }, forwardedRef) => {
    const { isOpen, setIsOpen, triggerRef } = useDropdownMenu();

    // Merge refs
    const ref = React.useMemo(() => {
      return (node: HTMLButtonElement | null) => {
        (triggerRef as React.MutableRefObject<HTMLButtonElement | null>).current = node;
        if (typeof forwardedRef === 'function') {
          forwardedRef(node);
        } else if (forwardedRef) {
          forwardedRef.current = node;
        }
      };
    }, [forwardedRef, triggerRef]);

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      setIsOpen(!isOpen);
      onClick?.(e);
    };

    if (asChild && React.isValidElement(children)) {
      return React.cloneElement(children as React.ReactElement<any>, {
        ref,
        onClick: handleClick,
        'aria-expanded': isOpen,
        'aria-haspopup': 'menu',
        ...props,
      });
    }

    return (
      <button
        ref={ref}
        type="button"
        onClick={handleClick}
        aria-expanded={isOpen}
        aria-haspopup="menu"
        className={className}
        {...props}
      >
        {children}
      </button>
    );
  }
);
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

interface DropdownMenuContentProps {
  children: React.ReactNode;
  className?: string;
  align?: 'start' | 'center' | 'end';
  sideOffset?: number;
}

/**
 * Content container for dropdown menu items
 * Uses Framer Motion for consistent animations
 */
function DropdownMenuContent({ 
  children, 
  className, 
  align = 'start',
  sideOffset = 4,
}: DropdownMenuContentProps) {
  const { isOpen } = useDropdownMenu();

  const alignmentClasses = {
    start: 'left-0',
    center: 'left-1/2 -translate-x-1/2',
    end: 'right-0',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          role="menu"
          variants={dropdownVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={transitions.fast}
          className={cn(
            'absolute top-full min-w-[140px]',
            alignmentClasses[align],
            dropdownStyles.container,
            className
          )}
          style={{ marginTop: sideOffset }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

interface DropdownMenuItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean;
  icon?: React.ReactNode;
}

/**
 * Individual dropdown menu item
 * Check mark always reserves space to prevent layout shift
 */
const DropdownMenuItem = React.forwardRef<HTMLButtonElement, DropdownMenuItemProps>(
  ({ className, children, selected, icon, onClick, ...props }, ref) => {
    const { setIsOpen } = useDropdownMenu();

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      onClick?.(e);
      setIsOpen(false);
    };

    return (
      <button
        ref={ref}
        type="button"
        role="menuitem"
        onClick={handleClick}
        className={cn(
          'flex w-full items-center justify-start gap-2 rounded-full px-4 py-2.5 text-sm transition-colors',
          'hover:bg-muted/50 hover:text-primary focus:bg-muted/50 focus:text-primary focus:outline-none',
          selected && 'text-primary',
          className
        )}
        {...props}
      >
        {icon && <span className="flex-shrink-0">{icon}</span>}
        <span className="flex-1 text-left text-muted-foreground">{children}</span>
        {/* Always render check to reserve space and prevent layout shift */}
        <svg 
          className={`h-4 w-4 flex-shrink-0 ${selected ? 'text-verified' : 'text-transparent'}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </button>
    );
  }
);
DropdownMenuItem.displayName = 'DropdownMenuItem';

/**
 * Visual separator between dropdown items
 */
function DropdownMenuSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-border', className)} />;
}

/**
 * Label for grouping dropdown items
 */
function DropdownMenuLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn('px-4 py-1.5 text-xs font-semibold text-muted-foreground', className)}>
      {children}
    </div>
  );
}

export {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
};
