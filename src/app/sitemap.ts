import { MetadataRoute } from 'next';

/**
 * Sitemap Generator
 * 
 * Automatically generates a sitemap.xml for SEO optimization
 * Update the baseUrl with your actual domain before deploying
 * 
 * This will be available at: https://yourdomain.com/sitemap.xml
 */
export default function sitemap(): MetadataRoute.Sitemap {
  // Use environment variable for production domain
  // Set NEXT_PUBLIC_SITE_URL in your .env.local or hosting platform
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://cosmicsignature.com';
  
  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/gallery`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/game/play`,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1,
    },
    {
      url: `${baseUrl}/game/how-it-works`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/game/prizes`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/game/leaderboard`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/game/statistics`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/game/history/rounds`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/stake`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/contracts`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];

  // TODO: Add dynamic routes (NFTs, users, rounds)
  // Example:
  // const nfts = await fetchAllNFTs();
  // const nftRoutes = nfts.map(nft => ({
  //   url: `${baseUrl}/gallery/${nft.id}`,
  //   lastModified: new Date(nft.updatedAt),
  //   changeFrequency: 'weekly' as const,
  //   priority: 0.7,
  // }));

  return staticRoutes;
}

