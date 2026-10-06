import { cleanup, fireEvent, render, renderHook, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { OUTLOOK, type TrialOutlook } from '@/content/outlook'
import i18n from '@/i18n'
import { bandSeries } from './outlook'
import { OutlookChart, type AxisPoint } from './OutlookChart'
import { useFormat } from './outlookFormat'

const RETA = (OUTLOOK.retatrutide as TrialOutlook).reference
const series = bandSeries(RETA, 2.5)

const scope = { patientId: 'p', patient: null, isSelf: true, readOnly: false, canPrescribe: false }
const wrapper = ({ children }: { children: ReactNode }) => (
  <PatientScopeProvider value={scope}>{children}</PatientScopeProvider>
)

const me: AxisPoint[] = [
  { week: 0, pct: 0, kg: 77.5, at: new Date(2026, 8, 14) },
  { week: 2.1, pct: -0.6, kg: 77, at: new Date(2026, 8, 28) },
  { week: 3.2, pct: -1, kg: 76.7, at: new Date(2026, 9, 5) },
]
const projection: AxisPoint[] = [
  { week: 3.2, pct: -1 },
  { week: 30.4, pct: -8.2, kg: 71.2 },
]

function chart(over: Partial<React.ComponentProps<typeof OutlookChart>> = {}) {
  const { result } = renderHook(() => useFormat(), { wrapper })
  return render(
    <OutlookChart
      f={result.current}
      color="var(--sub-mint)"
      series={series}
      todayWeeks={3.2}
      targetWeeks={30.4}
      horizon={6}
      me={me}
      projection={projection}
      {...over}
    />,
  )
}
const svgOf = (c: HTMLElement) => c.querySelector('svg')!
const reads = (c: HTMLElement) => c.querySelector('[aria-live]')?.textContent ?? ''
const flat = (s: string) => s.replace(/ /g, ' ')

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('OutlookChart · what it says', () => {
  it('describes itself: where you are, what the trial observed, what you did and where the line goes', () => {
    const { container } = chart()
    const name = flat(svgOf(container).getAttribute('aria-label') ?? '')
    expect(name).toContain('Hoy vas por la semana 3.')
    expect(name).toContain('A las 48 semanas, el ensayo observó −8,7 % a −17,1 % de peso.')
    expect(name).toContain('Tu último pesaje: −1,0 % desde el inicio.')
    expect(name).toContain('llegaría a −8,2 % en la semana 30')
    expect(name).toContain('es una extrapolación')
  })

  it('describes only what is there when the person has not weighed in', () => {
    const { container } = chart({ me: [], projection: [] })
    const name = svgOf(container).getAttribute('aria-label') ?? ''
    expect(name).toContain('Hoy vas por la semana 3.')
    expect(name).not.toMatch(/pesaje|tendencia/i)
    expect(screen.queryByText('Tus pesajes')).toBeNull()
    expect(screen.queryByText('Tu tendencia')).toBeNull()
  })

  it('has a legend for what is drawn, and says the dots are the published data', () => {
    chart()
    expect(screen.getByText('Franja del ensayo')).toBeInTheDocument()
    expect(screen.queryByText('Placebo')).toBeNull()
    expect(screen.getByText('Tus pesajes')).toBeInTheDocument()
    expect(screen.getByText('Tu tendencia')).toBeInTheDocument()
    expect(screen.getByText(/Los puntos son datos publicados/)).toBeInTheDocument()
  })
})

describe('OutlookChart · what it draws', () => {
  it('draws the band, the published points, the weigh-ins joined by a line, and the line forward', () => {
    const { container } = chart()
    expect(container.querySelector('path[fill-opacity="0.18"]')?.getAttribute('d')).toMatch(/Z$/)
    // Two published time points, a dot at each end of the band.
    expect(container.querySelectorAll('[data-part="published"] circle')).toHaveLength(4)
    expect(container.querySelectorAll('[data-part="me"] circle')).toHaveLength(3)
    expect(container.querySelector('[data-part="me-line"]')).not.toBeNull()
    expect(
      container.querySelector('[data-part="projection"]')?.getAttribute('stroke-dasharray'),
    ).toBe('5 4')
  })

  it('writes where the line forward ends, beside its last point', () => {
    const { container } = chart()
    const end = container.querySelector('[data-part="projection-end"]')
    expect(end?.querySelector('circle')).not.toBeNull()
    expect(flat(end?.textContent ?? '')).toBe('−8 %')
  })

  it('draws no line, end point or label for a person who has not weighed in', () => {
    const { container } = chart({ me: [], projection: [] })
    expect(container.querySelector('[data-part="me-line"]')).toBeNull()
    expect(container.querySelector('[data-part="projection"]')).toBeNull()
    expect(container.querySelector('[data-part="projection-end"]')).toBeNull()
  })

  it('marks today, and the horizon when it is ahead', () => {
    const { container } = chart()
    expect(container.querySelector('[data-part="today"]')).not.toBeNull()
    expect(container.querySelector('[data-part="horizon"]')).not.toBeNull()
    expect(screen.getByText('hoy')).toBeInTheDocument()
    expect(screen.getByText('6 meses')).toBeInTheDocument()
    cleanup()
    const past = chart({ todayWeeks: 40, targetWeeks: 40 })
    expect(past.container.querySelector('[data-part="horizon"]')).toBeNull()
  })

  it('writes the value axis with signs and the week axis in blocks of 12', () => {
    const { container } = chart()
    const labels = [...container.querySelectorAll('text')].map((t) => t.textContent)
    expect(labels).toEqual(
      expect.arrayContaining(['−20', '−10', '0', 's0', 's12', 's24', 's36', 's48']),
    )
    expect(screen.getByText('%')).toBeInTheDocument()
  })

  it('draws a chart with nothing of the person on it', () => {
    const { container } = chart({ me: [], projection: [] })
    expect(container.querySelectorAll('[data-part="me"] circle')).toHaveLength(0)
    expect(container.innerHTML).not.toMatch(/NaN|Infinity|undefined/)
  })

  it('never lets NaN or undefined into the page', () => {
    const { container } = chart({ me: [{ week: Number.NaN, pct: 3 }, ...me] })
    expect(container.innerHTML).not.toMatch(/NaN|Infinity|undefined/)
  })

  it('draws nothing without a band', () => {
    const { container } = chart({ series: [] })
    expect(container.querySelector('svg')).toBeNull()
  })
})

describe('OutlookChart · the readout', () => {
  it('says nothing until something is chosen', () => {
    const { container } = chart()
    expect(reads(container)).toBe('')
    expect(container.querySelector('[data-part="tip"]')).toBeNull()
  })

  it('starts the arrow keys at today: the first thing that is not behind it', () => {
    const { container } = chart()
    const svg = svgOf(container)
    fireEvent.keyDown(svg, { key: 'ArrowRight' })
    // Today is week 3.2, the week of the last weigh-in.
    expect(flat(reads(container))).toBe('Tu pesaje · semana 3, −1,0 %, 76,7 kg · 5 oct 2026')
    expect(container.querySelector('[data-part="cursor"]')).not.toBeNull()
    fireEvent.keyDown(svg, { key: 'ArrowRight' })
    expect(flat(reads(container))).toBe('Ensayo · semana 24, −7,2 % a −12,9 %, placebo −1,6 %')
    fireEvent.keyDown(svg, { key: 'ArrowRight' })
    expect(flat(reads(container))).toMatch(/^Tu tendencia · semana 30/)
  })

  it('walks through the weigh-ins, the published points and the end of the line', () => {
    const { container } = chart()
    const svg = svgOf(container)
    fireEvent.keyDown(svg, { key: 'Home' })
    expect(flat(reads(container))).toBe('Tu pesaje · semana 0, 0,0 %, 77,5 kg · 14 sep 2026')
    fireEvent.keyDown(svg, { key: 'ArrowRight' })
    expect(flat(reads(container))).toMatch(/^Tu pesaje · semana 2, −0,6 %, 77,0 kg · 28 sep 2026/)
    fireEvent.keyDown(svg, { key: 'End' })
    expect(flat(reads(container))).toMatch(/^Ensayo · semana 48, −8,7 % a −17,1 %, placebo −2,1 %/)
    fireEvent.keyDown(svg, { key: 'ArrowLeft' })
    expect(flat(reads(container))).toBe(
      'Tu tendencia · semana 30, −8,2 %, Extrapolación · ≈ 71,2 kg',
    )
    fireEvent.keyDown(svg, { key: 'Escape' })
    expect(reads(container)).toBe('')
    expect(container.querySelector('[data-part="cursor"]')).toBeNull()
  })

  it('rings both ends of the band at a published point, one dot elsewhere', () => {
    const { container } = chart()
    const svg = svgOf(container)
    fireEvent.keyDown(svg, { key: 'End' })
    expect(container.querySelectorAll('[data-part="cursor"] circle')).toHaveLength(2)
    fireEvent.keyDown(svg, { key: 'Home' })
    expect(container.querySelectorAll('[data-part="cursor"] circle')).toHaveLength(1)
  })

  it('keeps what was tapped until a tap somewhere else, in a card beside the cursor', () => {
    const { container } = chart()
    const svg = svgOf(container)
    // The plot runs from about 29 px to 308 px: week 24 is at about 168 px.
    fireEvent.pointerDown(svg, { clientX: 168, pointerType: 'touch' })
    expect(flat(reads(container))).toMatch(/^Ensayo · semana 24/)
    expect(container.querySelector('[data-part="tip"]')?.textContent).toMatch(/−7,2.*−12,9/)
    fireEvent.pointerUp(svg, { clientX: 168, pointerType: 'touch' })
    expect(container.querySelector('[data-part="cursor"]')).not.toBeNull()
    fireEvent.pointerDown(document.body, { pointerType: 'touch' })
    expect(container.querySelector('[data-part="tip"]')).toBeNull()
  })
})

describe('OutlookChart · in English', () => {
  it('reads in English', async () => {
    await i18n.changeLanguage('en')
    const { container } = chart()
    expect(flat(svgOf(container).getAttribute('aria-label') ?? '')).toContain(
      'You are in week 3. At 48 weeks the trial observed −8.7% to −17.1% body weight.',
    )
    fireEvent.keyDown(svgOf(container), { key: 'End' })
    expect(flat(reads(container))).toBe('Trial · week 48, −8.7% to −17.1%, placebo −2.1%')
    await i18n.changeLanguage('es')
  })
})
