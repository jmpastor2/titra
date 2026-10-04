import { compoundName } from '@/content/compounds'

/** A substance's name without the qualifier in brackets: "CJC-1295 (sin DAC)" reads "CJC-1295". */
export function shortName(compoundId: string): string {
  return compoundName(compoundId)
    .replace(/\s*\([^)]*\)/g, '')
    .trim()
}

/** Several substances in one line: "CJC-1295 + Ipamorelina". */
export function shortNames(compoundIds: readonly string[]): string {
  return compoundIds.map(shortName).join(' + ')
}
