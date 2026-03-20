/**
 * Verbose logging for the network switch guard / MetaMask flow.
 *
 * Enable in production builds by setting:
 *   NEXT_PUBLIC_DEBUG_NETWORK=1
 *
 * Development: logs automatically when NODE_ENV=development.
 */

export function isNetworkSwitchDebugEnabled(): boolean {
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_DEBUG_NETWORK === "1"
  );
}

/** Prefix all messages with [NetworkSwitch] for DevTools filter. */
export function nsDebug(...args: unknown[]): void {
  if (!isNetworkSwitchDebugEnabled()) return;
  console.log("[NetworkSwitch]", ...args);
}

export function nsDebugWarn(...args: unknown[]): void {
  if (!isNetworkSwitchDebugEnabled()) return;
  console.warn("[NetworkSwitch]", ...args);
}

export function nsDebugError(...args: unknown[]): void {
  if (!isNetworkSwitchDebugEnabled()) return;
  console.error("[NetworkSwitch]", ...args);
}

/** Safe error dump for wallet / wagmi errors (codes, names, shortMessage). */
export function nsDebugSerializeError(err: unknown): Record<string, unknown> {
  if (err == null) return { value: String(err) };
  if (typeof err !== "object") return { value: err };
  const o = err as Record<string, unknown> & {
    name?: string;
    message?: string;
    shortMessage?: string;
    code?: unknown;
    cause?: unknown;
  };
  const out: Record<string, unknown> = {
    name: o.name,
    message: o.message,
    shortMessage: o.shortMessage,
    code: o.code,
  };
  if ("data" in o) out.data = o.data;
  if (o.cause) {
    out.cause =
      typeof o.cause === "object" && o.cause !== null
        ? nsDebugSerializeError(o.cause)
        : o.cause;
  }
  return out;
}
