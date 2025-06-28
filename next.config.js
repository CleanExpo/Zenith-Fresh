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
  // Prevent static optimization issues for API routes
  async rewrites() {
    return [];
  },
}

module.exports = nextConfig;
