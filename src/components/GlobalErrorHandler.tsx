'use client';

import { useEffect } from 'react';
import { reportError } from '@/lib/errorReporter';

/**
 * Installs global handlers for uncaught errors and unhandled promise
 * rejections. Mount once near the app root (e.g. in layout.tsx).
 *
 * In development errors are logged to the console. In production the
 * {@link reportError} function can forward them to an error-tracking
 * service so failures are visible even when users don't open devtools.
 */
export function GlobalErrorHandler() {
  useEffect(() => {
    function onError(event: ErrorEvent) {
      reportError(event.error ?? event.message, 'window.onerror');
    }

    function onUnhandledRejection(event: PromiseRejectionEvent) {
      // Prevent browser/Next dev from also logging the raw rejection payload.
      event.preventDefault();
      reportError(event.reason, 'unhandledrejection');
    }

    window.addEventListener('error', onError);
    window.addEventListener('unhandledrejection', onUnhandledRejection);

    return () => {
      window.removeEventListener('error', onError);
      window.removeEventListener('unhandledrejection', onUnhandledRejection);
    };
  }, []);

  return null;
}
