// @vitest-environment node
/**
 * Generator and staleness check of the light compound registry (meta.generated.ts).
 *
 * The full entries in this folder are the source of truth. The app ships a light projection of
 * them (CompoundMeta, see toMeta.ts) on its startup path and loads the long texts on demand, so
 * the projection is generated, checked in, and verified here:
 *
 *   npm run content:meta     regenerate the file (vitest rewrites it: `-u`)
 *   npm test                 fails with instructions when the file is out of date
 *
 * This file must not import meta.generated.ts or ./index, so that it can regenerate the file
 * even when that file is missing or broken.
 */
import { format, resolveConfig } from 'prettier'
import { describe, expect, it } from 'vitest'
import { BLEND_DETAILS, SUBSTANCE_DETAILS } from './entries'
import { toMeta } from './toMeta'

const GENERATED = new URL('./meta.generated.ts', import.meta.url)

/** Light registry as source text, formatted exactly as `prettier --write` would leave it. */
async function generate(): Promise<string> {
  const substances = SUBSTANCE_DETAILS.map(toMeta)
  const blends = BLEND_DETAILS.map(toMeta)
  const source = `// GENERATED FILE: do not edit by hand.
// The light half of the compound catalog: the fields every screen reads synchronously, projected
// from the full entries in this folder by toMeta.ts. Regenerate it with \`npm run content:meta\`
// after changing an entry (the test in meta.test.ts fails while this file is stale).
import type { CompoundMeta } from '../schema'

export const SUBSTANCE_META: readonly CompoundMeta[] = ${JSON.stringify(substances)}

export const BLEND_META: readonly CompoundMeta[] = ${JSON.stringify(blends)}
`
  const options = await resolveConfig(GENERATED)
  return format(source, { ...options, filepath: 'meta.generated.ts' })
}

describe('light compound registry', () => {
  it('meta.generated.ts is up to date with the full entries', async () => {
    const source = await generate()
    try {
      await expect(source).toMatchFileSnapshot('./meta.generated.ts')
    } catch (error) {
      throw new Error(
        'src/content/compounds/meta.generated.ts is out of date with the compound entries.\n' +
          'Regenerate it with `npm run content:meta` and commit the result.',
        { cause: error },
      )
    }
  })

  it('keeps every field a screen reads and none of the long texts', () => {
    const retatrutide = SUBSTANCE_DETAILS.find((c) => c.id === 'retatrutide')
    if (!retatrutide) throw new Error('retatrutide entry missing')
    const meta = toMeta(retatrutide)
    expect(meta.names.generic).toBe(retatrutide.names.generic)
    expect(meta.pharmClass).toEqual(retatrutide.pharmClass)
    expect(meta.summary).toEqual(retatrutide.summary)
    expect(meta.pk?.halfLifeH).toBe(retatrutide.pk?.halfLifeH)
    expect(meta.monitoring).toEqual(retatrutide.monitoring)
    const heavy = Object.keys(meta).filter((key) =>
      ['mechanism', 'indications', 'storage', 'keyTrials', 'references'].includes(key),
    )
    expect(heavy).toEqual([])
    expect(meta.pk).not.toHaveProperty('source')
    expect(meta.pk).not.toHaveProperty('notes')
    expect(meta.regulatory).not.toHaveProperty('notes')
    expect(meta.dosing).not.toHaveProperty('labeled')
  })

  it('projects blends without their rationale', () => {
    for (const blend of BLEND_DETAILS) {
      const meta = toMeta(blend)
      expect(meta.blend?.components, blend.id).toEqual(blend.blend?.components)
      expect(meta.blend, blend.id).not.toHaveProperty('rationale')
    }
  })

  it('stays small: it is on the startup path of every screen', () => {
    const bytes = JSON.stringify([...SUBSTANCE_DETAILS, ...BLEND_DETAILS].map(toMeta)).length
    const full = JSON.stringify([...SUBSTANCE_DETAILS, ...BLEND_DETAILS]).length
    // Measured: about a fifth of the full entries (72 kB of 360 kB, half of it the summaries
    // and the monitoring lists that TodayPage, SubstancePage and OutlookPage read synchronously).
    // A jump means a long text slipped into the projection (or a field moved there on purpose:
    // then raise the budget knowingly).
    expect(bytes).toBeLessThan(90_000)
    expect(bytes / full).toBeLessThan(0.25)
  })
})
