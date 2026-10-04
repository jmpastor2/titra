/**
 * The copy of the Ciclos screen and the code that asks for it stay in step: every key the
 * code uses exists in both languages, and no key is left behind that nothing uses.
 */
import { describe, expect, it } from 'vitest'
import en from '@/i18n/en.json'
import es from '@/i18n/es.json'

type Tree = { [key: string]: string | Tree }

// The screen's own sources: everything beside this file but its tests, fixtures and harness.
const files = import.meta.glob(
  ['./*.ts', './*.tsx', '!./*.test.ts', '!./*.test.tsx', '!./fixtures.ts', '!./__lab.tsx'],
  { query: '?raw', import: 'default', eager: true },
) as Record<string, string>
const sources = Object.values(files).join('\n')

/** Keys written out in full: t('cycles.next.rest'). */
const used = new Set([...sources.matchAll(/\bt\(\s*'(cycles\.[\w.]+)'/g)].map((m) => m[1]!))
/** Keys built from a state: t(`cycles.step.state.${state}`). */
for (const state of ['past', 'current', 'future', 'skipped']) used.add(`cycles.step.state.${state}`)
/** Entries of the menu that the app shell wires, not this folder. */
const WIRED_ELSEWHERE = new Set(['cycles.menu', 'cycles.menuHint'])

const PLURALS = ['_zero', '_one', '_other']
function has(tree: Tree, key: string): boolean {
  let node: string | Tree | undefined = tree
  for (const part of key.split('.')) {
    if (typeof node !== 'object') return false
    node = node[part]
  }
  return typeof node === 'string'
}
const hasKey = (tree: Tree, key: string) =>
  has(tree, key) || PLURALS.some((suffix) => has(tree, `${key}${suffix}`))

function flatten(tree: Tree, prefix = ''): string[] {
  return Object.entries(tree).flatMap(([k, v]) =>
    typeof v === 'string' ? [`${prefix}${k}`] : flatten(v, `${prefix}${k}.`),
  )
}

describe('cycles copy', () => {
  it('reads the sources of the screen', () => {
    expect(Object.keys(files).length).toBeGreaterThan(10)
    expect(used.size).toBeGreaterThan(80)
  })

  it('has every key the code uses, in Spanish and in English', () => {
    const missing = [...used].filter((k) => !hasKey(es as Tree, k) || !hasKey(en as Tree, k))
    expect(missing).toEqual([])
  })

  it('has no key that nothing uses', () => {
    const own = flatten((es as Tree).cycles as Tree, 'cycles.')
    const base = (key: string) => key.replace(/_(zero|one|other)$/, '')
    const unused = [...new Set(own.map(base))].filter(
      (k) => !used.has(k) && !WIRED_ELSEWHERE.has(k),
    )
    expect(unused).toEqual([])
  })
})
