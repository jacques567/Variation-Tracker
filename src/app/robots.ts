import type { MetadataRoute } from 'next'
import { appUrl } from '@/lib/app-url'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/login', '/register', '/forgot-password', '/jobs', '/admin', '/sign', '/api'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
