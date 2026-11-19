import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "3mb",
    },
  },
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
};

export default nextConfig;
