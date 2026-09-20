import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  transpilePackages: ['tldraw'],
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'i.imgur.com' },
    ],
  },
};

export default nextConfig;