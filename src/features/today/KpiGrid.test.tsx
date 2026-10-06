import { cleanup, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { activeCycles } from '@/features/cycle/items'
import { labAccount } from '@/features/exposure/testData'
import i18n from '@/i18n'
import { KpiGrid } from './KpiGrid'
import { cycleKpi, type CoverKpi } from './kpis'
import type { HomeKpis } from './useHomeKpis'

// Sunday evening of the lab account: week 2 of 12 of the blend, which goes up tomorrow.
const SUNDAY = new Date(2026, 9, 4, 20, 30)
const lab = labAccount(SUNDAY)

const cover: CoverKpi = {
  days: 15,
  compoundIds: ['mots-c'],
  runsOutAt: new Date(2026, 9, 19),
  orderBy: new Date(2026, 8, 28),
}
const base: HomeKpis = {
  streak: {
    days: 8,
    ticks: ['full', 'full', 'none', 'full', 'missed', 'full', 'full', 'full', 'partial'],
  },
  adherence: { taken: 25, expected: 26, ratio: 25 / 26, deltaPts: 4 },
  cycle: cycleKpi(activeCycles(lab.protocols, SUNDAY)),
  cover,
}

function show(over: Partial<HomeKpis> = {}, linked = true) {
  return render(
    <MemoryRouter>
      <KpiGrid kpis={{ ...base, ...over }} vials={lab.vials} now={SUNDAY} linked={linked} />
    </MemoryRouter>,
  )
}
const tile = (label: RegExp) => screen.getByText(label).closest('a')!

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('KpiGrid', () => {
  it('answers the four questions, each tile a link to where it is worked on', () => {
    show()
    expect(tile(/^Racha$/)).toHaveTextContent('8días')
    expect(tile(/^Racha$/)).toHaveAttribute('href', '/progress')
    expect(tile(/^Adherencia 28 d$/)).toHaveTextContent('96%')
    expect(tile(/^Adherencia 28 d$/)).toHaveTextContent('25 de 26 tomas')
    expect(tile(/^Adherencia 28 d$/)).toHaveAttribute('href', '/log')
    expect(tile(/^Ciclo · /)).toHaveAttribute('href', '/cycles')
    expect(tile(/^Stock · MOTS-c$/)).toHaveTextContent('15días')
    expect(tile(/^Stock · MOTS-c$/)).toHaveAttribute('href', '/inventory')
  })

  it('compares the adherence with the 28 days before, in points', () => {
    show()
    expect(tile(/^Adherencia 28 d$/)).toHaveTextContent('+4 pts')
    expect(screen.getByText('+4 puntos frente a los 28 días anteriores')).toBeInTheDocument()
    cleanup()
    show({ adherence: { taken: 20, expected: 26, ratio: 20 / 26, deltaPts: -9 } })
    expect(tile(/^Adherencia 28 d$/)).toHaveTextContent('77%')
    expect(tile(/^Adherencia 28 d$/)).toHaveTextContent('−9 pts')
    cleanup()
    show({ adherence: { taken: 25, expected: 26, ratio: 25 / 26, deltaPts: null } })
    expect(tile(/^Adherencia 28 d$/)).not.toHaveTextContent('pts')
  })

  it('reads the cycle as its week out of the total, with the next change', () => {
    show()
    const cycle = tile(/^Ciclo · CJC-1295 \+ Ipamorelina$/)
    expect(cycle).toHaveTextContent('2/ 12 sem')
    expect(cycle).toHaveTextContent('Sube el lun 5 a 12 U')
    expect(screen.getByRole('img', { name: 'Semana 2 de 12' })).toBeInTheDocument()
  })

  it('says to order now once the order-by day has passed, and by when otherwise', () => {
    show()
    expect(tile(/^Stock · MOTS-c$/)).toHaveTextContent('Pide ya: se acaba el 19 oct')
    cleanup()
    show({
      cover: {
        ...cover,
        days: 40,
        runsOutAt: new Date(2026, 10, 13),
        orderBy: new Date(2026, 9, 23),
      },
    })
    expect(tile(/^Stock · MOTS-c$/)).toHaveTextContent('Pide antes del 23 oct')
  })

  it('says "all covered" past the horizon', () => {
    show({ cover: { days: null, compoundIds: [], runsOutAt: null, orderBy: null } })
    expect(tile(/^Stock$/)).toHaveTextContent('+8meses')
    expect(tile(/^Stock$/)).toHaveTextContent('Todo cubierto')
  })

  it('draws the last fourteen days under the streak', () => {
    show()
    expect(screen.getByRole('img', { name: 'Últimos 9 días: 6 completos' })).toBeInTheDocument()
    cleanup()
    show({ streak: { days: 0, ticks: ['missed'] } })
    expect(tile(/^Racha$/)).toHaveTextContent('sin racha ahora')
  })

  it('leaves out the tiles with nothing to say, and lets an odd last one take the row', () => {
    const { container } = show({ cover: null })
    const tiles = container.querySelectorAll('section > a')
    expect(tiles).toHaveLength(3)
    expect(tiles[2]).toHaveClass('[&:last-child:nth-child(odd)]:col-span-2')
    cleanup()
    expect(
      show({ adherence: null, cover: null }).container.querySelectorAll('section > a'),
    ).toHaveLength(2)
  })

  it('is only a reading, with no links, in a shared view', () => {
    const { container } = show({}, false)
    expect(container.querySelector('a')).toBeNull()
  })
})
