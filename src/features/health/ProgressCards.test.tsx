import { cleanup, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import i18n from '@/i18n'
import { ConsistencyCard } from './ConsistencyCard'
import { CumulativeCard } from './CumulativeCard'
import type { CompoundTotal } from './cumulative'
import { heatGrid } from './heatmap'
import { bodyUnits } from './units'
import { BodyTile } from './SummaryTiles'
import { WeekCard } from './WeekCard'
import type { WeekItem } from './weekly'

const scope = { patientId: 'p', patient: null, isSelf: true, readOnly: false, canPrescribe: false }
const wrapper = ({ children }: { children: ReactNode }) => (
  <PatientScopeProvider value={scope}>{children}</PatientScopeProvider>
)
const flat = (s: string | null) => (s ?? '').replace(/[  ]/g, ' ')

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('ConsistencyCard', () => {
  const grid = heatGrid([], new Date(2026, 9, 7, 14))

  it('says the adherence of the last 28 days against its mark, the streak and the best one', () => {
    render(
      <ConsistencyCard
        grid={grid}
        streaks={{ current: 8, best: 14 }}
        last28={{ taken: 25, expected: 26, ratio: 25 / 26 }}
        hasProtocols
      />,
    )
    expect(screen.getByText('Adherencia · 28 días')).toBeInTheDocument()
    expect(screen.getByText('96')).toBeInTheDocument()
    expect(screen.getByText('25 de 26 tomas')).toBeInTheDocument()
    expect(screen.getByRole('meter', { name: /Adherencia · 28 días: 96/ })).toBeInTheDocument()
    expect(screen.getByText('Racha actual')).toBeInTheDocument()
    expect(screen.getByText('Mejor racha')).toBeInTheDocument()
    expect(flat(screen.getByText(/^8 d/).textContent)).toBe('8 días')
    expect(flat(screen.getByText(/^14 d/).textContent)).toBe('14 días')
    expect(screen.getByText('Últimas 12 semanas')).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('img')
        .some((e) => /Calendario de 12 semanas/.test(e.getAttribute('aria-label') ?? '')),
    ).toBe(true)
  })

  it('compares with the 28 days before in points, only when there were doses then', () => {
    const { rerender } = render(
      <ConsistencyCard
        grid={grid}
        streaks={{ current: 8, best: 14 }}
        last28={{ taken: 25, expected: 26, ratio: 25 / 26 }}
        prev28={{ taken: 23, expected: 25, ratio: 23 / 25 }}
        hasProtocols
      />,
    )
    expect(screen.getByText('+4 pt')).toBeInTheDocument()
    rerender(
      <ConsistencyCard
        grid={grid}
        streaks={{ current: 8, best: 14 }}
        last28={{ taken: 25, expected: 26, ratio: 25 / 26 }}
        prev28={{ taken: 0, expected: 0, ratio: null }}
        hasProtocols
      />,
    )
    expect(screen.queryByText(/ pt$/)).toBeNull()
  })

  it('writes "1 día" in the singular', () => {
    render(
      <ConsistencyCard
        grid={grid}
        streaks={{ current: 1, best: 1 }}
        last28={{ taken: 1, expected: 1, ratio: 1 }}
        hasProtocols
      />,
    )
    expect(screen.getAllByText(/^1 día$/)).toHaveLength(2)
  })

  it('asks for a protocol instead of drawing an empty calendar', () => {
    render(
      <ConsistencyCard
        grid={grid}
        streaks={{ current: 0, best: 0 }}
        last28={{ taken: 0, expected: 0, ratio: null }}
        hasProtocols={false}
      />,
    )
    expect(screen.getByText(/Con una pauta activa/)).toBeInTheDocument()
    expect(screen.queryByText('Racha actual')).toBeNull()
    expect(document.querySelector('[data-level]')).toBeNull()
  })

  it('says nothing was due instead of a percentage or an empty bar', () => {
    render(
      <ConsistencyCard
        grid={grid}
        streaks={{ current: 0, best: 0 }}
        last28={{ taken: 0, expected: 0, ratio: null }}
        hasProtocols
      />,
    )
    expect(screen.getByText('Sin tomas previstas')).toBeInTheDocument()
    expect(screen.queryByRole('meter')).toBeNull()
  })
})

describe('CumulativeCard', () => {
  const reta: CompoundTotal = {
    compoundId: 'retatrutide',
    unit: 'mg',
    totalMg: 4.75,
    count: 4,
    since: new Date(2026, 8, 7),
    weekly: [...Array.from({ length: 8 }, () => 0), 1, 1.25, 1.5, 1],
  }
  const blend: CompoundTotal = {
    compoundId: 'cjc-1295',
    unit: 'mcg',
    totalMg: 1.3,
    count: 10,
    since: new Date(2026, 8, 22),
    weekly: [...Array.from({ length: 10 }, () => 0), 0.5, 0.8],
  }

  it('lists each compound with what has gone in, in the unit it is dosed in', () => {
    render(<CumulativeCard totals={[reta, blend]} />)
    expect(screen.getByText('Total administrado')).toBeInTheDocument()
    expect(screen.getByText('Retatrutida')).toBeInTheDocument()
    expect(screen.getByText('4,75')).toBeInTheDocument()
    expect(screen.getByText('mg')).toBeInTheDocument()
    expect(screen.getByText('4 tomas · desde el 7 sep')).toBeInTheDocument()
    expect(screen.getByText('1300')).toBeInTheDocument()
    expect(screen.getByText('mcg')).toBeInTheDocument()
    expect(screen.getByText('10 tomas · desde el 22 sep')).toBeInTheDocument()
  })

  it('gives each compound twelve bars and says them for the ear', () => {
    render(<CumulativeCard totals={[reta]} />)
    const bars = screen.getByRole('img', { name: /Retatrutida, por semana/ })
    expect(bars.children).toHaveLength(12)
    expect(flat(bars.getAttribute('aria-label'))).toContain('1,25 mg, 1,5 mg, 1 mg')
  })

  it('writes one dose in the singular', () => {
    render(<CumulativeCard totals={[{ ...reta, count: 1 }]} />)
    expect(screen.getByText('1 toma · desde el 7 sep')).toBeInTheDocument()
  })

  it('draws nothing when nothing has been taken', () => {
    const { container } = render(<CumulativeCard totals={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('WeekCard', () => {
  const renderCard = (items: WeekItem[]) => render(<WeekCard items={items} />, { wrapper })

  it('writes the adherence with its timing in one line', () => {
    renderCard([{ kind: 'adherence', taken: 9, expected: 9, offTime: 0 }])
    expect(screen.getByText('Adherencia 100 % · 9/9 tomas, todas en hora')).toBeInTheDocument()
  })

  it('counts the doses that were off time', () => {
    renderCard([{ kind: 'adherence', taken: 8, expected: 9, offTime: 2 }])
    expect(screen.getByText('Adherencia 89 % · 8/9 tomas, 2 fuera de hora')).toBeInTheDocument()
  })

  it('says nothing about timing when it is not known', () => {
    renderCard([{ kind: 'adherence', taken: 8, expected: 9, offTime: null }])
    expect(screen.getByText('Adherencia 89 % · 8/9 tomas')).toBeInTheDocument()
  })

  it('tells the dose steps that already happened, not the ones ahead', () => {
    const step = (upcoming: boolean, doseMg: number, protocolId: string): WeekItem => ({
      kind: 'step',
      protocolId,
      name: 'Retatrutida',
      compoundId: 'retatrutide',
      unit: 'mg',
      upcoming,
      change: {
        kind: 'up',
        at: new Date(2026, 8, 28),
        doseMg,
        prevDoseMg: 1.25,
        index: 2,
        pause: false,
      },
    })
    renderCard([step(false, 1.5, 'reta'), step(true, 1.75, 'next')])
    expect(screen.getByText(/Retatrutida subió a 1,5 mg/)).toBeInTheDocument()
    expect(screen.queryByText(/1,75 mg/)).toBeNull()
  })

  it('asks for something to record when there is nothing to say', () => {
    renderCard([])
    expect(screen.getByText(/Registra peso, tomas o un check-in/)).toBeInTheDocument()
  })
})

describe('BodyTile', () => {
  const units = bodyUnits(false)
  const data = {
    change: {
      latest: { at: new Date(2026, 9, 2), value: 77 },
      baseline: { at: new Date(2026, 8, 8), value: 80.2 },
      delta: -3.2,
      pct: -0.04,
    },
    rate: { perWeek: -0.8, n: 5, spanDays: 20 },
    spark: [80.2, 79, 78, 77],
  }
  const props = {
    kind: 'weight' as const,
    units,
    label: 'Peso',
    empty: 'Pésate',
    data,
    locale: 'es' as const,
    color: 'var(--signal)',
    wide: true,
  }

  it('shows the change since the start with its percentage and the pace', () => {
    render(<BodyTile {...props} goal={null} />)
    expect(screen.getByText('77,0')).toBeInTheDocument()
    expect(flat(screen.getByText(/−3,2 kg/).textContent)).toBe('−3,2 kg')
    expect(flat(screen.getByText(/desde el 8 sep/).textContent)).toBe(
      '−4,0 % desde el 8 sep · ritmo −0,8 kg/sem',
    )
  })

  it('shows the way done towards the goal as a bar', () => {
    render(<BodyTile {...props} goal={72} />)
    const bar = screen.getByRole('meter')
    // From 80,2 to 72 is 8,2 kg; 3,2 of them are done.
    expect(bar).toHaveAttribute('aria-valuenow', '39')
    expect(flat(bar.getAttribute('aria-label'))).toBe('39 % del camino a 72,0 kg')
    expect(screen.getByText('faltan 5,0 kg')).toBeInTheDocument()
  })

  it('says the goal is reached once it is', () => {
    render(<BodyTile {...props} goal={77.5} />)
    expect(screen.getByRole('meter')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('Objetivo alcanzado')).toBeInTheDocument()
  })

  it('has no bar without a goal, and on the small tiles', () => {
    const { rerender } = render(<BodyTile {...props} goal={null} />)
    expect(screen.queryByRole('meter')).toBeNull()
    rerender(<BodyTile {...props} wide={false} goal={72} />)
    expect(screen.queryByRole('meter')).toBeNull()
  })

  it('asks for the first reading when there is none', () => {
    render(<BodyTile {...props} data={{ change: null, rate: null, spark: [] }} />)
    expect(screen.getByText('Pésate')).toBeInTheDocument()
  })
})
