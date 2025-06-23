/** @type {import('next').NextConfig} */
const nextConfig = {
  // Security: Enable linting and type checking in builds
  eslint: {
    ignoreDuringBuilds: false,
  },
  typescript: {
    ignoreBuildErrors: false,
  },
  output: 'standalone',
  // Performance optimizations
  experimental: {
    optimizeCss: true,
    scrollRestoration: true,
  },
  // Disable source maps in production for security
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig;
