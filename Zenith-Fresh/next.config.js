/** @type {import('next').NextConfig} */
const nextConfig = {
  // Force fresh build - cache bust
  generateBuildId: async () => {
    return 'cache-bust-' + Date.now()
  },
  // Ensure clean build
  cleanDistDir: true,
  // Minimal configuration for basic deployment
  output: 'standalone'
}

module.exports = nextConfig