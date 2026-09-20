/** Serves apps/docs/build the way GitHub Pages actually does: plain static
 * files under the site's baseUrl, no clean-url redirects. `docusaurus serve`
 * runs everything through `serve-handler`'s cleanUrls mode, which strips
 * .html extensions AND query strings on redirect — fatal for the embedded
 * Storybook build's iframe.html?id=... deep links. This is dependency-free
 * on purpose: it only needs to reproduce "serve a static file tree", not a
 * general-purpose dev server. */

import { readFile, stat } from 'node:fs/promises'
import { createServer } from 'node:http'
import path from 'node:path'
import { gzipSync } from 'node:zlib'

const ROOT = path.resolve(import.meta.dirname, '../build')
const BASE = '/insane-forms/'
const PORT = Number(process.env.PORT ?? 4173)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.xml': 'application/xml',
  '.ico': 'image/x-icon',
}

// Compressible text types only — woff2/png etc. are already compressed, and
// gzipping them again wastes CPU for no size win. GH Pages (and every real
// static host) compresses these in transit; a test server that doesn't
// measures Lighthouse/perf budgets against artificially large transfers.
const COMPRESSIBLE = new Set(['.html', '.js', '.mjs', '.css', '.json', '.svg', '.xml'])

const server = createServer(async (req, res) => {
  const pathname = decodeURIComponent(new URL(req.url ?? '/', 'http://localhost').pathname)
  if (!pathname.startsWith(BASE)) {
    res.writeHead(404).end('Not found (outside base path)')
    return
  }
  let filePath = path.join(ROOT, pathname.slice(BASE.length - 1))
  try {
    if ((await stat(filePath)).isDirectory()) filePath = path.join(filePath, 'index.html')
    const data = await readFile(filePath)
    const contentType = MIME[path.extname(filePath)] ?? 'application/octet-stream'
    const acceptsGzip = (req.headers['accept-encoding'] ?? '').includes('gzip')
    const headers = { 'Content-Type': contentType }
    let body = data
    if (acceptsGzip && COMPRESSIBLE.has(path.extname(filePath))) {
      headers['Content-Encoding'] = 'gzip'
      body = gzipSync(data)
    }
    res.writeHead(200, headers)
    res.end(body)
  } catch {
    try {
      const notFound = await readFile(path.join(ROOT, '404.html'))
      const acceptsGzip = (req.headers['accept-encoding'] ?? '').includes('gzip')
      const headers = { 'Content-Type': 'text/html; charset=utf-8' }
      let body = notFound
      if (acceptsGzip) {
        headers['Content-Encoding'] = 'gzip'
        body = gzipSync(notFound)
      }
      res.writeHead(404, headers)
      res.end(body)
    } catch {
      res.writeHead(404).end('Not found')
    }
  }
})

server.listen(PORT, () => {
  console.log(`Serving ${ROOT} at http://localhost:${PORT}${BASE}`)
})
