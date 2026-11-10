import { afterEach, beforeEach, vi } from 'vitest'

/**
 * Runs a test file with prefers-reduced-motion on: figures and syringes are at their final
 * state at once and no closing animation delays a sheet, so tests assert on what is shown
 * without waiting for a tween. Call it at the top of the file.
 */
export function withReducedMotion() {
  beforeEach(() => {
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches: query.includes('reduce'),
      media: query,
      addEventListener() {},
      removeEventListener() {},
    }))
  })
  afterEach(() => {
    vi.unstubAllGlobals()
  })
}
