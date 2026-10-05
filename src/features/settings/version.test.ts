import { describe, expect, it } from 'vitest'
import { splitVersion } from './version'

describe('splitVersion', () => {
  it('splits the package version from the commit the deploy added', () => {
    expect(splitVersion('0.1.0+3fa9c2d')).toEqual({ version: '0.1.0', build: '3fa9c2d' })
  })

  it('has no build for a local version', () => {
    expect(splitVersion('0.1.0')).toEqual({ version: '0.1.0', build: null })
  })

  it('does not invent a build out of a dangling plus sign', () => {
    expect(splitVersion('0.1.0+')).toEqual({ version: '0.1.0', build: null })
  })
})
