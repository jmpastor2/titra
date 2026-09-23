// GitHub Pages has no SPA fallback: serve index.html for unknown routes via 404.html.
import { copyFileSync, existsSync } from 'node:fs'
const src = new URL('../dist/index.html', import.meta.url)
const dst = new URL('../dist/404.html', import.meta.url)
if (existsSync(src)) {
  copyFileSync(src, dst)
  console.log('postbuild: 404.html created for SPA fallback')
}
