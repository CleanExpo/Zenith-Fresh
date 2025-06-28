/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    domains: ['images.unsplash.com', 'lh3.googleusercontent.com'],
  },
  experimental: {
    serverComponentsExternalPackages: ['prisma', '@prisma/client'],
  },
  // Remove standalone output for Vercel compatibility
  // output: 'standalone',
  // Disable static optimization for problematic routes
  async rewrites() {
    return [];
  },
  // Custom webpack configuration to ensure proper build output
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    return config;
  },
}

module.exports = nextConfig;
