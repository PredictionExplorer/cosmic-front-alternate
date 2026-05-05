/**
 * Git / deploy metadata baked in at `next build` (see `next.config.ts` `env`).
 * On Vercel, `VERCEL_GIT_COMMIT_SHA` / `VERCEL_GIT_COMMIT_REF` are set automatically.
 */

export type ClientBuildInfo = {
  shortSha: string;
  fullSha: string;
  ref: string;
};

export function getClientBuildInfo(): ClientBuildInfo | null {
  const fullSha = process.env.NEXT_PUBLIC_BUILD_COMMIT?.trim() ?? "";
  if (!fullSha) return null;
  const ref = process.env.NEXT_PUBLIC_BUILD_REF?.trim() ?? "";
  return {
    shortSha: fullSha.length >= 7 ? fullSha.slice(0, 7) : fullSha,
    fullSha,
    ref,
  };
}

/** True when this bundle is a Vercel Production deployment (hide dev-only UI). */
export function isVercelProductionDeploy(): boolean {
  return process.env.NEXT_PUBLIC_VERCEL_ENV === "production";
}
