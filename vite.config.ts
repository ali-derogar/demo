import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

// Vite's SPA fallback otherwise serves the gallery for static demo directories.
function demoDirectories(): Plugin {
  return {
    name: 'demo-directories',
    configureServer(server) {
      server.middlewares.use((request, response, next) => {
        const [pathname, query] = (request.url ?? '').split('?')
        const match = /^\/demos\/([a-z0-9-]+)\/?$/.exec(pathname)
        if (!match || !existsSync(resolve(server.config.publicDir, 'demos', match[1], 'index.html'))) return next()
        const suffix = query ? `?${query}` : ''
        if (!pathname.endsWith('/')) {
          response.writeHead(302, { Location: `${pathname}/${suffix}` })
          response.end()
          return
        }
        request.url = `${pathname}index.html${suffix}`
        next()
      })
    },
  }
}

// base: './' keeps gallery assets relative, so the site works on a Pages
// preview URL, a custom domain, or opened from a nested folder.
export default defineConfig({
  plugins: [react(), demoDirectories()],
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    host: true,
  },
})
