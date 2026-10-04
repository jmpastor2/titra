import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { TrackCell } from './view'
import { WeekTrack } from './WeekTrack'

const cells: TrackCell[] = [
  { kind: 'more', state: 'done', count: 4 },
  { kind: 'week', n: 5, state: 'done', rest: false, stepStart: true },
  { kind: 'week', n: 6, state: 'current', rest: false, stepStart: false },
  { kind: 'week', n: 7, state: 'future', rest: true, stepStart: true },
  { kind: 'open', state: 'future' },
]

describe('WeekTrack', () => {
  it('draws one segment per week, with "+N" for the weeks left out', () => {
    const { container } = render(
      <WeekTrack cells={cells} color="var(--sub-violet)" label="Semana 6" />,
    )
    expect(screen.getByRole('img', { name: 'Semana 6' })).toBeInTheDocument()
    expect(screen.getByText('+4')).toBeInTheDocument()
    // Four segments: three weeks and the open-ended one.
    expect(container.querySelectorAll('span[style]')).toHaveLength(4)
  })

  it('lights only the current week', () => {
    const { container } = render(<WeekTrack cells={cells} color="var(--sub-violet)" />)
    const lit = [...container.querySelectorAll<HTMLElement>('span[style]')].filter((s) =>
      s.style.boxShadow.includes('var(--sub-violet)'),
    )
    expect(lit).toHaveLength(1)
    expect(lit[0]).toHaveClass('h-3.5')
  })

  it('is decorative without a label', () => {
    const { container } = render(<WeekTrack cells={cells} color="var(--sub-violet)" />)
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
    expect(screen.queryByRole('img')).toBeNull()
  })
})
