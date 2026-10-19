// Public base URL of the site. Used for metadata, sitemap and robots.
export const appUrl = process.env.NEXT_PUBLIC_APP_URL
  ? process.env.NEXT_PUBLIC_APP_URL.startsWith('http')
    ? process.env.NEXT_PUBLIC_APP_URL
    : `https://${process.env.NEXT_PUBLIC_APP_URL}`
  : 'https://www.vartracker.com'
