#!/usr/bin/env node
import fs from 'fs'
import path from 'path'

// Basic sitemap generator for this SPA — add routes here as needed
const BASE = process.env.SITE_URL || 'https://audio-convert.xyh.wiki'
const routes = ['/', '/about', '/faq', '/how-it-works', '/supported-formats']

const urls = routes.map((r) => ({
  loc: `${BASE.replace(/\/$/, '')}${r}`,
  changefreq: 'monthly',
  priority: r === '/' ? '1.0' : '0.7'
}))

const lines = ['<?xml version="1.0" encoding="UTF-8"?>', '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">']
for (const u of urls) {
  lines.push('  <url>')
  lines.push(`    <loc>${u.loc}</loc>`)
  lines.push(`    <changefreq>${u.changefreq}</changefreq>`)
  lines.push(`    <priority>${u.priority}</priority>`)
  lines.push('  </url>')
}
lines.push('</urlset>')

const outDir = path.resolve(process.cwd(), 'dist')
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
fs.writeFileSync(path.join(outDir, 'sitemap.xml'), lines.join('\n'))
console.log('Sitemap written to', path.join(outDir, 'sitemap.xml'))
