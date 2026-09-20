import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    'https://tutor-platform-khaki.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/student/', '/teacher/', '/api/'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}