import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import type { DoseEvent, ProtocolLike } from '@/domain/types'
import i18n from '@/i18n'
import { DoseTimelineChart } from './DoseTimelineChart'
import { buildTimeline, type TimelineModel } from './doseTimeline'
import { timelineWindow, type RangeKey } from './ranges'
import { labAccount } from './testData'

// Monday 5 Oct 2026, five past midnight (see testData.ts).
const now = new Date(2026, 9, 5, 0, 5)
const lab = labAccount(now)

function modelOf(id: string, range: RangeKey = '4w'): TimelineModel {
  const x = lab.byId(id)
  return buildTimeline({
    protocol: x.protocolLike,
    history: x.history,
    partners: x.partners.map((p) => ({ compoundId: p.compoundId, history: p.history })),
    ...timelineWindow(range, now, x.protocolLike),
    now,
  })
}

const states = (c: HTMLElement) =>
  [...c.querySelectorAll('[data-state]')].map((g) => g.getAttribute('data-state'))

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('DoseTimelineChart · the blend', () => {
  const color = 'var(--sub-violet)'

  it('draws one lollipop per administration, taken, missed and planned', () => {
    const model = modelOf('mod-grf-1-29')
    const { container } = render(
      <DoseTimelineChart model={model} now={now} color={color} unit="mcg" />,
    )
    expect(container.querySelectorAll('[data-state]')).toHaveLength(model.items.length)
    const s = states(container)
    expect(s.filter((x) => x === 'taken')).toHaveLength(4)
    expect(s.filter((x) => x === 'missed')).toHaveLength(1)
    expect(s.filter((x) => x === 'planned').length).toBeGreaterThan(0)
  })

  it('reads in mcg, the unit the blend is dosed in, and says what comes next', () => {
    render(<DoseTimelineChart model={modelOf('mod-grf-1-29')} now={now} color={color} unit="mcg" />)
    expect(screen.getByText('mcg')).toBeInTheDocument()
    // Next: tonight's shot after midnight, 150 of each, still planned.
    expect(screen.getByText(/Próxima · mar 6 oct, 01:00/)).toBeInTheDocument()
    expect(screen.getByText('150 + 150 mcg')).toBeInTheDocument()
    expect(screen.getByText(/Prevista/)).toBeInTheDocument()
  })

  it('marks the step-up of the titration on the chart', () => {
    render(<DoseTimelineChart model={modelOf('mod-grf-1-29')} now={now} color={color} unit="mcg" />)
    // The plan started at 100 mcg and steps up to 150 today; the next step is beyond the range.
    expect(screen.getByText('▸ 100 mcg')).toBeInTheDocument()
    expect(screen.getByText('↑ 150 mcg')).toBeInTheDocument()
    expect(screen.getByText('Ahora')).toBeInTheDocument()
  })

  it('shows the readout of whatever is selected with the keyboard', () => {
    const { container } = render(
      <DoseTimelineChart model={modelOf('mod-grf-1-29')} now={now} color={color} unit="mcg" />,
    )
    const svg = container.querySelector('svg')!
    fireEvent.keyDown(svg, { key: 'Home' })
    // The first administration of the window: taken on time, a night shot after midnight.
    expect(screen.getByText(/A su hora/)).toBeInTheDocument()
    expect(screen.getByText('100 + 100 mcg')).toBeInTheDocument()
    fireEvent.keyDown(svg, { key: 'ArrowRight' })
    // The second is the night nobody covered.
    expect(screen.getAllByText(/Perdida/).length).toBeGreaterThan(0)
    fireEvent.keyDown(svg, { key: 'Escape' })
    expect(screen.getByText(/Próxima ·/)).toBeInTheDocument()
  })

  it('starts the arrow keys at the next dose', () => {
    const { container } = render(
      <DoseTimelineChart model={modelOf('mod-grf-1-29')} now={now} color={color} unit="mcg" />,
    )
    const svg = container.querySelector('svg')!
    fireEvent.keyDown(svg, { key: 'ArrowRight' })
    expect(screen.getByText(/Prevista/)).toBeInTheDocument()
    expect(screen.getByText(/mar 6 oct, 01:00/)).toBeInTheDocument()
    fireEvent.keyDown(svg, { key: 'ArrowLeft' })
    // One step back from the next dose is the night nobody covered or the last one taken.
    expect(screen.queryByText(/Prevista/)).toBeNull()
  })

  it('shrinks the heads when twelve weeks are packed in', () => {
    const wide = render(
      <DoseTimelineChart
        model={modelOf('mod-grf-1-29', '12w')}
        now={now}
        color={color}
        unit="mcg"
      />,
    )
    const r12 = Number(
      wide.container.querySelector('[data-state="taken"] circle')?.getAttribute('r'),
    )
    cleanup()
    const week = render(
      <DoseTimelineChart
        model={modelOf('mod-grf-1-29', '7d')}
        now={now}
        color={color}
        unit="mcg"
      />,
    )
    const r7 = Number(
      week.container.querySelector('[data-state="taken"] circle')?.getAttribute('r'),
    )
    expect(r12).toBeLessThan(r7)
    expect(r12).toBeGreaterThanOrEqual(2)
  })
})

describe('DoseTimelineChart · every kind of mark', () => {
  const MOTS: ProtocolLike = {
    compoundId: 'mots-c',
    startDate: '2026-09-07',
    times: ['07:00'],
    steps: [{ doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null }],
  }
  const at = (d: number, h: number, m = 0) => new Date(2026, 8, d, h, m)
  const history: DoseEvent[] = [
    { at: at(21, 7, 3), mg: 1 }, // Mon on time
    { at: at(23, 10, 30), mg: 1 }, // Wed 3 h 30 late
    { at: at(20, 12), mg: 1 }, // Sunday: outside the plan
  ]
  // Friday 25 Sep 2026, 08:00: the 07:00 shot is due and still open; Mon 14, Wed 16 and Fri 18
  // were never taken.
  const clock = at(25, 8)
  const model = buildTimeline({
    protocol: MOTS,
    history,
    from: at(14, 0),
    to: at(30, 0),
    now: clock,
  })
  const color = 'var(--sub-sky)'

  it('gives each state its own head', () => {
    const { container } = render(
      <DoseTimelineChart model={model} now={clock} color={color} unit="mg" />,
    )
    const s = states(container)
    for (const state of ['taken', 'late', 'extra', 'missed', 'due', 'planned']) {
      expect(s, state).toContain(state)
    }
    const head = (state: string) => container.querySelector(`[data-state="${state}"]`)!
    // Late: a filled head inside an amber ring. Extra: a diamond. Missed: a red outline.
    expect(head('late').querySelector('circle[stroke="var(--warn)"]')).not.toBeNull()
    expect(head('extra').querySelector('rect')).not.toBeNull()
    expect(head('missed').querySelector('circle[stroke="var(--danger)"]')).not.toBeNull()
    expect(head('due').querySelector('circle[stroke="var(--warn)"]')).not.toBeNull()
    expect(head('planned').querySelector('circle[fill="var(--panel)"]')).not.toBeNull()
  })

  it('tells how late a late dose was', () => {
    const { container } = render(
      <DoseTimelineChart model={model} now={clock} color={color} unit="mg" />,
    )
    const svg = container.querySelector('svg')!
    const idx = model.items.findIndex((i) => i.state === 'late')
    fireEvent.keyDown(svg, { key: 'Home' })
    for (let i = 0; i < idx; i++) fireEvent.keyDown(svg, { key: 'ArrowRight' })
    expect(screen.getByText(/Tarde · \+3 h 30/)).toBeInTheDocument()
  })

  it('says so when nothing was taken in the range', () => {
    const empty = buildTimeline({
      protocol: null,
      history: [],
      from: at(14, 0),
      to: at(28, 0),
      now: clock,
    })
    render(<DoseTimelineChart model={empty} now={clock} color={color} unit="mg" />)
    expect(screen.getByText('Sin tomas en este periodo')).toBeInTheDocument()
  })

  it('keeps the labelled image for assistive technology', () => {
    render(<DoseTimelineChart model={model} now={clock} color={color} unit="mg" />)
    expect(
      screen.getByRole('img', { name: /Línea de tomas\. Tomadas: 3, perdidas: 3, por venir: 2/ }),
    ).toBeInTheDocument()
  })
})
