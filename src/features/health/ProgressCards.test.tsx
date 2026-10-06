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

  it('says the streak, the best one and the adherence of the last 28 days', () => {
    render(
      <ConsistencyCard
        grid={grid}
        streaks={{ current: 8, best: 14 }}
        last28={{ taken: 25, expected: 26, ratio: 25 / 26 }}
        hasProtocols
      />,
    )
    expect(screen.getByText('Constancia · 12 semanas')).toBeInTheDocument()
    expect(screen.getByText('Racha actual')).toBeInTheDocument()
    expect(screen.getByText('Mejor racha')).toBeInTheDocument()
    expect(screen.getByText('8')).toBeInTheDocument()
    expect(screen.getByText('14')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Últimos 28 d: 96/ })).toBeInTheDocument()
    expect(
      screen
        .getAllByRole('img')
        .some((e) => /Calendario de 12 semanas/.test(e.getAttribute('aria-label') ?? '')),
    ).toBe(true)
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
    expect(screen.getAllByText('día')).toHaveLength(2)
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

  it('leaves the ring without a percentage when nothing was due', () => {
    render(
      <ConsistencyCard
        grid={grid}
        streaks={{ current: 0, best: 0 }}
        last28={{ taken: 0, expected: 0, ratio: null }}
        hasProtocols
      />,
    )
    expect(screen.getByText('—')).toBeInTheDocument()
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

  it('keeps the dose steps in a block of their own', () => {
    renderCard([
      { kind: 'adherence', taken: 1, expected: 1, offTime: null },
      {
        kind: 'step',
        protocolId: 'reta',
        name: 'Retatrutida',
        compoundId: 'retatrutide',
        unit: 'mg',
        upcoming: true,
        change: {
          kind: 'up',
          at: new Date(),
          doseMg: 1.75,
          prevDoseMg: 1.5,
          index: 2,
          pause: false,
        },
      },
    ])
    expect(screen.getByText('Dosis')).toBeInTheDocument()
    expect(screen.getByText(/Retatrutida sube a 1,75 mg/)).toBeInTheDocument()
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

  it('shows the way done towards the goal as a bar', () => {
    render(<BodyTile {...props} goal={72} />)
    const bar = screen.getByRole('progressbar')
    // From 80,2 to 72 is 8,2 kg; 3,2 of them are done.
    expect(bar).toHaveAttribute('aria-valuenow', '39')
    expect(flat(bar.getAttribute('aria-label'))).toBe('39 % del camino a 72,0 kg')
  })

  it('says the goal is reached once it is', () => {
    render(<BodyTile {...props} goal={77.5} />)
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100')
    expect(screen.getByText('Objetivo alcanzado')).toBeInTheDocument()
  })

  it('has no bar without a goal, and on the small tiles', () => {
    const { rerender } = render(<BodyTile {...props} goal={null} />)
    expect(screen.queryByRole('progressbar')).toBeNull()
    rerender(<BodyTile {...props} wide={false} goal={72} />)
    expect(screen.queryByRole('progressbar')).toBeNull()
  })

  it('asks for the first reading when there is none', () => {
    render(<BodyTile {...props} data={{ change: null, rate: null, spark: [] }} />)
    expect(screen.getByText('Pésate')).toBeInTheDocument()
  })
})
