import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

  // Lets a phone on the same network (e.g. iPhone personal hotspot, which
  // hands out 172.20.10.x) load dev assets when running `dev:plain -H
  // 0.0.0.0`. Dev-only; production is unaffected.
  allowedDevOrigins: ["172.20.10.*"],

  // Turbopack's on-disk dev cache once served a stale Tailwind compile across
  // restarts; slower dev startup is a fair price for never debugging that again.
  experimental: {
    turbopackFileSystemCacheForDev: false,
  },

  // Material Symbols ship as bare .svg files; SVGR turns them into React components.
  turbopack: {
    rules: {
      "*.svg": {
        loaders: ["@svgr/webpack"],
        as: "*.js",
      },
    },
  },
};

export default nextConfig;
