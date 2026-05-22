import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        // Izinkan semua bot crawl halaman publik
        userAgent: '*',
        allow: '/',
        disallow: [
          '/admin/',
          '/api/',
          '/dashboard/',
          '/vendor/',
          '/keranjang',
          '/keranjang/',
          '/checkout',
          '/checkout/',
          '/checkout-2',
          '/checkout-2/',
          '/masuk',
          '/daftar',
          '/lupa-password',
          '/reset-password',
          '/verifikasi',
          '/shop-2',
          '/shop-2/',
          // Block URL dengan query params yang tidak perlu diindex
          '/*?add_to_cart=*',
          '/*?add-to-cart=*',
          '/*?add_to_compare=*',
          '/*?add-to-compare=*',
          '/*?filter_cat=*',
          '/*?ref=*',
          '/*?utm_*',
        ],
      },
    ],
    sitemap: 'https://shop.hokiindo.co.id/sitemap.xml',
  }
}

