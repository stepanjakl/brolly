import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  devIndicators: false,

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
