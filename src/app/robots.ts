import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin/', '/api/admin/'], // Jangan indeks kontrol panel dan API rahasi
    },
    sitemap: 'https://shop.hokiindo.co.id/sitemap.xml',
  }
}
