import type { NextConfig } from "next";
import path from "path";
import { execSync } from "child_process";
import { withSentryConfig } from "@sentry/nextjs";

function resolveGitSha(): string {
  if (process.env.VERCEL_GIT_COMMIT_SHA?.trim()) return process.env.VERCEL_GIT_COMMIT_SHA.trim();
  if (process.env.GITHUB_SHA?.trim()) return process.env.GITHUB_SHA.trim();
  try {
    return execSync("git rev-parse HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

function resolveGitRef(): string {
  if (process.env.VERCEL_GIT_COMMIT_REF?.trim()) return process.env.VERCEL_GIT_COMMIT_REF.trim();
  if (process.env.GITHUB_REF_NAME?.trim()) return process.env.GITHUB_REF_NAME.trim();
  try {
    return execSync("git rev-parse --abbrev-ref HEAD", {
      encoding: "utf8",
      stdio: ["ignore", "pipe", "ignore"],
    }).trim();
  } catch {
    return "";
  }
}

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_COMMIT: resolveGitSha(),
    NEXT_PUBLIC_BUILD_REF: resolveGitRef(),
    NEXT_PUBLIC_VERCEL_ENV: process.env.VERCEL_ENV || "",
  },
  // Parent dirs may contain another package-lock.json; pin Turbopack to this app.
  turbopack: {
    root: path.resolve(process.cwd()),
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nfts.cosmicsignature.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nfts-sepolia.cosmicsignature.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "nfts-local.cosmicsignature.com",
        pathname: "/**",
      },
    ],
  },
};

export default withSentryConfig(nextConfig, {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
});
