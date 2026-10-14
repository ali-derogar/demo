import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base: './' keeps gallery assets relative, so the site works on a Pages
// preview URL, a custom domain, or opened from a nested folder.
export default defineConfig({
  plugins: [react()],
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
