import type { MetadataRoute } from 'next'
import { appUrl } from '@/lib/app-url'

// Public pages only. Auth, dashboard, admin and /sign pages are private.
const publicPaths = ['/about', '/terms', '/privacy', '/cookies']

export default function sitemap(): MetadataRoute.Sitemap {
  return publicPaths.map((path) => ({
    url: `${appUrl}${path}`,
    changeFrequency: path === '/about' ? 'monthly' : 'yearly',
    priority: path === '/about' ? 0.8 : 0.3,
  }))
}
