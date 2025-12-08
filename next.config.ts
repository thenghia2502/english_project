import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'macpwgocrmlkwjjhhgzc.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  webpack: (config, { isServer }) => {
    // Handle canvas
    if (!isServer) {
      config.resolve.alias.canvas = false;
    }

    return config;
  },
};

export default nextConfig;
