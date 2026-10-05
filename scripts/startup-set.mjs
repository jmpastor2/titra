/* oxlint-disable no-console -- a command line report */
// What the browser has to download before the home screen ("/") can render, and what the service
// worker precaches, read from a finished build. It looks at:
//   - index.html: the module entry, the modulepreload hints and the stylesheets;
//   - the entry chunk and every chunk it imports STATICALLY (a dynamic import() is on demand, so
//     it is not part of the startup path), parsed with the same parser Vite uses;
//   - sw.js: the precache list.
//
//   node scripts/startup-set.mjs [dist]            print the startup set (default dist)
//   node scripts/startup-set.mjs [dist] --check    also fail (exit 1) when the chunk graph regressed:
//        - chunks import each other in a circle (execution order is then not guaranteed),
//        - the startup path contains a lazy screen, a charting library or the wiki's full catalog,
//        - a chunk is missing from the precache (that screen would not work offline).
//   --json   machine-readable summary    --brief   totals only, no file table (for the build log)
//   --html <file>   another entry page (default index.html)
//
// Build to a scratch folder with `npx vite build --outDir <dir> --emptyOutDir`; `npm run build`
// runs the check on dist through scripts/postbuild.mjs.
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { dirname, join, normalize } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gzipSync } from 'node:zlib'
import { parseAst } from 'vite'

const args = process.argv.slice(2)
const flag = (name) => {
  const i = args.indexOf(name)
  return i >= 0 ? args[i + 1] : undefined
}
const asJson = args.includes('--json')
const check = args.includes('--check')
const brief = args.includes('--brief')
const htmlName = flag('--html') ?? 'index.html'
const dist = normalize(
  args.find((a, i) => !a.startsWith('--') && !args[i - 1]?.startsWith('--')) ?? 'dist',
)
const read = (file) => readFileSync(join(dist, file))
const kb = (n) => (n / 1000).toFixed(1).padStart(8)

// "/titra/assets/x.js" or "./assets/x.js" -> "assets/x.js"
const fromHtml = (href) => href.replace(/^.*?(assets\/|icons\/|fonts\/)/, '$1')
const attr = (tag, name) => new RegExp(`\\b${name}="([^"]*)"`).exec(tag)?.[1]

const html = read(htmlName).toString('utf8')
const entries = []
const hinted = []
const styles = []
const preloads = []
for (const tag of html.match(/<(script|link)\b[^>]*>/g) ?? []) {
  const href = attr(tag, 'href')
  if (tag.startsWith('<script') && attr(tag, 'type') === 'module' && attr(tag, 'src')) {
    entries.push(fromHtml(attr(tag, 'src')))
  } else if (tag.startsWith('<link') && href) {
    const rel = attr(tag, 'rel')
    if (rel === 'modulepreload') hinted.push(fromHtml(href))
    if (rel === 'stylesheet') styles.push(fromHtml(href))
    if (rel === 'preload') preloads.push({ file: fromHtml(href), as: attr(tag, 'as') })
  }
}

/** Static import specifiers of a chunk (import/export ... from, side-effect imports). */
const parsed = new Map()
const staticImports = (file) => {
  if (!parsed.has(file)) {
    const ast = parseAst(read(file).toString('utf8'))
    const deps = ast.body
      .filter((node) => node.source && typeof node.source.value === 'string')
      .map((node) => join(dirname(file), node.source.value).replaceAll('\\', '/'))
    parsed.set(file, deps)
  }
  return parsed.get(file)
}

/** The entry chunk and everything it imports statically, with the chunk that pulled each in. */
const closure = new Map()
const queue = entries.map((file) => [file, null])
while (queue.length > 0) {
  const [file, via] = queue.shift()
  if (closure.has(file)) continue
  closure.set(file, via)
  for (const dep of staticImports(file)) queue.push([dep, file])
}

const sizeOf = (file) => {
  const buf = read(file)
  return { raw: buf.length, gzip: gzipSync(buf, { level: 9 }).length }
}
const rows = [{ kind: 'html', file: htmlName, ...sizeOf(htmlName) }]
for (const file of styles) rows.push({ kind: 'css', file, ...sizeOf(file) })
for (const [file, via] of closure)
  rows.push({ kind: via === null ? 'entry' : 'static', file, ...sizeOf(file) })
for (const { file, as } of preloads) rows.push({ kind: `preload:${as}`, file, ...sizeOf(file) })
// The latin faces the first screen paints with are fetched whether or not index.html hints them.
const preloaded = new Set(preloads.map((p) => p.file))
for (const sheet of styles) {
  const css = read(sheet).toString('utf8')
  for (const [, url] of css.matchAll(/url\(([^)]*-latin-wght-normal[^)]*\.woff2)\)/g)) {
    const file = fromHtml(url.replaceAll(/["']/g, ''))
    if (!preloaded.has(file) && existsSync(join(dist, file)))
      rows.push({ kind: 'font', file, ...sizeOf(file) })
  }
}

const sum = (list, key) => list.reduce((acc, r) => acc + r[key], 0)
const js = rows.filter((r) => r.file.endsWith('.js'))

// Precache: every url in sw.js (vite-plugin-pwa lists some icons twice).
const sw = existsSync(join(dist, 'sw.js')) ? read('sw.js').toString('utf8') : ''
const precached = new Set([...sw.matchAll(/url:"([^"]+)"/g)].map((m) => m[1]))
const precache = [...precached]
  .filter((url) => existsSync(join(dist, url)))
  .map((file) => ({ file, raw: statSync(join(dist, file)).size }))

/* ------------------------------------------------------------------ the checks */

const problems = []
const chunks = existsSync(join(dist, 'assets'))
  ? readdirSync(join(dist, 'assets'))
      .filter((f) => f.endsWith('.js'))
      .map((f) => `assets/${f}`)
  : []

// 1. Chunks that import each other in a circle (strongly connected components of the import graph).
{
  const index = new Map()
  const low = new Map()
  const onStack = new Set()
  const stack = []
  let counter = 0
  const visit = (v) => {
    index.set(v, counter)
    low.set(v, counter++)
    stack.push(v)
    onStack.add(v)
    for (const w of staticImports(v).filter((d) => chunks.includes(d))) {
      if (!index.has(w)) {
        visit(w)
        low.set(v, Math.min(low.get(v), low.get(w)))
      } else if (onStack.has(w)) low.set(v, Math.min(low.get(v), index.get(w)))
    }
    if (low.get(v) === index.get(v)) {
      const circle = []
      let w
      do {
        w = stack.pop()
        onStack.delete(w)
        circle.push(w)
      } while (w !== v)
      if (circle.length > 1)
        problems.push(`chunks import each other in a circle: ${circle.join(' <-> ')}`)
    }
  }
  for (const chunk of chunks) if (!index.has(chunk)) visit(chunk)
}

// 2. Nothing heavy or lazy on the startup path. The lazy screens are the ones App.tsx imports
//    on demand; the libraries and content below are the heavy things that must never be needed
//    to paint the home screen.
const appSource = fileURLToPath(new URL('../src/app/App.tsx', import.meta.url))
const lazyScreens = existsSync(appSource)
  ? [...readFileSync(appSource, 'utf8').matchAll(/import\('@\/([^']+)'\)/g)].map(
      (m) => `src/${m[1]}.`,
    )
  : []
const HEAVY = [
  { test: /node_modules\/(?:recharts|d3-[^/]+)\//, what: 'a charting library' },
  {
    // The light registry (index, meta.generated, evidence, detail) is the only content on the path.
    test: /src\/content\/compounds\/(?!index\.|meta\.generated\.|evidence\.|detail\.)/,
    what: "the wiki's full catalog",
  },
]
let sourcemaps = 0
const heavyAtStartup = new Map() // "reason | chunk" -> offending sources
for (const file of closure.keys()) {
  if (!existsSync(join(dist, `${file}.map`))) continue
  sourcemaps++
  const { sources } = JSON.parse(read(`${file}.map`).toString('utf8'))
  for (const source of sources.map((s) => s.replaceAll('\\', '/').replace(/^(\.\.\/)+/, ''))) {
    const heavy = HEAVY.find((h) => h.test.test(source))
    const screen = lazyScreens.find((s) => source.includes(`/${s}`))
    const reason = heavy ? heavy.what : screen ? 'a lazy screen' : undefined
    if (!reason) continue
    const key = `${reason} | ${file}`
    heavyAtStartup.set(key, [...(heavyAtStartup.get(key) ?? []), source])
  }
}
for (const [key, found] of heavyAtStartup) {
  const [reason, file] = key.split(' | ')
  problems.push(
    `the startup path loads ${reason}: ${found[0]}${found.length > 1 ? ` and ${found.length - 1} more` : ''} (in ${file})`,
  )
}

// 3. Every chunk is precached, so every screen (the wiki's catalog included) works offline.
if (sw) {
  for (const chunk of chunks)
    if (!precached.has(chunk)) problems.push(`not precached (not available offline): ${chunk}`)
}

/* ------------------------------------------------------------------ the report */

const hintsOutside = hinted.filter((f) => !closure.has(f))
const unhinted = [...closure.keys()].filter((f) => !entries.includes(f) && !hinted.includes(f))

if (asJson) {
  console.log(
    JSON.stringify(
      {
        dist,
        requests: rows.length,
        raw: sum(rows, 'raw'),
        gzip: sum(rows, 'gzip'),
        jsRequests: js.length,
        jsRaw: sum(js, 'raw'),
        jsGzip: sum(js, 'gzip'),
        files: rows.map(({ kind, file, raw, gzip }) => ({ kind, file, raw, gzip })),
        precacheEntries: precache.length,
        precacheRaw: sum(precache, 'raw'),
        problems,
      },
      null,
      2,
    ),
  )
} else {
  if (!brief) {
    console.log(`Startup set of ${dist}\n`)
    console.log(
      `${'kind'.padEnd(10)} ${'file'.padEnd(46)} ${'raw kB'.padStart(8)} ${'gzip kB'.padStart(8)}`,
    )
    for (const r of rows)
      console.log(`${r.kind.padEnd(10)} ${r.file.padEnd(46)} ${kb(r.raw)} ${kb(r.gzip)}`)
  }
  console.log(
    `${brief ? 'startup set of "/": ' : '\n'}${rows.length} requests (${js.length} JS)  raw ${kb(sum(rows, 'raw')).trim()} kB  gzip ${kb(sum(rows, 'gzip')).trim()} kB` +
      `   JS only: raw ${kb(sum(js, 'raw')).trim()} kB  gzip ${kb(sum(js, 'gzip')).trim()} kB`,
  )
  console.log(
    `modulepreload hints: ${hinted.length}` +
      (hintsOutside.length > 0 ? `  NOT statically imported: ${hintsOutside.join(', ')}` : '') +
      (unhinted.length > 0 ? `  imported but not hinted: ${unhinted.join(', ')}` : ''),
  )
  console.log(
    `precache (sw.js): ${precache.length} files, ${(sum(precache, 'raw') / 1000).toFixed(0)} kB raw, ` +
      `${chunks.length} chunks (all of them: ${chunks.every((c) => precached.has(c))})`,
  )
}

if (check) {
  if (sourcemaps === 0)
    console.warn('startup-set: no sourcemaps, the contents of the startup chunks were not checked')
  if (problems.length > 0) {
    console.error(`\nstartup-set: ${problems.length} problem(s) in the chunk graph`)
    for (const p of problems) console.error(`  - ${p}`)
    process.exit(1)
  }
  console.log(
    'startup-set: chunk graph ok (no circular chunks, nothing heavy at startup, all chunks precached)',
  )
}
