import type { NextConfig } from "next";
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    workerThreads: false,
  },
};

export default nextConfig;
