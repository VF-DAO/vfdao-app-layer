/**
 * Centralized UI Styles
 * 
 * Shared style constants for consistent UI across the app.
 * Based on our design system using primary (cyan) and verified (green) colors.
 */

// =============================================================================
// DIVIDER STYLES
// Used for: separators between sections/items
// =============================================================================

export const dividerStyles = {
  // Vertical divider - verified/green color (used in portfolio dashboard)
  verticalVerified: 'h-8 w-px border-l border-verified/30 flex-shrink-0',
  
  // Left accent border - primary/cyan color (used in DAO info card expandable sections)
  leftAccentPrimary: 'border-l-2 border-primary/20',
  
  // Horizontal divider - subtle border (used between sections in DAO info card)
  horizontal: 'border-t border-border/30',
} as const;
