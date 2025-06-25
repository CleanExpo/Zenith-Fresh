import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://zenith.engineer';
  
  const routes = [
    '',
    '/pricing',
    '/features',
    '/about',
    '/contact',
    '/case-studies',
    '/resources',
    '/faq',
    '/auth/signin',
    '/tools/website-analyzer',
    '/dashboard',
    '/teams',
  ];

  return routes.map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: route === '' ? 1 : route.includes('/tools/') || route.includes('/dashboard') ? 0.8 : 0.9,
  }));
}