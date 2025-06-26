/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force fresh build - cache bust
  generateBuildId: async () => {
    return 'cache-bust-' + Date.now()
  },
  // Ensure clean build
  cleanDistDir: true,
  // Minimal configuration for basic deployment
  output: 'standalone',
  // Disable ESLint during build to focus on compilation errors
  eslint: {
    ignoreDuringBuilds: true,
  },
  // Enable compression for better performance
  compress: true,
  // Optimize production builds
  swcMinify: true,
  // Experimental features for better performance
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },
  // Power by header removal for security
  poweredByHeader: false,
  // Security headers for production
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains; preload',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
      {
        source: '/api/(.*)',
        headers: [
          {
            key: 'Access-Control-Allow-Origin',
            value: process.env.NODE_ENV === 'production' 
              ? 'https://zenith.engineer' 
              : 'http://localhost:3000',
          },
          {
            key: 'Access-Control-Allow-Methods',
            value: 'GET, POST, PUT, DELETE, OPTIONS',
          },
          {
            key: 'Access-Control-Allow-Headers',
            value: 'Content-Type, Authorization, X-Requested-With',
          },
        ],
      },
    ];
  },
  // Environment variable validation
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
  },
  // Image optimization security
  images: {
    domains: [
      'localhost',
      'zenith.engineer',
      'lh3.googleusercontent.com', // Google profile images
    ],
    dangerouslyAllowSVG: false,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = nextConfig