import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { ExposureCard, ExposureCardSkeleton } from './ExposureCard'
import { deriveExposure } from './useExposure'
import { doseRow, labAccount, weeklyProtocol } from './testData'

// Monday 5 Oct 2026, five past midnight (see testData.ts).
const now = new Date(2026, 9, 5, 0, 5)
const lab = labAccount(now)

beforeAll(async () => {
  await i18n.changeLanguage('es')
  // Everything below is derived from `now` and the card reads its own clock (`x.asOf`). The wall
  // clock is pinned somewhere else entirely, so a read of the real time would fail here at any
  // hour instead of passing only when the real day happens to look like the test's.
  vi.useFakeTimers({ toFake: ['Date'], now: new Date(2031, 2, 15, 13, 0) })
})
afterAll(() => vi.useRealTimers())
afterEach(cleanup)

describe('ExposureCard · long-acting (retatrutide)', () => {
  const x = lab.byId('retatrutide')

  it('shows the dose, the step, the next dose in syringe units and the level on board', () => {
    render(<ExposureCard x={x} vials={lab.vials} showTitle={false} readOnly />)
    expect(screen.getAllByText('1,5 mg').length).toBeGreaterThan(0)
    expect(screen.getByText('L · 09:00')).toBeInTheDocument()
    expect(screen.getByText('Escalón 3 de 7')).toBeInTheDocument()
    // 15 mg in 1.5 mL is 10 mg/mL: 1.5 mg is 15 U, the draw he reads.
    expect(screen.getByText(/15 U/)).toBeInTheDocument()
    expect(screen.getByText('A bordo')).toBeInTheDocument()
    expect(screen.getByText('0,93')).toBeInTheDocument()
    expect(screen.getByText('70 %')).toBeInTheDocument()
    expect(screen.getByText('Nivel estable')).toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Retatrutida' })).toBeNull()
  })

  it('gives the titration block the week, the next change with syringe units and its date', () => {
    render(<ExposureCard x={x} vials={lab.vials} readOnly />)
    expect(screen.getByText('Titulación')).toBeInTheDocument()
    expect(screen.getByText('Semana 4')).toBeInTheDocument()
    expect(screen.getByText(/Sube a 1,75 mg/)).toBeInTheDocument()
    expect(screen.getByText(/\(17,5 U\)/)).toBeInTheDocument()
    expect(screen.getByText(/lun 12 oct · en 7 días/)).toBeInTheDocument()
    expect(screen.getByText('100 %')).toBeInTheDocument()
    expect(screen.getByText('3 de 3 tomas')).toBeInTheDocument()
  })

  it('draws the curve with a legend that matches what is drawn', () => {
    const { container } = render(<ExposureCard x={x} vials={lab.vials} readOnly />)
    expect(container.querySelector('svg[role="img"]')).not.toBeNull()
    for (const text of [
      'Histórico',
      'Proyección',
      'Tomada',
      'Prevista',
      'Cambio de dosis',
      'Rango estable',
    ]) {
      expect(screen.getByText(text)).toBeInTheDocument()
    }
  })

  it('switches the range from the selector and keeps the chart', () => {
    const { container } = render(<ExposureCard x={x} vials={lab.vials} readOnly />)
    const tabs = screen.getAllByRole('tab')
    expect(tabs.map((t) => t.textContent)).toEqual(['7 d', '4 sem', '12 sem', 'Ciclo'])
    expect(screen.getByRole('tab', { name: '4 sem' })).toHaveAttribute('aria-selected', 'true')
    const labels = () =>
      [...container.querySelectorAll('svg[role="img"] text')].map((t) => t.textContent)
    const before = labels().join('|')
    fireEvent.click(screen.getByRole('tab', { name: '12 sem' }))
    expect(screen.getByRole('tab', { name: '12 sem' })).toHaveAttribute('aria-selected', 'true')
    expect(labels().join('|')).not.toBe(before)
    fireEvent.click(screen.getByRole('tab', { name: 'Ciclo' }))
    expect(container.querySelector('svg[role="img"]')).not.toBeNull()
  })

  it('offers the log button unless it is read only', () => {
    const onLog = vi.fn()
    render(<ExposureCard x={x} onLogDose={onLog} />)
    fireEvent.click(screen.getByRole('button', { name: 'Registrar toma' }))
    expect(onLog).toHaveBeenCalledOnce()
    cleanup()
    render(<ExposureCard x={x} onLogDose={onLog} readOnly />)
    expect(screen.queryByRole('button', { name: 'Registrar toma' })).toBeNull()
  })

  it('asks for the decision when the dose is about to go up', () => {
    // Friday 9 Oct: the step to 1.75 mg is three days away.
    const soon = labAccount(new Date(2026, 9, 9, 12))
    render(<ExposureCard x={soon.byId('retatrutide')} vials={soon.vials} readOnly />)
    expect(screen.getByText('A decidir')).toBeInTheDocument()
    expect(screen.getByText(/decide si subes o te quedas una semana más/)).toBeInTheDocument()
  })
})

describe('ExposureCard · marks on the level curve', () => {
  // Wednesday 7 Oct 2026, noon: Monday's 09:00 shot was taken a day late and the Monday before was missed.
  const wed = new Date(2026, 9, 7, 12)
  const x = deriveExposure(
    [weeklyProtocol()],
    [
      doseRow(new Date(2026, 8, 21, 9, 5), 1.5),
      // 28 Sep never taken. Saturday: outside the plan.
      doseRow(new Date(2026, 9, 3, 18), 0.5),
      doseRow(new Date(2026, 9, 5, 9, 2), 1.5),
    ],
    wed,
  )[0]!

  it('draws each administration the way the timeline does: taken, extra, missed, planned', () => {
    const { container } = render(<ExposureCard x={x} readOnly />)
    const marks = [...container.querySelectorAll('svg[role="img"] [data-mark]')].map((m) =>
      m.getAttribute('data-mark'),
    )
    for (const state of ['taken', 'extra', 'missed', 'planned']) expect(marks).toContain(state)
    // The legend names them.
    for (const text of ['Tomada', 'Extra', 'Perdida', 'Prevista']) {
      expect(screen.getAllByText(text).length).toBeGreaterThan(0)
    }
  })
})

describe('ExposureCard · no level worth a curve', () => {
  it('draws MOTS-c as a dose timeline, with adherence, the last dose and the plan', () => {
    const x = lab.byId('mots-c')
    const { container } = render(
      <ExposureCard x={x} vials={lab.vials} showTitle={false} readOnly />,
    )
    // A timeline, not a curve: no history/projection legend.
    expect(screen.queryByText('Histórico')).toBeNull()
    expect(screen.getByRole('img', { name: /Línea de tomas/ })).toBeInTheDocument()
    expect(container.querySelectorAll('[data-state]').length).toBeGreaterThan(5)
    expect(screen.getByText('Última toma')).toBeInTheDocument()
    expect(screen.getByText('hace 3 días')).toBeInTheDocument()
    expect(screen.getByText('L X V · 09:00')).toBeInTheDocument()
    expect(screen.getByText(/de .* tomas/)).toBeInTheDocument()
    expect(screen.getByText(/Sin datos farmacocinéticos en humanos/)).toBeInTheDocument()
    // The titration block still tells the week and the step ahead.
    expect(screen.getByText('Titulación')).toBeInTheDocument()
    expect(screen.getByText(/Sube a 1,5 mg/)).toBeInTheDocument()
  })

  it('draws the blend as one series: its own name, both compounds in one dose, in mcg', () => {
    const x = lab.byId('mod-grf-1-29')
    render(<ExposureCard x={x} vials={lab.vials} readOnly />)
    expect(screen.getByRole('heading', { name: 'CJC-1295 + Ipamorelina' })).toBeInTheDocument()
    // 150 mcg of each, drawn as 9 U from the premixed vial.
    expect(screen.getAllByText(/150 \+ 150 mcg/).length).toBeGreaterThan(0)
    expect(screen.getByText(/9 U/)).toBeInTheDocument()
    expect(screen.getByText('mcg')).toBeInTheDocument()
    // The missed night is on the legend and in the counts.
    expect(screen.getByText('Perdida')).toBeInTheDocument()
    expect(screen.getByText(/1 perdida/)).toBeInTheDocument()
  })

  it('reads a short-acting compound with a model as a timeline too (ipamorelin)', () => {
    const x = lab.byId('ipamorelin')
    expect(x.pk?.halfLifeH).toBe(2)
    render(<ExposureCard x={x} vials={lab.vials} readOnly />)
    expect(screen.queryByText('Histórico')).toBeNull()
    expect(screen.getByRole('img', { name: /Línea de tomas/ })).toBeInTheDocument()
    expect(screen.getByText(/Acción corta: una curva suave de nivel engañaría/)).toBeInTheDocument()
  })

  it('offers the cycle range only when there is a plan to follow', () => {
    const free = { ...lab.byId('mots-c'), protocolLike: null, protocol: null, next: null }
    render(<ExposureCard x={free} readOnly />)
    expect(screen.getAllByRole('tab').map((t) => t.textContent)).toEqual(['7 d', '4 sem', '12 sem'])
  })

  it('shows the empty range without breaking', () => {
    const x = lab.byId('mots-c')
    render(<ExposureCard x={x} readOnly />)
    fireEvent.click(screen.getByRole('tab', { name: '7 d' }))
    expect(screen.getByRole('img', { name: /Línea de tomas/ })).toBeInTheDocument()
    const counts = screen.getByText('Tomas · 7 d')
    expect(within(counts.parentElement!).getByText(/tomas/)).toBeInTheDocument()
  })
})

describe('ExposureCardSkeleton', () => {
  it('holds the place of the card while loading', () => {
    const { container } = render(<ExposureCardSkeleton />)
    expect(container.querySelectorAll('.skeleton').length).toBeGreaterThan(3)
  })
})

describe('ExposureCard · edge states', () => {
  const wed = new Date(2026, 9, 7, 12)

  it('draws a protocol with no doses yet without a broken chart', () => {
    const x = deriveExposure([weeklyProtocol()], [], wed)[0]!
    const { container } = render(<ExposureCard x={x} readOnly />)
    expect(container.querySelector('svg[role="img"]')).not.toBeNull()
    expect(screen.getByText('A bordo')).toBeInTheDocument()
    expect(screen.getByText('A bordo').parentElement).toHaveTextContent('0')
    expect(screen.getByText('Titulación')).toBeInTheDocument()
  })

  it('says there are no doses when a timeline has none', () => {
    const mots = deriveExposure(
      [
        weeklyProtocol({
          compound_id: 'mots-c',
          name: 'MOTS-c',
          start_date: '2026-10-05',
          steps: [{ doseMg: 1, intervalDays: 1, weekdays: [1, 3, 5], durationWeeks: null }],
        }),
      ],
      [],
      wed,
    )[0]!
    render(<ExposureCard x={mots} readOnly />)
    expect(screen.getByText('Aún no hay tomas registradas')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: /Línea de tomas/ })).toBeInTheDocument()
  })

  it('draws free doses with no plan as plain taken marks', () => {
    const x = deriveExposure(
      [],
      [
        doseRow(new Date(2026, 9, 3, 9), 0.1, { compound_id: 'ipamorelin', protocol_id: null }),
        doseRow(new Date(2026, 9, 5, 22), 0.1, { compound_id: 'ipamorelin', protocol_id: null }),
      ],
      wed,
    )[0]!
    const { container } = render(<ExposureCard x={x} readOnly />)
    expect(container.querySelectorAll('[data-state="taken"]')).toHaveLength(2)
    expect(screen.getByText(/2 tomas/)).toBeInTheDocument()
    expect(screen.queryByText('Fuera de pauta')).toBeNull()
  })
})
