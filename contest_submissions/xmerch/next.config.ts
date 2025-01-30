import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable React Strict Mode
  reactStrictMode: true,

  // Experimental features
  experimental: {
    ppr: "incremental", // Preserve Partial Rendering
  },

  // Add custom headers for static assets
  async headers() {
    return [
      {
        source: "/favicon.ico",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=604800, immutable", // Cache for 7 days
          },
        ],
      },
      {
        source: "/(.*)",
        headers: [
          {
            key: "X-Content-Type-Options",
            value: "nosniff", // Prevent MIME-type sniffing
          },
        ],
      },
    ];
  },

  // API Compression
  compress: true,

  // Environment Variables
  env: {
    NEXT_PUBLIC_XUMM_API_KEY: process.env.NEXT_PUBLIC_XUMM_API_KEY,
    NEXT_PUBLIC_XRP_PRICE_API: process.env.NEXT_PUBLIC_XRP_PRICE_API,
  },

  // Optimize build for standalone deployment
  output: "standalone",
};

const withVercelToolbar = require("@vercel/toolbar/plugins/next")();

module.exports = withVercelToolbar(nextConfig);
