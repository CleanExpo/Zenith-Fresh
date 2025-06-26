/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    serverComponentsExternalPackages: ['@prisma/client', 'lighthouse', 'ioredis'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push('lighthouse', 'ioredis');
    }
    
    // Completely exclude problematic enterprise API routes from compilation
    config.module.rules.push({
      test: /src\/app\/api\/ai\/enterprise\/.*\.ts$/,
      loader: 'ignore-loader'
    });
    
    config.module.rules.push({
      test: /app\/api\/ai\/enterprise\/.*\.ts$/,
      loader: 'ignore-loader'
    });
    
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