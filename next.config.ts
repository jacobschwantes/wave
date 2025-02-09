import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
       protocol: 'https',
       hostname: 'i.scdn.co',
       port: '',
       pathname: '/**',
      },
    ],
  },
};

export default nextConfig;
