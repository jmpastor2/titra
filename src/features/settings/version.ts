/**
 * The build stamp the app carries: the deploy writes "<package version>+<short commit>" (a
 * local build is just the package version). Pure; see version.test.ts.
 */
export function splitVersion(stamp: string): { version: string; build: string | null } {
  const at = stamp.indexOf('+')
  if (at < 0) return { version: stamp, build: null }
  const build = stamp.slice(at + 1).trim()
  return { version: stamp.slice(0, at), build: build === '' ? null : build }
}
