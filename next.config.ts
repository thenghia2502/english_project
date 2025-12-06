import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  webpack: (config, { isServer }) => {
    // Handle canvas
    if (!isServer) {
      config.resolve.alias.canvas = false;
    }

    return config;
  },
};

export default nextConfig;
