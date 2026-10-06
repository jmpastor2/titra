import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { labAccount } from '@/features/exposure/testData'
import i18n from '@/i18n'
import { LevelsCard, LevelsCardSkeleton } from './LevelsCard'

// Sunday evening of the lab account.
const SUNDAY = new Date(2026, 9, 4, 20, 30)
const lab = labAccount(SUNDAY)
const tracked = lab.items.filter((x) => (x.protocol || x.lastDose) && !x.partnerOf)

function show() {
  return render(
    <MemoryRouter>
      <LevelsCard items={tracked} />
    </MemoryRouter>,
  )
}
const row = (name: string) => screen.getByText(name).closest('a')!

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('LevelsCard', () => {
  it('has one row per substance, a blend as one, each opening its page', () => {
    show()
    expect(screen.getAllByRole('link')).toHaveLength(3)
    expect(row('Retatrutida')).toHaveAttribute('href', '/substance/retatrutide')
    expect(row('CJC-1295 + Ipamorelina')).toHaveAttribute('href', '/substance/mod-grf-1-29')
  })

  it('reads a long-acting compound against its steady level, with the band on its gauge', () => {
    show()
    const reta = row('Retatrutida')
    const x = lab.byId('retatrutide')
    const pct = Math.round(x.progress!.fraction * 100)
    expect(reta).toHaveTextContent(`${pct}%`)
    expect(reta).toHaveTextContent('del estable')
    expect(reta).toHaveTextContent(/mg a bordo · (estable en .+|en nivel estable)/)
    expect(
      screen.getByRole('meter', { name: `${pct} % del nivel estable de la pauta actual` }),
    ).toBeInTheDocument()
  })

  it('reads a short-acting one by when it was last taken, with two weeks of days', () => {
    show()
    const mots = row('MOTS-c')
    const last = lab.byId('mots-c').lastDose!.at
    const hours = Math.floor((SUNDAY.getTime() - last.getTime()) / 3_600_000)
    expect(mots).toHaveTextContent(
      hours < 48 ? `hace ${hours} h` : `hace ${Math.floor(hours / 24)} d`,
    )
    expect(mots).toHaveTextContent(/\d+ de \d+ días cumplidos/)
    expect(mots.querySelector('[role="img"]')).toHaveAccessibleName(
      /tomas previstas en los últimos 14 días/,
    )
  })

  it('lets a long name wrap instead of cutting it', () => {
    show()
    expect(screen.getByText('CJC-1295 + Ipamorelina')).toHaveClass('break-words')
    expect(screen.getByText('CJC-1295 + Ipamorelina')).not.toHaveClass('truncate')
  })

  it('has a loading shape without links', () => {
    const { container } = render(<LevelsCardSkeleton />)
    expect(container.querySelector('a')).toBeNull()
    expect(container.firstElementChild).toHaveAttribute('aria-hidden', 'true')
  })
})
