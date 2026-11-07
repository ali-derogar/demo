import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import type { Plugin } from 'vite'

const previewHeaders = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
}

// A worker from another localhost app can keep serving that app on this port.
// Remove only the registration controlling this document, and only in dev.
function freshLocalPreview(): Plugin {
  return {
    name: 'fresh-local-preview',
    apply: 'serve',
    transformIndexHtml() {
      return [{
        tag: 'script',
        injectTo: 'head-prepend',
        children: `(async () => {
          if (!['localhost', '127.0.0.1', '[::1]'].includes(location.hostname)) return;
          if (!('serviceWorker' in navigator) || !navigator.serviceWorker.controller) return;
          try {
            const registration = await navigator.serviceWorker.getRegistration(location.href);
            if (registration && await registration.unregister()) location.reload();
          } catch { /* A blocked worker API must not prevent the preview opening. */ }
        })();`,
      }]
    },
  }
}

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
  plugins: [react(), demoDirectories(), freshLocalPreview()],
  base: './',
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0,
  },
  server: {
    port: 5173,
    strictPort: true,
    host: true,
    headers: previewHeaders,
  },
  preview: { headers: previewHeaders },
})
