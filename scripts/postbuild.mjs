/* oxlint-disable no-console -- a command line step */
import { spawnSync } from 'node:child_process'
import { copyFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

// GitHub Pages has no SPA fallback: serve index.html for unknown routes via 404.html.
const src = new URL('../dist/index.html', import.meta.url)
const dst = new URL('../dist/404.html', import.meta.url)
if (existsSync(src)) {
  copyFileSync(src, dst)
  console.log('postbuild: 404.html created for SPA fallback')
}

// The chunk graph decides what the home screen downloads: print it and fail the build when it
// regressed (circular chunks, a lazy screen or a charting library on the startup path, a chunk the
// service worker does not precache). See scripts/startup-set.mjs.
const check = spawnSync(
  process.execPath,
  [
    fileURLToPath(new URL('./startup-set.mjs', import.meta.url)),
    fileURLToPath(new URL('../dist', import.meta.url)),
    '--check',
    '--brief',
  ],
  { stdio: 'inherit' },
)
if (check.status !== 0) process.exit(check.status ?? 1)
