import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "jose"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
