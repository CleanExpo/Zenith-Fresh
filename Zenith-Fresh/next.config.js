/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'lighthouse', 'ioredis'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('lighthouse', 'ioredis');
    }
    
    // Fix for "self is not defined" error
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
      net: false,
      tls: false,
      crypto: false,
      stream: false,
      url: false,
      zlib: false,
      http: false,
      https: false,
      assert: false,
      os: false,
      path: false,
    };
    
    return config;
  },
  compress: true,
  poweredByHeader: false,
}

module.exports = nextConfig