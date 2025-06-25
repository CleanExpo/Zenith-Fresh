import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/api/',
        '/dashboard/',
        '/teams/',
        '/monitoring/',
        '/security/',
        '/competitive-intelligence/',
        '/ai-orchestration/',
        '/invitations/',
      ],
    },
    sitemap: 'https://zenith.engineer/sitemap.xml',
  };
}