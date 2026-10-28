import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = 'https://luminamath.orizont.md';

  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/register', '/results', '/llms.txt', '/llms-full.txt', '/logos/'],
        disallow: ['/admin', '/api/'],
      },
      {
        userAgent: [
          'Googlebot',
          'Google-Extended',
          'Bingbot',
          'Yandex',
          'OAI-SearchBot',
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'anthropic-ai',
          'Applebot',
          'Applebot-Extended',
        ],
        allow: ['/', '/register', '/results', '/llms.txt', '/llms-full.txt'],
        disallow: ['/admin', '/api/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
