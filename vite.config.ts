import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv } from 'vite'

// GitHub Pages serves the app under /<repo>/. Override with VITE_BASE_PATH when
// deploying to a custom domain or another host.
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const base = env.VITE_BASE_PATH ?? (mode === 'production' ? '/titra/' : '/')

  return {
    base,
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        includeAssets: ['icons/*.png', 'icons/*.svg'],
        manifest: {
          id: '/titra/',
          name: 'Titra · laboratorio de péptidos',
          short_name: 'Titra',
          description:
            'Tu laboratorio personal de péptidos: pautas, tomas, jeringa, viales, niveles, avisos y wiki.',
          lang: 'es',
          dir: 'ltr',
          start_url: base,
          scope: base,
          display: 'standalone',
          orientation: 'portrait',
          background_color: '#050b0d',
          theme_color: '#050b0d',
          categories: ['health', 'medical'],
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2,json}'],
          navigateFallback: `${base}index.html`,
          navigateFallbackDenylist: [/^\/api\//],
          runtimeCaching: [
            {
              // Supabase REST/auth calls are never served from cache; TanStack
              // Query owns offline persistence with a proper invalidation model.
              urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
              handler: 'NetworkOnly',
            },
          ],
          // Push and notification-click handlers for dose reminders (public/push-sw.js).
          importScripts: ['push-sw.js'],
          cleanupOutdatedCaches: true,
          clientsClaim: true,
        },
        devOptions: { enabled: false },
      }),
    ],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      rollupOptions: {
        output: {
          // Split the heavy, rarely-changing dependencies so an app-code deploy
          // does not invalidate them in the service worker cache.
          manualChunks(id: string) {
            if (!id.includes('node_modules')) return
            if (id.includes('recharts') || id.includes('d3-')) return 'charts'
            if (id.includes('@supabase')) return 'supabase'
            if (id.includes('react-dom') || id.includes('/react/') || id.includes('react-router'))
              return 'vendor'
            return
          },
        },
      },
    },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}'],
      coverage: {
        provider: 'v8',
        include: ['src/domain/**', 'src/lib/**'],
      },
    },
  }
})
