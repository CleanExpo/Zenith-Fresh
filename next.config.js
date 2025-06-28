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
  // Vercel specific configuration to fix routes-manifest issue
  generateBuildId: async () => {
    return 'zenith-build-' + Date.now();
  },
}

module.exports = nextConfig;
