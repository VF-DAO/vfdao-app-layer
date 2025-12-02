'use client';

/**
 * Loading State Components
 * 
 * Reusable loading skeletons and Suspense boundaries for async components.
 * Provides consistent loading UX across the application.
 */

import React, { type ReactNode, Suspense } from 'react';
import { LoadingDots } from './ui/loading-dots';

/**
 * Generic Loading Spinner
 */
interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  className?: string;
}

export function LoadingSpinner({ size = 'md', text, className = '' }: LoadingSpinnerProps) {
  const dotSize = size === 'sm' ? 'xs' : size === 'md' ? 'sm' : 'md';

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      <LoadingDots size={dotSize} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

/**
 * Skeleton Components
 * For content that is loading
 */
export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-muted ${className}`}
      role="status"
      aria-label="Loading..."
    />
  );
}

/**
 * Card Loading Skeleton
 */
export function CardSkeleton() {
  return (
    <div className="w-full rounded-lg border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <Skeleton className="h-6 w-1/3" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <div className="flex gap-2 pt-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 flex-1" />
        </div>
      </div>
    </div>
  );
}

/**
 * Swap Widget Loading Skeleton
 */
export function SwapWidgetSkeleton() {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-modal">
      <div className="space-y-4">
        {/* Header */}
        <Skeleton className="h-7 w-24" />

        {/* From Token Input */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Swap Arrow */}
        <div className="flex justify-center">
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>

        {/* To Token Input */}
        <div className="space-y-2 rounded-lg bg-muted/50 p-4">
          <Skeleton className="h-4 w-16" />
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-10 w-24 rounded-full" />
          </div>
          <Skeleton className="h-3 w-20" />
        </div>

        {/* Swap Details */}
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>

        {/* Swap Button */}
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}

/**
 * Liquidity Card Loading Skeleton
 */
export function LiquidityCardSkeleton() {
  return (
    <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-modal">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-7 w-32" />
          <Skeleton className="h-6 w-6 rounded" />
        </div>

        {/* Pool Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>

        {/* Token Inputs */}
        <div className="space-y-3">
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
          <div className="rounded-lg bg-muted/50 p-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-8 w-32" />
              <Skeleton className="h-10 w-24 rounded-full" />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Skeleton className="h-12 flex-1" />
          <Skeleton className="h-12 flex-1" />
        </div>
      </div>
    </div>
  );
}

/**
 * Portfolio Dashboard Loading Skeleton
 */
export function PortfolioSkeleton() {
  return (
    <div className="space-y-6">
      {/* Balance Summary */}
      <div className="rounded-lg border border-border bg-card p-6">
        <Skeleton className="mb-4 h-6 w-40" />
        <Skeleton className="h-12 w-48" />
      </div>

      {/* Token List */}
      <div className="space-y-3">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-4 rounded-lg border border-border bg-card p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="text-right space-y-2">
              <Skeleton className="h-5 w-20" />
              <Skeleton className="h-4 w-16" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Table Loading Skeleton
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full space-y-3">
      {/* Header */}
      <div className="flex gap-4 border-b border-border pb-3">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-4 flex-1" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-10 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Page Loading Skeleton
 */
export function PageSkeleton() {
  return (
    <div className="container mx-auto space-y-6 p-6">
      <Skeleton className="h-10 w-64" />
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <CardSkeleton />
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Suspense Boundary Components
 * Wrap async components with these for automatic loading states
 */

interface SuspenseBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Generic Suspense Boundary with default loading spinner
 */
export function SuspenseBoundary({ children, fallback }: SuspenseBoundaryProps) {
  return (
    <Suspense fallback={fallback ?? <LoadingSpinner size="lg" text="Loading..." />}>
      {children}
    </Suspense>
  );
}

/**
 * Swap Widget Suspense Boundary
 */
export function SwapSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SwapWidgetSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * Liquidity Card Suspense Boundary
 */
export function LiquiditySuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LiquidityCardSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * Portfolio Suspense Boundary
 */
export function PortfolioSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PortfolioSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * Page Suspense Boundary
 */
export function PageSuspenseBoundary({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<PageSkeleton />}>
      {children}
    </Suspense>
  );
}

/**
 * Inline Loading State
 * For small inline loading indicators
 */
export function InlineLoading({ text }: { text?: string }) {
  return (
    <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
      <LoadingDots size="xs" />
      {text && <span>{text}</span>}
    </span>
  );
}

/**
 * Full Page Loading
 * For entire page loading states
 */
export function FullPageLoading({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <LoadingSpinner size="lg" text={text} />
    </div>
  );
}
