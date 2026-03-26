/**
 * Detect JSON-RPC error payloads (HTTP may still be 200).
 * Used by /api/rpc and the browser transport dev logger.
 */
export function extractJsonRpcErrors(data: unknown): unknown[] {
  if (data === null || data === undefined) return [];
  const out: unknown[] = [];
  if (Array.isArray(data)) {
    for (const item of data) {
      if (
        item &&
        typeof item === "object" &&
        "error" in item &&
        (item as { error: unknown }).error != null
      ) {
        out.push((item as { error: unknown }).error);
      }
    }
    return out;
  }
  if (
    typeof data === "object" &&
    "error" in data &&
    (data as { error: unknown }).error != null
  ) {
    out.push((data as { error: unknown }).error);
  }
  return out;
}
