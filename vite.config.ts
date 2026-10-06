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
          background_color: '#07080e',
          theme_color: '#07080e',
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
          // Launch screens are fetched by iOS itself; the Cyrillic, Greek and Vietnamese font
          // subsets are only downloaded if text ever needs them. Neither belongs in the install.
          globIgnores: [
            'splash/**',
            '**/*-cyrillic-*.woff2',
            '**/*-greek-*.woff2',
            '**/*-vietnamese-*.woff2',
          ],
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
      // Small fonts would be inlined as base64 into the render-blocking stylesheet, where they
      // do not compress. Keep every font a file that is only fetched when its subset is needed.
      assetsInlineLimit: (file) => (file.endsWith('.woff2') ? false : undefined),
      // The wiki's long texts are one big lazy chunk on purpose (see src/content/compounds/detail.ts).
      chunkSizeWarningLimit: 800,
      rolldownOptions: {
        output: {
          // What the first screen ("Hoy") downloads is decided here. Rolldown puts every module
          // in exactly one chunk, and a group takes the dependencies of the modules it captures
          // along with it. The old `manualChunks` function named "charts" first, so Recharts took
          // React and every shared dependency with it: `vendor` and `index` ended up importing
          // `charts` and the whole charting library loaded at startup. So a group has to be
          // declared before (higher priority than) the groups of the libraries that depend on
          // it: React first, then what is built on React.
          //
          // The libraries the first screen needs get one chunk per family, so each only changes
          // when that dependency is upgraded: long-lived HTTP cache and small service-worker
          // updates. Libraries that only lazy screens use are not listed: they stay in the
          // chunks of those screens and never touch the startup path. After any change here run
          // `node scripts/startup-set.mjs <dist> --check` (npm run build does).
          codeSplitting: {
            groups: [
              {
                name: 'vendor',
                test: /[\\/]node_modules[\\/](?:react|react-dom|scheduler|react-router|react-router-dom)[\\/]/,
                priority: 60,
              },
              { name: 'supabase', test: /[\\/]node_modules[\\/]@supabase[\\/]/, priority: 50 },
              { name: 'query', test: /[\\/]node_modules[\\/]@tanstack[\\/]/, priority: 40 },
              {
                name: 'i18n',
                test: /[\\/]node_modules[\\/](?:i18next|react-i18next|i18next-browser-languagedetector)[\\/]/,
                priority: 30,
              },
              { name: 'icons', test: /[\\/]node_modules[\\/]lucide-react[\\/]/, priority: 20 },
              { name: 'date-fns', test: /[\\/]node_modules[\\/]date-fns[\\/]/, priority: 20 },
              // The light compound registry and the language files change far less often than
              // the app code around them.
              {
                name: 'catalog',
                test: /[\\/]src[\\/]content[\\/]compounds[\\/]/,
                tags: ['$initial'],
                priority: 15,
              },
              { name: 'locales', test: /[\\/]src[\\/]i18n[\\/](?:es|en)\.json$/, priority: 15 },
              // Any other library the first screen imports (zod, idb-keyval, clsx...).
              { name: 'libs', test: /[\\/]node_modules[\\/]/, tags: ['$initial'], priority: 1 },
              // App modules the first screen and at least one lazy screen share would otherwise
              // become a dozen chunks of a few hundred bytes each (one request apiece).
              {
                name: 'common',
                test: /[\\/]src[\\/]/,
                tags: ['$initial'],
                minShareCount: 2,
                priority: 0,
              },
            ],
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
