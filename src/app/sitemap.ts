import { MetadataRoute } from 'next'
import { db } from '@/lib/db'
import { getProductSlug } from '@/lib/utils'

/**
 * Sitemap Index: splits URLs across multiple sitemaps for faster Google crawling.
 * Google processes smaller sitemaps faster than one massive file.
 * 
 * Structure:
 * - sitemap/0.xml → Static pages + Categories
 * - sitemap/1.xml → Products batch 1 (0-2000)
 * - sitemap/2.xml → Products batch 2 (2000-4000)
 * - ...etc
 * - sitemap/news.xml → News articles
 */

const PRODUCTS_PER_SITEMAP = 2000;
const BASE_URL = 'https://shop.hokiindo.co.id';

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
      select: { sku: true, name: true, updatedAt: true, brand: true, category: true },
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

  // Static Pages
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/pencarian`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/kategori`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/berita`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/pesanan-besar`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/promo/siemens`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
  ];

  // Category URLs
  const categoryUrls: MetadataRoute.Sitemap = visibleCategories.map((cat: any) => ({
    url: `${BASE_URL}/pencarian?category=${encodeURIComponent(cat.name)}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.85, 
  }))

  // Product URLs - use SEO-friendly slug format
  const productUrls: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `${BASE_URL}/produk/${encodeURIComponent(getProductSlug(product))}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8,
  }))

  // News URLs
  const newsUrls: MetadataRoute.Sitemap = publishedNews.map((news: any) => ({
    url: `${BASE_URL}/berita/${news.slug}`,
    lastModified: news.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.6,
  }))

  // CMS Page URLs
  const pageUrls: MetadataRoute.Sitemap = publishedPages.map((page: any) => ({
    url: `${BASE_URL}/${page.slug}`,
    lastModified: page.updatedAt,
    changeFrequency: 'monthly',
    priority: 0.5,
  }))

  return [
    ...staticUrls,
    ...categoryUrls,
    ...productUrls,
    ...newsUrls,
    ...pageUrls,
  ]
}
