const LANDING_HOSTS = new Set(["cosmicsignature.com", "www.cosmicsignature.com"]);

export function normalizeHost(host: string | null | undefined): string {
  if (!host) {
    return "";
  }

  return host.split(":")[0].trim().toLowerCase();
}

export function isLandingHost(host: string | null | undefined): boolean {
  const normalized = normalizeHost(host);
  return LANDING_HOSTS.has(normalized);
}
