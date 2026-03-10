/**
 * Centralized error reporter.
 *
 * All error-handling paths (ErrorBoundary, global handlers, catch blocks)
 * should call {@link reportError} so there is one place to wire up a
 * production error-tracking service (Sentry, Datadog, etc.).
 */

export function reportError(error: unknown, context?: string): void {
  const prefix = context ? `[Error: ${context}]` : "[Error]";
  console.error(prefix, error);

  // Future: send to Sentry / Datadog / etc.
  // if (typeof window !== "undefined" && window.Sentry) {
  //   window.Sentry.captureException(error, { extra: { context } });
  // }
}
