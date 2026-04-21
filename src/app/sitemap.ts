import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getProductSlug } from '@/lib/utils'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Ambil Kategori yang di hide
  const hiddenCategories = await db.category.findMany({
    where: { isVisible: false },
    select: { name: true }
  })
  const hiddenCategoryNames = hiddenCategories.map(c => c.name)

  // Fetch all data in parallel for speed
  const [visibleCategories, products, publishedNews, publishedPages] = await Promise.all([
    db.category.findMany({
      where: { isVisible: true },
      select: { name: true, updatedAt: true }
    }),
    db.product.findMany({
      where: { 
        isVisible: true,
        ...(hiddenCategoryNames.length > 0 ? { category: { notIn: hiddenCategoryNames } } : {})
      },
      select: { sku: true, updatedAt: true },
    }),
    db.news.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
    db.page.findMany({
      where: { isPublished: true },
      select: { slug: true, updatedAt: true },
    }),
  ]);

  // Product URLs
  const productUrls: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `https://shop.hokiindo.co.id/produk/${encodeURIComponent(getProductSlug(product))}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // Category URLs
  const categoryUrls: MetadataRoute.Sitemap = visibleCategories.map((cat: any) => ({
    url: `https://shop.hokiindo.co.id/pencarian?category=${encodeURIComponent(cat.name)}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.85, 
  }))

  // News URLs
  const newsUrls: MetadataRoute.Sitemap = publishedNews.map((news: any) => ({
    url: `https://shop.hokiindo.co.id/berita/${news.slug}`,
    lastModified: news.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // CMS Page URLs
  const pageUrls: MetadataRoute.Sitemap = publishedPages.map((page: any) => ({
    url: `https://shop.hokiindo.co.id/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [
    {
      url: 'https://shop.hokiindo.co.id',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: 'https://shop.hokiindo.co.id/pencarian',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: 'https://shop.hokiindo.co.id/kategori',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
        url: 'https://shop.hokiindo.co.id/berita',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
    },
    {
        url: 'https://shop.hokiindo.co.id/pesanan-besar',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    },
    ...categoryUrls,
    ...productUrls,
    ...newsUrls,
    ...pageUrls,
  ]
}

