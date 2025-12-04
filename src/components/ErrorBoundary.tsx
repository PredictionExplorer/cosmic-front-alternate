'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * Error Boundary Component
 * 
 * Catches React errors and displays a user-friendly fallback UI
 * Prevents the entire app from crashing when an error occurs
 * 
 * Usage:
 * Wrap sections of your app that might throw errors
 * 
 * @example
 * ```tsx
 * <ErrorBoundary>
 *   <YourComponent />
 * </ErrorBoundary>
 * ```
 */
export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    // Update state so next render shows fallback UI
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // Log error details to console (in production, send to error tracking service)
    console.error('Error caught by ErrorBoundary:', error);
    console.error('Error info:', errorInfo);
    
    // TODO: Send to error tracking service (Sentry, DataDog, etc.)
    // Example:
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card glass className="max-w-lg w-full p-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="h-16 w-16 rounded-full bg-status-error/10 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-status-error" />
              </div>
            </div>
            
            <h1 className="heading-lg mb-4">
              Something went wrong
            </h1>
            
            <p className="body-md text-text-secondary mb-6">
              We encountered an unexpected error. This has been logged and we&apos;ll look into it.
              Please try refreshing the page or going back to the home page.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-background-elevated rounded-lg text-left">
                <p className="text-xs font-mono text-status-error mb-2">
                  Error Details (Development Only):
                </p>
                <pre className="text-xs text-text-secondary overflow-auto">
                  {this.state.error.toString()}
                </pre>
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                variant="primary"
                onClick={() => window.location.href = '/'}
              >
                Go to Home
              </Button>
              <Button
                variant="secondary"
                onClick={() => window.location.reload()}
              >
                Refresh Page
              </Button>
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

