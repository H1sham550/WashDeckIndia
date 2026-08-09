import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typedRoutes: true,
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "jose"],
  },
  async headers() {
    return [
      {
        source: "/:all*(svg|jpg|jpeg|png|webp|avif|woff2|woff)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
      {
        source: "/_next/static/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=31536000, immutable",
          },
        ],
      },
    ];
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
