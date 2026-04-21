import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin/',
        '/api/',
        '/dashboard/',
        '/vendor/',
        '/keranjang',
        '/masuk',
        '/daftar',
        '/lupa-password',
        '/reset-password',
        '/verifikasi',
      ],
    },
    sitemap: 'https://shop.hokiindo.co.id/sitemap.xml',
  }
}
