/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'lighthouse'],
  },
  // Prevent static generation during build to avoid database connection errors
  output: 'standalone',
  // Skip build-time database calls
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('lighthouse');
    }
    return config;
  },
}

module.exports = nextConfig