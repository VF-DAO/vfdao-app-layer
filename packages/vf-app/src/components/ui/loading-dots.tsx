import React from 'react';

interface LoadingDotsProps {
  /** Size of each dot. Default: 'sm' (1.5 = 6px) */
  size?: 'xs' | 'sm' | 'md';
  /** Color of dots. Default: 'primary' */
  color?: 'primary' | 'muted' | 'current';
  /** Animation delay between dots in ms. Default: 150 */
  delay?: number;
  /** Additional CSS classes */
  className?: string;
}

/**
 * LoadingDots - Modern pulsing dots loading indicator
 * 
 * A subtle, professional loading indicator using 3 animated dots.
 * Commonly used in modern apps (Slack, Discord) for inline loading states.
 * 
 * @example
 * // Default usage
 * <LoadingDots />
 * 
 * @example
 * // Custom size and color
 * <LoadingDots size="md" color="muted" />
 * 
 * @example
 * // With custom delay
 * <LoadingDots delay={200} />
 */
export function LoadingDots({ 
  size = 'sm', 
  color = 'primary', 
  delay = 150,
  className = ''
}: LoadingDotsProps) {
  const sizeClasses = {
    xs: 'w-1 h-1',
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
  };

  const colorClasses = {
    primary: 'bg-primary',
    muted: 'bg-muted-foreground',
    current: 'bg-current',
  };

  return (
    <div className={`inline-flex items-center gap-1 ${className}`}>
      {[0, 1, 2].map((dot) => (
        <div
          key={dot}
          className={`${sizeClasses[size]} ${colorClasses[color]} rounded-full animate-pulse`}
          style={{ animationDelay: `${dot * delay}ms` }}
          aria-hidden="true"
        />
      ))}
    </div>
  );
}
