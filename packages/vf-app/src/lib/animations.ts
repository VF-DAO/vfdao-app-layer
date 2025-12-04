// src/lib/animations.ts
// Centralized animation system using Framer Motion
// Use these variants and transitions for consistent animations across the app

import type { Transition, Variants } from 'framer-motion';

// ============================================
// TRANSITION PRESETS
// ============================================

export const transitions = {
  /** Fast micro-interactions (buttons, toggles) */
  fast: { duration: 0.15, ease: 'easeOut' } as Transition,
  
  /** Normal UI transitions (dropdowns, tooltips) */
  normal: { duration: 0.2, ease: 'easeOut' } as Transition,
  
  /** Slower transitions (modals, page transitions) */
  slow: { duration: 0.3, ease: 'easeOut' } as Transition,
  
  /** Spring animation - natural, responsive feel */
  spring: { 
    type: 'spring', 
    damping: 25, 
    stiffness: 300 
  } as Transition,
  
  /** Bouncy spring - playful, attention-grabbing */
  springBouncy: { 
    type: 'spring', 
    damping: 20, 
    stiffness: 400 
  } as Transition,
  
  /** Gentle spring - subtle, elegant */
  springGentle: { 
    type: 'spring', 
    damping: 30, 
    stiffness: 200 
  } as Transition,
  
  /** For height/layout animations */
  layout: { 
    type: 'spring', 
    damping: 25, 
    stiffness: 300,
    mass: 0.5 
  } as Transition,

  /** Smooth expand/collapse for cards and panels */
  expand: {
    duration: 0.35,
    ease: [0.4, 0, 0.2, 1], // Material Design ease
  } as Transition,
};

// ============================================
// BASE VARIANTS
// ============================================

/** Simple fade in/out */
export const fadeVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Fade + slide up (common for content appearing) */
export const slideUpVariants: Variants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Fade + slide down (dropdowns, menus) */
export const slideDownVariants: Variants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Fade + scale (modals, cards, popovers) */
export const scaleVariants: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/** Height expand/collapse (accordions, expandable sections) */
export const expandVariants: Variants = {
  hidden: { height: 0, opacity: 0 },
  visible: { height: 'auto', opacity: 1 },
  exit: { height: 0, opacity: 0 },
};

// ============================================
// COMPONENT-SPECIFIC VARIANTS
// ============================================

/** Modal backdrop */
export const backdropVariants: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Modal content */
export const modalVariants: Variants = {
  hidden: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
  visible: { 
    opacity: 1, 
    scale: 1,
    y: 0,
  },
  exit: { 
    opacity: 0, 
    scale: 0.95,
    y: 20,
  },
};

/** Dropdown menus */
export const dropdownVariants: Variants = {
  hidden: { 
    opacity: 0, 
    y: -5,
    scale: 0.98,
  },
  visible: { 
    opacity: 1, 
    y: 0,
    scale: 1,
  },
  exit: { 
    opacity: 0, 
    y: -5,
    scale: 0.98,
  },
};

/** Cards entering view (staggered) */
export const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
};

/** Toast/notification */
export const toastVariants: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -20, scale: 0.95 },
};

/** List item (for staggered lists) */
export const listItemVariants: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: 10 },
};

// ============================================
// STAGGER HELPERS
// ============================================

/** Container for staggered children */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      staggerChildren: 0.03,
      staggerDirection: -1,
    },
  },
};

/** Faster stagger for small lists */
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.03,
      delayChildren: 0.05,
    },
  },
};

// ============================================
// HOVER/TAP STATES (for whileHover, whileTap)
// ============================================

export const hoverScale = {
  scale: 1.02,
  transition: transitions.fast,
};

export const hoverScaleSmall = {
  scale: 1.01,
  transition: transitions.fast,
};

export const tapScale = {
  scale: 0.98,
  transition: transitions.fast,
};

export const hoverLift = {
  y: -2,
  transition: transitions.fast,
};

// ============================================
// UTILITY FUNCTIONS
// ============================================

/**
 * Create a delayed variant for staggered animations
 */
export function withDelay(variants: Variants, delay: number): Variants {
  return {
    ...variants,
    visible: {
      ...(variants.visible as object),
      transition: {
        ...transitions.spring,
        delay,
      },
    },
  };
}

/**
 * Create custom transition for a variant
 */
export function withTransition(variants: Variants, transition: Transition): Variants {
  return {
    ...variants,
    visible: {
      ...(variants.visible as object),
      transition,
    },
    exit: {
      ...(variants.exit as object),
      transition: { ...transition, duration: (transition as any).duration * 0.7 },
    },
  };
}
