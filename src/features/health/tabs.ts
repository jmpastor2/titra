/** The tabs of Progress and what a link to one of them may ask for. Pure; see tabs.test.ts. */
export type ProgressTab = 'wellbeing' | 'body' | 'symptoms' | 'labs'

export const PROGRESS_TABS: readonly ProgressTab[] = ['wellbeing', 'body', 'symptoms', 'labs']

/** The tab a link asks for, the first one when it is missing or not one of ours. */
export function tabOf(value: string | null): ProgressTab {
  return PROGRESS_TABS.find((t) => t === value) ?? 'wellbeing'
}
