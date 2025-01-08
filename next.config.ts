import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
      unoptimized: true,
  },
  distDir: 'out', // Where to export all pages
  trailingSlash: true,
  assetPrefix: '/',
  // time in seconds of no pages generating during static
  reactStrictMode: false
};

export default nextConfig;