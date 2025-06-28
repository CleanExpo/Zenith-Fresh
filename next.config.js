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
  // Ensure proper build output generation
  generateBuildId: async () => {
    // Use a consistent build ID to avoid manifest issues
    return process.env.VERCEL_GIT_COMMIT_SHA || 'local-build';
  },
  // Explicitly configure for Vercel deployment
  trailingSlash: false,
  // Disable static optimization for problematic routes
  async rewrites() {
    return [];
  },
  // Custom webpack configuration to ensure proper build output
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('@prisma/client');
    }
    // Ensure proper module resolution
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
    };
    return config;
  },
}

module.exports = nextConfig;
