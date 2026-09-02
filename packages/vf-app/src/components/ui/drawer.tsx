'use client';

import React, { useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { backdropVariants, drawerVariants, expandVariants, modalVariants, transitions } from '@/lib/animations';
import { useDesktopOverlay } from '@/hooks/use-media-query';

interface DrawerProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  closeOnBackdrop?: boolean;
  disableClose?: boolean;
  labelledBy?: string;
}

interface DrawerHeaderProps {
  icon?: React.ReactNode;
  title: string;
  subtitle?: string;
  onClose?: () => void;
  disableClose?: boolean;
}

interface DrawerContentProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerFooterProps {
  children: React.ReactNode;
  className?: string;
}

interface DrawerExpandableSectionProps {
  isOpen: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * Single overlay host. Phone: bottom sheet. Desktop: centered dialog.
 * Same actions and chrome — not a second overlay system.
 */
export function Drawer({
  isOpen,
  onClose,
  children,
  closeOnBackdrop = true,
  disableClose = false,
  labelledBy,
}: DrawerProps) {
  const isDesktop = useDesktopOverlay();
  const mouseDownTarget = React.useRef<EventTarget | null>(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen && !disableClose && closeOnBackdrop) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [closeOnBackdrop, disableClose, isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={transitions.normal}
          />
          <div
            className="fixed inset-0 z-50 flex items-end justify-center md:items-center md:p-6 md:left-20"
            onMouseDown={(event) => {
              mouseDownTarget.current = event.target;
            }}
            onClick={(event) => {
              if (
                event.target === event.currentTarget &&
                mouseDownTarget.current === event.currentTarget &&
                closeOnBackdrop &&
                !disableClose
              ) {
                onClose();
              }
            }}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby={labelledBy}
              data-presentation={isDesktop ? 'dialog' : 'sheet'}
              className="flex max-h-[88vh] w-full max-w-lg flex-col overflow-hidden rounded-t-3xl border border-border bg-card shadow-main-card md:max-h-[min(88vh,40rem)] md:rounded-3xl"
              variants={isDesktop ? modalVariants : drawerVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transitions.spring}
              onClick={(event) => event.stopPropagation()}
              onMouseDown={(event) => event.stopPropagation()}
            >
              <div className="flex justify-center pt-3 md:hidden">
                <div className="h-1.5 w-10 rounded-full bg-muted-foreground/30" />
              </div>
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

function DrawerHeader({ icon, title, subtitle, onClose, disableClose = false }: DrawerHeaderProps) {
  return (
    <div className="flex-shrink-0 bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 px-5 pb-4 pt-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {icon && <div className="flex-shrink-0">{icon}</div>}
          <div className="min-w-0">
            <h2 id="app-drawer-title" className="truncate text-lg font-bold text-foreground">
              {title}
            </h2>
            {subtitle && <p className="text-sm text-muted-foreground">{subtitle}</p>}
          </div>
        </div>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            className="flex-shrink-0 rounded-full p-2 transition-colors hover:bg-muted/50 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Close drawer"
          >
            <X className="h-5 w-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

function DrawerContent({ children, className = '' }: DrawerContentProps) {
  return <div className={`flex-1 overflow-y-auto px-5 pb-6 pt-2 ${className}`}>{children}</div>;
}

function DrawerFooter({ children, className = '' }: DrawerFooterProps) {
  return <div className={`flex-shrink-0 border-t border-border px-5 py-4 ${className}`}>{children}</div>;
}

function DrawerExpandableSection({ isOpen, children, className = '' }: DrawerExpandableSectionProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          variants={expandVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={transitions.normal}
          className={className}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

Drawer.Header = DrawerHeader;
Drawer.Content = DrawerContent;
Drawer.Footer = DrawerFooter;
Drawer.ExpandableSection = DrawerExpandableSection;
