import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { doseRow, labAccount, weeklyProtocol } from '@/features/exposure/testData'
import { deriveExposure } from '@/features/exposure/useExposure'
import { activeVial } from '@/features/inventory/vials'
import { LevelCard, LevelCardSkeleton } from './LevelCard'

// Monday 5 Oct 2026, five past midnight: week 4 of retatrutide and MOTS-c, one night of the blend missed.
const now = new Date(2026, 9, 5, 0, 5)
const lab = labAccount(now)

function card(compoundId: string, title?: string) {
  const x = lab.byId(compoundId)
  return render(
    <MemoryRouter>
      <LevelCard x={x} now={now} vial={activeVial(lab.vials, compoundId)} title={title} />
    </MemoryRouter>,
  )
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('LevelCard · long-acting compound', () => {
  it('shows the amount on board in mg, the share of steady state and the next dose', () => {
    card('retatrutide')
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/substance/retatrutide')
    expect(within(link).getByText('Retatrutida')).toBeInTheDocument()
    expect(link).toHaveTextContent('0,93')
    expect(link).toHaveTextContent('mg')
    expect(link).toHaveTextContent('A bordo')
    expect(link).toHaveTextContent('70 %')
    expect(link).toHaveTextContent('Próxima en')
    // The trace is a labelled image with the lit "now" point.
    expect(
      within(link).getByRole('img', { name: /Nivel de los últimos 10 días/ }),
    ).toBeInTheDocument()
  })

  it('lights the now point exactly where the reading is', () => {
    const { container } = card('retatrutide')
    const svg = container.querySelector('svg[role="img"]')!
    const glow = [...svg.querySelectorAll('circle')].find((c) => c.getAttribute('r') === '3')
    expect(glow).toBeTruthy()
    // The history path ends at the now point.
    const history = [...svg.querySelectorAll('path')].find(
      (p) => p.getAttribute('stroke-width') === '1.75',
    )!
    const last = history.getAttribute('d')!.split(' L').at(-1)!
    expect(last).toBe(`${glow!.getAttribute('cx')} ${glow!.getAttribute('cy')}`)
  })

  it('wears the warning tick when the vial is about to expire', () => {
    const { container } = card('retatrutide')
    expect(container.querySelector('circle[fill="var(--warn)"]')).not.toBeNull()
    expect(screen.getByText('Vial casi agotado')).toBeInTheDocument()
  })
})

describe('LevelCard · substance without a level', () => {
  it('shows the last dose, the 14-day strip with its legend and the next dose', () => {
    card('mots-c')
    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('MOTS-c')
    expect(link).toHaveTextContent('hace 3 días')
    expect(link).toHaveTextContent('Última toma')
    expect(link).toHaveTextContent('14 d · 5/5')
    expect(link).toHaveTextContent('Próxima en 9 h')
    const strip = within(link).getByRole('img', {
      name: /5 de 5 tomas previstas en los últimos 14 días/,
    })
    expect(strip.children).toHaveLength(14)
    // Today's shot is still pending: it says so.
    expect(link).toHaveTextContent('pendiente')
  })

  it('shows a blend as one card, with the missed night in the legend', () => {
    card('mod-grf-1-29', 'CJC-1295 + Ipamorelina')
    const link = screen.getByRole('link')
    expect(link).toHaveAttribute('href', '/substance/mod-grf-1-29')
    expect(link).toHaveTextContent('CJC-1295 + Ipamorelina')
    expect(link).toHaveTextContent('14 d · 4/5')
    expect(link).toHaveTextContent('perdida')
    expect(link).toHaveTextContent('Próxima en 1 d')
    // The vial is the striped blend icon, not low.
    expect(screen.getByText(/Vial: queda el/)).toBeInTheDocument()
  })
})

describe('LevelCard · layout and clock', () => {
  it('is the same size whatever it shows, and so is its loading shape', () => {
    const sizes = ['retatrutide', 'mots-c', 'mod-grf-1-29'].map((id) => {
      const { container } = card(id)
      const cls = (container.firstElementChild as HTMLElement).className
      cleanup()
      return cls.match(/h-\[\d+px\] w-\[\d+px\]/)?.[0]
    })
    expect(new Set(sizes).size).toBe(1)
    expect(sizes[0]).toBeTruthy()
    const { container } = render(<LevelCardSkeleton />)
    expect((container.firstElementChild as HTMLElement).className).toContain(
      sizes[0]!.split(' ')[0],
    )
  })

  it('reads the entry at its own clock, not at a stale prop', () => {
    const x = lab.byId('retatrutide')
    // A page clock three minutes behind the data must not change what the card says.
    const stale = new Date(now.getTime() - 3 * 60_000)
    render(
      <MemoryRouter>
        <LevelCard x={x} now={stale} vial={undefined} />
      </MemoryRouter>,
    )
    expect(screen.getByRole('link')).toHaveTextContent('0,93')
  })

  it('says there is no vial when the substance has none', () => {
    render(
      <MemoryRouter>
        <LevelCard x={lab.byId('retatrutide')} now={now} vial={undefined} />
      </MemoryRouter>,
    )
    expect(screen.getByText('Sin vial')).toBeInTheDocument()
  })

  it('reads in English too', async () => {
    await i18n.changeLanguage('en')
    card('retatrutide')
    expect(screen.getByRole('link')).toHaveTextContent('On board')
    expect(screen.getByRole('link')).toHaveTextContent('Next in')
    await i18n.changeLanguage('es')
  })
})

describe('LevelCard · edge states', () => {
  // Wednesday 7 Oct 2026, noon.
  const wed = new Date(2026, 9, 7, 12)
  const reta = (doses = [doseRow(new Date(2026, 9, 5, 9), 1.5)]) =>
    deriveExposure([weeklyProtocol()], doses, wed)[0]!

  function show(x: ReturnType<typeof reta>) {
    return render(
      <MemoryRouter>
        <LevelCard x={x} now={wed} vial={undefined} />
      </MemoryRouter>,
    )
  }

  it('shows an empty level as zero, not as a broken chart', () => {
    show(reta([]))
    const link = screen.getByRole('link')
    expect(link).toHaveTextContent('0')
    expect(link).toHaveTextContent('A bordo')
    expect(link).toHaveTextContent('Próxima en')
    expect(
      within(link).getByRole('img', { name: /Nivel de los últimos 10 días/ }),
    ).toBeInTheDocument()
  })

  it('reads a single dose as a rising level', () => {
    show(reta())
    const amount = screen.getByRole('link').textContent!.match(/(\d+),(\d+)\s*mg/)
    expect(amount).not.toBeNull()
    expect(Number(`${amount![1]}.${amount![2]}`)).toBeGreaterThan(0.5)
  })

  it('does not count a dose dated ahead as the last dose of a compound with no level', () => {
    const mots = deriveExposure(
      [
        weeklyProtocol({
          id: 'm',
          compound_id: 'mots-c',
          name: 'MOTS-c',
          unit: 'mg',
          steps: [{ doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null }],
        }),
      ],
      [
        doseRow(new Date(2026, 9, 5, 9), 1, { compound_id: 'mots-c', protocol_id: 'm' }),
        doseRow(new Date(2026, 9, 9, 9), 1, { compound_id: 'mots-c', protocol_id: 'm' }),
      ],
      wed,
    )[0]!
    show(mots)
    // Two days ago (Monday), not "in two days" (Friday's, logged ahead).
    expect(screen.getByRole('link')).toHaveTextContent('hace 2 días')
  })

  it('has nothing to show for a substance with doses but no plan, and says so', () => {
    const free = deriveExposure(
      [],
      [doseRow(new Date(2026, 9, 5, 9), 1.5, { protocol_id: null })],
      wed,
    )[0]!
    show(free)
    expect(screen.getByRole('link')).toHaveTextContent('Sin pauta activa')
  })
})
