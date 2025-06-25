import { NextConfig } from 'next';

interface CDNConfig {
  provider: 'vercel' | 'cloudflare' | 'cloudfront' | 'custom';
  domain: string;
  regions: string[];
  features: {
    imageOptimization: boolean;
    staticAssetCaching: boolean;
    edgeFunctions: boolean;
    geoRouting: boolean;
  };
  caching: {
    staticAssets: number;
    images: number;
    api: number;
    html: number;
  };
}

/**
 * Enhanced Next.js configuration with CDN optimization
 */
export function createCDNOptimizedNextConfig(cdnConfig: CDNConfig): NextConfig {
  const config: NextConfig = {
    // Asset optimization
    assetPrefix: process.env.NODE_ENV === 'production' ? cdnConfig.domain : '',
    
    // Image optimization
    images: {
      domains: [
        'localhost',
        'zenith.engineer',
        cdnConfig.domain.replace('https://', ''),
        'images.unsplash.com',
        'cdn.zenith.engineer',
      ],
      formats: ['image/webp', 'image/avif'],
      deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
      imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
      minimumCacheTTL: cdnConfig.caching.images,
      dangerouslyAllowSVG: true,
      contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
      ...(cdnConfig.provider === 'vercel' && {
        loader: 'default',
      }),
      ...(cdnConfig.provider === 'cloudflare' && {
        loader: 'custom',
        loaderFile: './lib/cdn/cloudflare-image-loader.js',
      }),
      ...(cdnConfig.provider === 'cloudfront' && {
        loader: 'custom',
        loaderFile: './lib/cdn/cloudfront-image-loader.js',
      }),
    },

    // Compression and optimization
    compress: true,
    poweredByHeader: false,
    
    // Experimental features for performance
    experimental: {
      optimizeCss: true,
      optimizePackageImports: ['@heroicons/react', 'lucide-react', 'recharts'],
      // turbo: {
      //   rules: {
      //     '*.{js,jsx,ts,tsx}': {
      //       loaders: ['swc-loader'],
      //       as: '*.js',
      //     },
      //   },
      // },
    },

    // Webpack configuration for optimization
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Production optimizations
      if (!dev) {
        // Asset optimization
        config.optimization = {
          ...config.optimization,
          splitChunks: {
            chunks: 'all',
            cacheGroups: {
              vendor: {
                test: /[\\/]node_modules[\\/]/,
                name: 'vendors',
                priority: 10,
                chunks: 'all',
              },
              common: {
                name: 'common',
                minChunks: 2,
                priority: 5,
                chunks: 'all',
                reuseExistingChunk: true,
              },
            },
          },
        };

        // Bundle analyzer (optional)
        if (process.env.ANALYZE === 'true') {
          const { BundleAnalyzerPlugin } = require('webpack-bundle-analyzer');
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
              reportFilename: isServer ? '../analyze/server.html' : './analyze/client.html',
            })
          );
        }

        // Compression plugins
        config.plugins.push(
          new webpack.optimize.LimitChunkCountPlugin({
            maxChunks: 50,
          })
        );
      }

      // Asset loading rules
      config.module.rules.push({
        test: /\.(png|jpe?g|gif|svg|webp|avif)$/i,
        use: [
          {
            loader: 'next-image-loader',
            options: {
              isServer,
              isDev: dev,
              basePath: config.basePath || '',
              assetPrefix: config.assetPrefix || '',
            },
          },
        ],
      });

      return config;
    },

    // Headers for CDN optimization
    async headers() {
      return [
        // Static assets
        {
          source: '/_next/static/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: `public, max-age=${cdnConfig.caching.staticAssets}, immutable`,
            },
            {
              key: 'Vary',
              value: 'Accept-Encoding',
            },
          ],
        },
        // Images
        {
          source: '/_next/image/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: `public, max-age=${cdnConfig.caching.images}`,
            },
            {
              key: 'Vary',
              value: 'Accept, Accept-Encoding',
            },
          ],
        },
        // API routes
        {
          source: '/api/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: `public, max-age=${cdnConfig.caching.api}, s-maxage=${cdnConfig.caching.api}`,
            },
            {
              key: 'Vary',
              value: 'Accept-Encoding, Authorization',
            },
          ],
        },
        // HTML pages
        {
          source: '/:path*',
          headers: [
            {
              key: 'Cache-Control',
              value: `public, max-age=${cdnConfig.caching.html}, s-maxage=${cdnConfig.caching.html}`,
            },
            {
              key: 'Vary',
              value: 'Accept-Encoding, Cookie',
            },
            // Security headers
            {
              key: 'X-DNS-Prefetch-Control',
              value: 'on',
            },
            {
              key: 'X-XSS-Protection',
              value: '1; mode=block',
            },
            {
              key: 'X-Frame-Options',
              value: 'SAMEORIGIN',
            },
            {
              key: 'X-Content-Type-Options',
              value: 'nosniff',
            },
            {
              key: 'Referrer-Policy',
              value: 'origin-when-cross-origin',
            },
          ],
        },
      ];
    },

    // Redirects for SEO optimization
    async redirects() {
      return [
        // Add any necessary redirects here
      ];
    },

    // Rewrites for CDN integration
    async rewrites() {
      const rewrites = [];

      // CDN asset rewrites
      if (cdnConfig.provider === 'custom') {
        rewrites.push({
          source: '/assets/:path*',
          destination: `${cdnConfig.domain}/assets/:path*`,
        });
      }

      return rewrites;
    },
  };

  return config;
}

/**
 * Default CDN configurations for different providers
 */
export const CDN_CONFIGS: Record<string, CDNConfig> = {
  vercel: {
    provider: 'vercel',
    domain: process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'https://zenith.engineer',
    regions: ['global'],
    features: {
      imageOptimization: true,
      staticAssetCaching: true,
      edgeFunctions: true,
      geoRouting: true,
    },
    caching: {
      staticAssets: 31536000, // 1 year
      images: 86400, // 1 day
      api: 60, // 1 minute
      html: 3600, // 1 hour
    },
  },
  cloudflare: {
    provider: 'cloudflare',
    domain: process.env.CLOUDFLARE_CDN_URL || 'https://cdn.zenith.engineer',
    regions: ['global'],
    features: {
      imageOptimization: true,
      staticAssetCaching: true,
      edgeFunctions: true,
      geoRouting: true,
    },
    caching: {
      staticAssets: 31536000, // 1 year
      images: 604800, // 1 week
      api: 300, // 5 minutes
      html: 7200, // 2 hours
    },
  },
  cloudfront: {
    provider: 'cloudfront',
    domain: process.env.CLOUDFRONT_DOMAIN || 'https://cdn.zenith.engineer',
    regions: ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'],
    features: {
      imageOptimization: true,
      staticAssetCaching: true,
      edgeFunctions: true,
      geoRouting: true,
    },
    caching: {
      staticAssets: 31536000, // 1 year
      images: 2592000, // 30 days
      api: 300, // 5 minutes
      html: 3600, // 1 hour
    },
  },
};

/**
 * Get CDN configuration based on environment
 */
export function getCDNConfig(): CDNConfig {
  const provider = (process.env.CDN_PROVIDER as keyof typeof CDN_CONFIGS) || 'vercel';
  const config = CDN_CONFIGS[provider];
  
  if (!config) {
    throw new Error(`Unknown CDN provider: ${provider}`);
  }

  return {
    ...config,
    domain: process.env.CDN_DOMAIN || config.domain,
  };
}

/**
 * Image loader for Cloudflare Images
 */
export function cloudflareImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const params = [`width=${width}`];
  
  if (quality) {
    params.push(`quality=${quality}`);
  }

  const paramsString = params.join(',');
  const cdnUrl = process.env.CLOUDFLARE_CDN_URL || 'https://imagedelivery.net/your-account-hash';
  
  return `${cdnUrl}/${src}/${paramsString}`;
}

/**
 * Image loader for CloudFront
 */
export function cloudfrontImageLoader({ src, width, quality }: { src: string; width: number; quality?: number }) {
  const params = new URLSearchParams();
  params.set('width', width.toString());
  
  if (quality) {
    params.set('quality', quality.toString());
  }

  const cdnUrl = process.env.CLOUDFRONT_DOMAIN || 'https://cdn.zenith.engineer';
  
  return `${cdnUrl}/${src}?${params.toString()}`;
}

/**
 * Custom image optimization middleware
 */
export function createImageOptimizationHeaders() {
  return {
    'Cache-Control': 'public, max-age=2592000, immutable', // 30 days
    'Vary': 'Accept',
    'X-Content-Type-Options': 'nosniff',
  };
}

/**
 * Preload critical resources
 */
export function generatePreloadHeaders(criticalAssets: string[]): string[] {
  return criticalAssets.map(asset => {
    const extension = asset.split('.').pop()?.toLowerCase();
    let asType = 'fetch';
    
    switch (extension) {
      case 'css':
        asType = 'style';
        break;
      case 'js':
        asType = 'script';
        break;
      case 'woff':
      case 'woff2':
        asType = 'font';
        break;
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'webp':
      case 'avif':
        asType = 'image';
        break;
    }
    
    return `<${asset}>; rel=preload; as=${asType}${asType === 'font' ? '; crossorigin' : ''}`;
  });
}

/**
 * Service Worker for CDN caching strategy
 */
export const SERVICE_WORKER_CACHE_STRATEGY = `
// CDN Cache Strategy for Zenith Platform
const CACHE_NAME = 'zenith-cdn-v1';
const CDN_CACHE_NAME = 'zenith-cdn-assets-v1';

const CDN_ASSETS = [
  '/_next/static/',
  '/images/',
  '/fonts/',
  '/icons/',
];

const CACHE_STRATEGIES = {
  // Cache first for static assets
  cacheFirst: ['/_next/static/', '/fonts/', '/icons/'],
  
  // Network first for API calls
  networkFirst: ['/api/'],
  
  // Stale while revalidate for images
  staleWhileRevalidate: ['/images/', '/_next/image/'],
};

self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Determine cache strategy
  let strategy = 'networkFirst'; // default
  
  for (const [strategyName, patterns] of Object.entries(CACHE_STRATEGIES)) {
    if (patterns.some(pattern => url.pathname.startsWith(pattern))) {
      strategy = strategyName;
      break;
    }
  }
  
  switch (strategy) {
    case 'cacheFirst':
      event.respondWith(cacheFirst(request));
      break;
    case 'staleWhileRevalidate':
      event.respondWith(staleWhileRevalidate(request));
      break;
    default:
      event.respondWith(networkFirst(request));
  }
});

async function cacheFirst(request) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }
  
  const networkResponse = await fetch(request);
  const cache = await caches.open(CDN_CACHE_NAME);
  cache.put(request, networkResponse.clone());
  
  return networkResponse;
}

async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request);
    const cache = await caches.open(CACHE_NAME);
    cache.put(request, networkResponse.clone());
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    return cachedResponse || new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request).then(networkResponse => {
    const cache = caches.open(CDN_CACHE_NAME);
    cache.then(c => c.put(request, networkResponse.clone()));
    return networkResponse;
  });
  
  return cachedResponse || fetchPromise;
}
`;

export default getCDNConfig;