import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "nfts.cosmicsignature.com",
        pathname: "/**",
      },
    ],
  },
};

export default nextConfig;
