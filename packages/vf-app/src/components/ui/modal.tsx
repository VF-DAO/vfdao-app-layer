'use client';

import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { 
  backdropVariants, 
  modalVariants, 
  expandVariants, 
  transitions 
} from '@/lib/animations';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  /** Maximum width class (default: max-w-lg) */
  maxWidth?: string;
  /** Whether clicking backdrop closes modal (default: true) */
  closeOnBackdrop?: boolean;
  /** Disable closing (e.g., during submission) */
  disableClose?: boolean;
}

interface ModalHeaderProps {
  /** Icon or avatar to display on the left */
  icon?: React.ReactNode;
  /** Main title text */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Close button handler */
  onClose?: () => void;
  /** Disable close button */
  disableClose?: boolean;
  /** Custom content to render instead of icon/title/subtitle */
  children?: React.ReactNode;
}

interface ModalContentProps {
  children: React.ReactNode;
  /** Additional className for content area */
  className?: string;
  /** Minimum height class (default: min-h-0) */
  minHeight?: string;
}

interface ModalFooterProps {
  children: React.ReactNode;
  /** Additional className for footer */
  className?: string;
}

interface ModalExpandableSectionProps {
  /** Whether the section is expanded */
  isOpen: boolean;
  /** Content to render when expanded */
  children: React.ReactNode;
  /** Additional className for the wrapper */
  className?: string;
}

/**
 * Centralized Modal component with consistent styling and animations
 * 
 * Features:
 * - Framer motion animations for smooth enter/exit (uses centralized animations.ts)
 * - Backdrop blur effect
 * - Body scroll lock when open
 * - Consistent gradient header styling
 * - Click outside to close (optional)
 * 
 * @example
 * <Modal isOpen={isOpen} onClose={handleClose}>
 *   <Modal.Header 
 *     icon={<UserIcon />} 
 *     title="Edit Profile" 
 *     subtitle="Update your information"
 *     onClose={handleClose}
 *   />
 *   <Modal.Content>
 *     <form>...</form>
 *   </Modal.Content>
 *   <Modal.Footer>
 *     <Button onClick={handleSubmit}>Save</Button>
 *   </Modal.Footer>
 * </Modal>
 */
export function Modal({
  isOpen,
  onClose,
  children,
  maxWidth = 'max-w-lg',
  closeOnBackdrop = true,
  disableClose = false,
}: ModalProps) {
  // Track where mousedown started to prevent closing when selecting text
  const mouseDownTarget = React.useRef<EventTarget | null>(null);

  // Lock body scroll when modal is open
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

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !disableClose && closeOnBackdrop) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose, disableClose, closeOnBackdrop]);

  const handleMouseDown = (e: React.MouseEvent) => {
    mouseDownTarget.current = e.target;
  };

  const handleClick = (e: React.MouseEvent) => {
    // Only close if both mousedown and click were on the backdrop (not inside modal content)
    if (
      e.target === e.currentTarget && 
      mouseDownTarget.current === e.currentTarget &&
      closeOnBackdrop && 
      !disableClose
    ) {
      onClose();
    }
  };

  return (
    <AnimatePresence mode="wait">
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          />
          
          {/* Modal Container */}
          <div 
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onMouseDown={handleMouseDown}
            onClick={handleClick}
          >
            <motion.div
              className={`bg-card border border-border rounded-2xl shadow-main-card w-full ${maxWidth} max-h-[90vh] overflow-hidden flex flex-col`}
              variants={modalVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={transitions.spring}
              onClick={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {children}
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

/**
 * Modal Header with gradient background and consistent styling
 */
function ModalHeader({
  icon,
  title,
  subtitle,
  onClose,
  disableClose = false,
  children,
}: ModalHeaderProps) {
  return (
    <div className="bg-gradient-to-r from-primary/5 via-verified/5 to-primary/5 p-4 sm:p-6 flex-shrink-0 text-left">
      <div className="flex items-center justify-between">
        {children ? (
          children
        ) : (
          <div className="flex items-center gap-3">
            {icon && (
              <div className="flex-shrink-0">
                {icon}
              </div>
            )}
            <div className="min-w-0">
              <h2 className="text-lg sm:text-xl font-bold text-foreground truncate">
                {title}
              </h2>
              {subtitle && (
                <p className="text-sm text-muted-foreground truncate">
                  {subtitle}
                </p>
              )}
            </div>
          </div>
        )}
        
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            disabled={disableClose}
            className="p-2 rounded-full hover:bg-muted/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Modal Content area with consistent padding
 */
function ModalContent({
  children,
  className = '',
  minHeight = 'min-h-0',
}: ModalContentProps) {
  return (
    <div className={`p-4 sm:p-6 overflow-y-auto flex-1 text-left ${minHeight} ${className}`}>
      {children}
    </div>
  );
}

/**
 * Modal Footer with border separator
 */
function ModalFooter({
  children,
  className = '',
}: ModalFooterProps) {
  return (
    <div className={`p-4 sm:p-6 flex-shrink-0 ${className}`}>
      {children}
    </div>
  );
}

/**
 * Expandable section with smooth height animation
 * Use for dropdowns, accordions, or any content that expands/collapses
 * Uses centralized animation variants from animations.ts
 */
function ModalExpandableSection({
  isOpen,
  children,
  className = '',
}: ModalExpandableSectionProps) {
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

// Attach sub-components
Modal.Header = ModalHeader;
Modal.Content = ModalContent;
Modal.Footer = ModalFooter;
Modal.ExpandableSection = ModalExpandableSection;
