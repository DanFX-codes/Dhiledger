import fs from 'node:fs'
import path from 'node:path'

const root = process.cwd()
const publicDir = path.join(root, 'public')
fs.mkdirSync(publicDir, { recursive: true })
const siteUrl = (process.env.VITE_SITE_URL || '').replace(/\/$/, '')
const indexed = ['/', '/product', '/how-it-works', '/use-cases', '/pricing', '/security', '/about', '/contact', '/request-access', '/faq']
if (siteUrl) {
  const urls = indexed.map((route) => `<url><loc>${siteUrl}${route}</loc></url>`).join('')
  fs.writeFileSync(path.join(publicDir, 'sitemap.xml'), `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>\n`)
  fs.writeFileSync(path.join(publicDir, 'robots.txt'), `User-agent: *\nAllow: /\nSitemap: ${siteUrl}/sitemap.xml\n`)
  console.log(`SEO files written for ${siteUrl}`)
} else {
  for (const file of ['sitemap.xml', 'robots.txt']) {
    const target = path.join(publicDir, file)
    if (fs.existsSync(target)) fs.rmSync(target)
  }
  console.warn('SEO files skipped: VITE_SITE_URL is empty.')
}
