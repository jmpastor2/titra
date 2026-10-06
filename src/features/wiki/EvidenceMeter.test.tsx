import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { EVIDENCE_ORDER } from '@/content/compounds'
import i18n from '@/i18n'
import { EvidenceBars, EvidenceTag } from './EvidenceMeter'
import { EVIDENCE_RUNGS } from './facts'
import { evidenceColor } from './tones'

beforeAll(() => i18n.changeLanguage('es'))
afterEach(cleanup)

const lit = (el: Element) =>
  [...el.children].filter((bar) => (bar as HTMLElement).style.background !== 'var(--panel-3)')
    .length

describe('EvidenceBars', () => {
  it('lights one bar per rung up to the tier, and stays out of the accessibility tree', () => {
    const { container } = render(<EvidenceBars tier="phase3" />)
    const bars = container.firstElementChild
    if (!bars) throw new Error('no bars')
    expect(bars).toHaveAttribute('aria-hidden', 'true')
    expect(bars.children).toHaveLength(EVIDENCE_RUNGS)
    expect(lit(bars)).toBe(6)
  })

  it('rises from the weakest tier to the strongest', () => {
    const levels = EVIDENCE_ORDER.map((tier) => {
      const { container } = render(<EvidenceBars tier={tier} />)
      const n = Number(container.firstElementChild?.getAttribute('data-level'))
      cleanup()
      return n
    })
    expect(levels).toEqual([7, 6, 5, 4, 3, 2, 1])
  })
})

describe('EvidenceTag', () => {
  it('writes the tier in sentence case next to the bars', () => {
    render(<EvidenceTag tier="anecdotal" />)
    expect(screen.getByText('Anecdótico')).toBeInTheDocument()
  })
})

describe('evidenceColor', () => {
  it('reads trials as fine, animal or user reports as careful and withdrawn as wrong', () => {
    expect(evidenceColor('phase1')).toBe('var(--signal)')
    expect(evidenceColor('fda_approved')).toBe('var(--signal)')
    expect(evidenceColor('preclinical')).toBe('var(--warn)')
    expect(evidenceColor('anecdotal')).toBe('var(--warn)')
    expect(evidenceColor('withdrawn')).toBe('var(--danger)')
  })
})
