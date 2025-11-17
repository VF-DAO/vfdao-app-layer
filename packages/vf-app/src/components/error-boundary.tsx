'use client';

/**
 * Error Boundary Components
 * 
 * React error boundaries to catch and handle runtime errors gracefully.
 * Provides different boundaries for different features to isolate failures.
 */

import React, { Component, type ReactNode } from 'react';
import { AlertCircle, Home, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  featureName?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

/**
 * Base Error Boundary Component
 * 
 * Catches JavaScript errors anywhere in the child component tree,
 * logs those errors, and displays a fallback UI.
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error Boundary caught an error:', error, errorInfo);
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo);

    this.setState({ errorInfo });

    // In production, you might want to log to an error reporting service
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <DefaultErrorFallback
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          onReset={this.handleReset}
          featureName={this.props.featureName}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Default Error Fallback UI
 */
interface DefaultErrorFallbackProps {
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  onReset: () => void;
  featureName?: string;
}

function DefaultErrorFallback({ error, errorInfo, onReset, featureName }: DefaultErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="flex min-h-[400px] w-full items-center justify-center p-6">
      <div className="w-full max-w-md space-y-6 rounded-lg border border-red-200 bg-red-50 p-8 dark:border-red-900 dark:bg-red-950">
        <div className="flex items-center gap-3 text-red-600 dark:text-red-400">
          <AlertCircle className="h-8 w-8 shrink-0" />
          <h2 className="text-xl font-semibold">
            {featureName ? `${featureName} Error` : 'Something went wrong'}
          </h2>
        </div>

        <p className="text-sm text-red-700 dark:text-red-300">
          {error?.message ?? 'An unexpected error occurred. Please try refreshing the page.'}
        </p>

        {isDevelopment && errorInfo && (
          <details className="rounded bg-red-100 p-4 text-xs dark:bg-red-900">
            <summary className="cursor-pointer font-medium text-red-800 dark:text-red-200">
              Error Details (Development Only)
            </summary>
            <pre className="mt-2 overflow-auto text-red-700 dark:text-red-300">
              {error?.stack}
              {'\n\n'}
              {errorInfo.componentStack}
            </pre>
          </details>
        )}

        <div className="flex gap-3">
          <Button
            onClick={onReset}
            variant="outline"
            className="flex-1 gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
          <Button
            onClick={() => window.location.href = '/'}
            className="flex-1 gap-2"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Button>
        </div>
      </div>
    </div>
  );
}

/**
 * Feature-specific Error Boundaries
 * These provide contextual error handling for different app sections
 */

interface FeatureErrorBoundaryProps {
  children: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

/**
 * Swap Feature Error Boundary
 */
export function SwapErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      featureName="Swap"
      onError={onError}
      fallback={
        <div className="flex min-h-[500px] w-full items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-semibold">Swap Unavailable</h3>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              The swap feature encountered an error. Please refresh the page or try again later.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Liquidity Feature Error Boundary
 */
export function LiquidityErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      featureName="Liquidity"
      onError={onError}
      fallback={
        <div className="flex min-h-[500px] w-full items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-semibold">Liquidity Unavailable</h3>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              The liquidity management feature encountered an error. Please refresh the page or try again later.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Portfolio Feature Error Boundary
 */
export function PortfolioErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      featureName="Portfolio"
      onError={onError}
      fallback={
        <div className="flex min-h-[300px] w-full items-center justify-center p-6">
          <div className="w-full max-w-md space-y-4 rounded-lg border border-amber-200 bg-amber-50 p-6 dark:border-amber-900 dark:bg-amber-950">
            <div className="flex items-center gap-3 text-amber-700 dark:text-amber-300">
              <AlertCircle className="h-6 w-6" />
              <h3 className="font-semibold">Portfolio Unavailable</h3>
            </div>
            <p className="text-sm text-amber-600 dark:text-amber-400">
              Unable to load your portfolio. Please refresh the page or try again later.
            </p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="w-full gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Refresh Page
            </Button>
          </div>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

/**
 * Dashboard Error Boundary
 * For the entire dashboard page
 */
export function DashboardErrorBoundary({ children, onError }: FeatureErrorBoundaryProps) {
  return (
    <ErrorBoundary
      featureName="Dashboard"
      onError={onError}
    >
      {children}
    </ErrorBoundary>
  );
}
