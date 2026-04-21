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

  // Ambil semua Kategori yang visible untuk sitemap
  const visibleCategories = await db.category.findMany({
    where: { isVisible: true },
    select: { name: true, updatedAt: true }
  })

  // Ambil semua produk yang aktif untuk di-index dan kategorinya bukan kategori hidden
  const products = await db.product.findMany({
    where: { 
        isVisible: true,
        ...(hiddenCategoryNames.length > 0 ? { category: { notIn: hiddenCategoryNames } } : {})
    },
    select: { sku: true, updatedAt: true },
  })

  // Format array URL sitemap khusus produk
  const productUrls: MetadataRoute.Sitemap = products.map((product: any) => ({
    url: `https://shop.hokiindo.co.id/produk/${encodeURIComponent(getProductSlug(product))}`,
    lastModified: product.updatedAt,
    changeFrequency: 'daily',
    priority: 0.8, // Prioritas tinggi untuk produk e-commerce
  }))

  // Format array URL sitemap untuk Kategori
  const categoryUrls: MetadataRoute.Sitemap = visibleCategories.map((cat: any) => ({
    url: `https://shop.hokiindo.co.id/pencarian?category=${encodeURIComponent(cat.name)}`,
    lastModified: cat.updatedAt,
    changeFrequency: 'weekly',
    priority: 0.85, 
  }))

  return [
    {
      url: 'https://shop.hokiindo.co.id',
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 1.0, // Beranda prioritas mutlak
    },
    {
      url: 'https://shop.hokiindo.co.id/pencarian',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9, // Halaman katalog
    },
    {
        url: 'https://shop.hokiindo.co.id/pesanan-besar',
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.7,
    },
    {
        url: 'https://shop.hokiindo.co.id/berita',
        lastModified: new Date(),
        changeFrequency: 'daily',
        priority: 0.7,
    },
    ...categoryUrls,
    ...productUrls,
  ]
}
