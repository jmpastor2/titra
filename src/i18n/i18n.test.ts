import { describe, expect, it } from 'vitest'
import en from './en.json'
import es from './es.json'

function flatten(obj: unknown, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [prefix]
  return Object.entries(obj as Record<string, unknown>).flatMap(([k, v]) =>
    flatten(v, prefix ? `${prefix}.${k}` : k),
  )
}

describe('i18n resources', () => {
  it('es and en expose exactly the same keys', () => {
    const esKeys = flatten(es).toSorted()
    const enKeys = flatten(en).toSorted()
    const missingInEn = esKeys.filter((k) => !enKeys.includes(k))
    const missingInEs = enKeys.filter((k) => !esKeys.includes(k))
    expect(missingInEn, 'keys missing in en.json').toEqual([])
    expect(missingInEs, 'keys missing in es.json').toEqual([])
  })

  it('has no empty strings', () => {
    const check = (o: unknown, path: string) => {
      if (typeof o === 'string') expect(o.trim(), path).not.toBe('')
      else if (o && typeof o === 'object')
        Object.entries(o).forEach(([k, v]) => check(v, `${path}.${k}`))
    }
    check(es, 'es')
    check(en, 'en')
  })
})
