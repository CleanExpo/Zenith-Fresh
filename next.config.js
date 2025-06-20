const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Add alias for @ imports
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
    };
    
    return config;
  },
}

module.exports = nextConfig
