import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = 'https://luminamath.orizont.md';
  const now = new Date();

  return [
    {
      url: baseUrl,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
      alternates: {
        languages: {
          ro: baseUrl,
          ru: baseUrl,
          en: baseUrl,
        },
      },
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.95,
      alternates: {
        languages: {
          ro: `${baseUrl}/register`,
          ru: `${baseUrl}/register`,
          en: `${baseUrl}/register`,
        },
      },
    },
    {
      url: `${baseUrl}/results`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 0.9,
      alternates: {
        languages: {
          ro: `${baseUrl}/results`,
          ru: `${baseUrl}/results`,
          en: `${baseUrl}/results`,
        },
      },
    },
    {
      url: `${baseUrl}/llms.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/llms-full.txt`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
  ];
}
