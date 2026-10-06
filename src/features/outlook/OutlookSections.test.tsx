import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import type { MeasureItem } from '@/content/outlook'
import { outlookFor } from '@/content/outlook'
import type { ProtocolRow } from '@/data/database.types'
import i18n from '@/i18n'
import { MeasureSection } from './MeasureSection'
import { NoDataSection } from './NoDataSection'
import { Headline } from './OutlookHero'
import { buildModel, measureStatus } from './outlookModel'
import { personalTrend } from './outlook'
import { useFormat } from './outlookFormat'

const now = new Date(2026, 9, 4, 20, 30) // Sunday 4 Oct 2026

const scope = { patientId: 'p', patient: null, isSelf: true, readOnly: false, canPrescribe: false }
const wrapper = ({ children }: { children: ReactNode }) => (
  <PatientScopeProvider value={scope}>{children}</PatientScopeProvider>
)
const formatter = () => renderHook(() => useFormat(), { wrapper }).result.current
const flat = (s: string | null) => (s ?? '').replace(/[  ]/g, ' ')

function protocol(p: Partial<ProtocolRow> & Pick<ProtocolRow, 'id' | 'compound_id'>): ProtocolRow {
  return {
    patient_id: 'p',
    created_by: null,
    name: p.compound_id,
    route: 'sc',
    unit: 'mg',
    start_date: '2026-09-07',
    time_of_day: '09:00',
    times: ['09:00'],
    steps: [{ doseMg: 2.5, intervalDays: 7, durationWeeks: null }],
    components: [],
    status: 'active',
    template_id: null,
    notes: null,
    created_at: '',
    updated_at: '',
    ...p,
  }
}

const item = (id: string, target: MeasureItem['target'], hint?: string): MeasureItem => ({
  id,
  label: { es: `Etiqueta ${id}`, en: `Label ${id}` },
  ...(hint ? { hint: { es: hint, en: hint } } : {}),
  target,
})

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('Headline', () => {
  const model = buildModel([protocol({ id: 'reta', compound_id: 'retatrutide' })], now, 6)
  const weights = [
    { at: new Date(2026, 8, 7), kg: 80 },
    { at: new Date(2026, 8, 20), kg: 79 },
    { at: new Date(2026, 9, 3), kg: 78 },
  ]

  it('says the range at the horizon as one big number, in kilos on the starting weight', () => {
    const f = formatter()
    render(
      <Headline
        f={f}
        horizon={6}
        onHorizon={() => undefined}
        now={now}
        trials={model.trialItems}
        trend={personalTrend(weights, new Date(2026, 8, 7), now)}
      />,
    )
    expect(screen.getByText('Cambio de peso en 6 meses · 4 abr 2027')).toBeInTheDocument()
    expect(screen.getByText(/−\d+ % a −\d+ %/)).toBeInTheDocument()
    expect(flat(screen.getByText(/≈ .* kg sobre tus 80,0 kg/).textContent)).toMatch(/−\d+,\d kg/)
  })

  it('puts the person on the scale of the trial: the band, placebo and where he is today', () => {
    const f = formatter()
    const { container } = render(
      <Headline
        f={f}
        horizon={6}
        onHorizon={() => undefined}
        now={now}
        trials={model.trialItems}
        trend={personalTrend(weights, new Date(2026, 8, 7), now)}
      />,
    )
    // 80 kg to 78 kg is −2,5 %.
    const scale = screen.getByRole('img', { name: /Tú hoy: −2,5/ })
    expect(flat(scale.getAttribute('aria-label'))).toContain('Ensayo, semana 24')
    expect(flat(screen.getByText(/^tú /).textContent)).toBe('tú −2,5 %')
    expect(container.querySelector('[data-part="band"]')).not.toBeNull()
    expect(container.querySelector('[data-part="placebo"]')).not.toBeNull()
    expect(container.querySelector('[data-part="you"]')).not.toBeNull()
    expect(screen.getByText('Ensayo, semana 24')).toBeInTheDocument()
    expect(screen.getByText('Tú hoy')).toBeInTheDocument()
  })

  it('draws the person’s own line forward and flags it as an extrapolation', () => {
    const f = formatter()
    const near = buildModel([protocol({ id: 'reta', compound_id: 'retatrutide' })], now, 3)
    render(
      <Headline
        f={f}
        horizon={3}
        onHorizon={() => undefined}
        now={now}
        trials={near.trialItems}
        trend={personalTrend(weights, new Date(2026, 8, 7), now)}
      />,
    )
    expect(screen.getByText(/Extrapolación/)).toBeInTheDocument()
  })

  it('asks for a weigh-in to put the person on the scale, and offers the other horizons', () => {
    const f = formatter()
    const onHorizon = vi.fn()
    const onLogWeight = vi.fn()
    const { container } = render(
      <Headline
        f={f}
        horizon={6}
        onHorizon={onHorizon}
        now={now}
        trials={model.trialItems}
        trend={null}
        readOnly={false}
        onLogWeight={onLogWeight}
      />,
    )
    expect(container.querySelector('[data-part="you"]')).toBeNull()
    fireEvent.click(
      screen.getByRole('button', { name: 'Registra tu peso para verte en la escala' }),
    )
    expect(onLogWeight).toHaveBeenCalledOnce()
    fireEvent.click(screen.getByRole('tab', { name: '12 meses' }))
    expect(onHorizon).toHaveBeenCalledWith(12)
  })
})

describe('MeasureSection', () => {
  const rows = [
    { kind: 'weight' as const, measured_at: new Date(2026, 8, 20).toISOString() },
    { kind: 'weight' as const, measured_at: new Date(2026, 8, 27).toISOString() },
  ]
  const items = [
    item('weight', { type: 'measurement', kind: 'weight' }, 'Misma báscula'),
    item('waist', { type: 'measurement', kind: 'waist' }),
    item('igf1', { type: 'lab' }),
    item('sleep', { type: 'note' }),
  ]
  const status = measureStatus(items, rows, new Date(2026, 8, 7))

  it('counts what has records out of what can be counted, with a bar of that many segments', () => {
    render(
      <MeasureSection
        f={formatter()}
        status={status}
        since={new Date(2026, 8, 7)}
        readOnly={false}
        onPick={() => undefined}
      />,
    )
    expect(screen.getByText('1 de 2 con registros')).toBeInTheDocument()
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '1')
    expect(screen.getByRole('progressbar').children).toHaveLength(2)
    expect(screen.getByText('Registros desde el 7 sep')).toBeInTheDocument()
  })

  it('says each thing: how many records, what is pending, where labs and notes go', () => {
    render(
      <MeasureSection
        f={formatter()}
        status={status}
        since={new Date(2026, 8, 7)}
        readOnly={false}
        onPick={() => undefined}
      />,
    )
    expect(screen.getByText('2 registros')).toBeInTheDocument()
    expect(screen.getByText('Registrar')).toBeInTheDocument()
    expect(screen.getByText('Analítica')).toBeInTheDocument()
    expect(screen.getByText('Notas')).toBeInTheDocument()
    expect(screen.getByText('Misma báscula')).toBeInTheDocument()
  })

  it('opens what is tapped, except notes, which have nowhere to go', () => {
    const onPick = vi.fn()
    render(
      <MeasureSection
        f={formatter()}
        status={status}
        since={new Date(2026, 8, 7)}
        readOnly={false}
        onPick={onPick}
      />,
    )
    expect(screen.getAllByRole('button')).toHaveLength(3)
    fireEvent.click(screen.getByRole('button', { name: /Etiqueta waist/ }))
    expect(onPick).toHaveBeenCalledWith(items[1])
  })

  it('is only a list for someone who cannot record', () => {
    render(
      <MeasureSection
        f={formatter()}
        status={status}
        since={new Date(2026, 8, 7)}
        readOnly
        onPick={() => undefined}
      />,
    )
    expect(screen.queryAllByRole('button')).toHaveLength(0)
    expect(screen.getByText('Pendiente')).toBeInTheDocument()
  })

  it('draws nothing without anything to measure', () => {
    const { container } = render(
      <MeasureSection
        f={formatter()}
        status={[]}
        since={now}
        readOnly={false}
        onPick={() => undefined}
      />,
    )
    expect(container).toBeEmptyDOMElement()
  })
})

describe('NoDataSection', () => {
  it('says once that there is no human outcome data and lists each compound with its evidence', () => {
    const outlook = outlookFor('mots-c')
    render(
      <NoDataSection
        f={formatter()}
        entries={[
          { compoundId: 'mots-c', outlook },
          { compoundId: 'cjc-1295', outlook: outlookFor('cjc-1295') },
        ]}
      />,
    )
    expect(screen.getAllByText(/No hay ensayos con estas dosis/)).toHaveLength(1)
    expect(screen.getByText('MOTS-c')).toBeInTheDocument()
    expect(screen.getAllByText(/Evidencia/)).toHaveLength(2)
  })

  it('draws nothing without compounds', () => {
    const { container } = render(<NoDataSection f={formatter()} entries={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
