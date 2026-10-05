// TEMPORARY visual harness for TrendChart (deleted before finishing). Not part of the app.
import { addDays, startOfDay } from 'date-fns'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import '@/i18n'
import '@/styles/globals.css'
import { Card } from '@/components/ui/Card'
import { bootTheme } from '@/lib/theme'
import { ema } from '@/features/health/trend'
import { ProtocolStrip } from '@/features/health/ProgressCharts'
import { TREND_INSET } from './chartScale'
import { TrendChart, type TrendGuide, type TrendPoint, type TrendShade } from './TrendChart'

bootTheme()

const NOW = new Date(2026, 9, 5, 9, 0)
const DAY = 86_400_000
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const series = (n: number, every: number, f: (i: number) => number, seed = 1): TrendPoint[] => {
  const r = rng(seed)
  return Array.from({ length: n }, (_, i) => ({
    at: new Date(NOW.getTime() - (n - 1 - i) * every * DAY - r() * 3_600_000 * 2),
    value: f(i) + (r() - 0.5) * 0.9,
  }))
}
const win = (days: number): [number, number] => [
  startOfDay(addDays(NOW, -days)).getTime(),
  startOfDay(addDays(NOW, 1)).getTime(),
]
const weekly = (from: number, n: number, step = 0.25, first = 1): TrendGuide[] =>
  Array.from({ length: n }, (_, i) => ({
    at: startOfDay(addDays(new Date(from), 7 * (i + 1))).getTime(),
    color: 'var(--sub-mint)',
    label: `${(first + i * step).toFixed(2).replace('.', ',').replace(/,?0+$/, '')} mg`,
  }))

const w3m = win(90)
const w1m = win(30)
const weights3m = series(16, 5.5, (i) => 80.5 - i * 0.28)
const weights1m = series(9, 3.4, (i) => 78.3 - i * 0.25, 4)
const weightsYear = series(120, 3, (i) => 92 - i * 0.12 + Math.sin(i / 7) * 0.8, 9)
const dayScores = (seed: number, base: number) =>
  series(26, 1.1, (i) => Math.max(1, Math.min(10, base + Math.sin(i / 3) * 1.6)), seed).map(
    (p) => ({
      ...p,
      value: Math.round(p.value),
    }),
  )

const pauseShade: TrendShade[] = [
  {
    from: addDays(NOW, -40).getTime(),
    to: addDays(NOW, -26).getTime(),
    color: 'var(--sub-violet)',
  },
]
const lane = {
  id: 'p1',
  compoundId: 'retatrutide',
  name: 'Retatrutida',
  unit: 'mg',
  maxDoseMg: 2.5,
  changes: [],
  segments: [
    {
      start: new Date(w3m[0] + 20 * DAY),
      end: new Date(w3m[0] + 50 * DAY),
      doseMg: 1,
      pause: false,
      index: 0,
    },
    {
      start: new Date(w3m[0] + 50 * DAY),
      end: new Date(w3m[1]),
      doseMg: 2,
      pause: false,
      index: 1,
    },
  ],
}

type Case = { id: string; title: string; node: () => React.ReactNode }
const cases: Case[] = [
  {
    id: 'weight-3m',
    title: 'weight 3m, trend, labelled weekly guides, pause, target (strip above)',
    node: () => {
      const gs = weekly(w3m[0] + 20 * DAY, 10)
      return (
        <>
          <ProtocolStrip
            lanes={[lane]}
            span={{ from: new Date(w3m[0]), to: new Date(w3m[1]) }}
            inset={TREND_INSET}
            showDates
          />
          <TrendChart
            points={weights3m}
            smooth={ema(weights3m)}
            smoothLabel="Tendencia"
            unit="kg"
            digits={1}
            xDomain={w3m}
            guides={gs}
            shades={pauseShade}
            target={72}
            label="Peso"
          />
        </>
      )
    },
  },
  {
    id: 'weight-1m',
    title: 'weight 1m, trend, 4 labelled guides',
    node: () => (
      <TrendChart
        points={weights1m}
        smooth={ema(weights1m)}
        smoothLabel="Tendencia"
        unit="kg"
        digits={1}
        xDomain={w1m}
        guides={weekly(w1m[0] + 2 * DAY, 4, 0.25, 1.25)}
        target={72}
        label="Peso"
      />
    ),
  },
  {
    id: 'multiples',
    title: 'wellbeing multiples (96 px, 0-10, no labels)',
    node: () => (
      <>
        {[
          ['Energía', 8, 11],
          ['Sueño', 6, 12],
        ].map(([name, base, seed]) => (
          <div key={String(name)} className="mb-3">
            <div className="spec">{name}</div>
            <TrendChart
              points={dayScores(Number(seed), Number(base))}
              unit="/10"
              height={96}
              digits={0}
              range={[0, 10]}
              xDomain={w1m}
              guides={[{ at: addDays(NOW, -12).getTime(), color: 'var(--sub-mint)' }]}
              shades={pauseShade}
            />
          </div>
        ))}
      </>
    ),
  },
  {
    id: 'lab-two',
    title: 'lab: 2 points, range 4.0-5.6 (HbA1c %), 140 px',
    node: () => (
      <TrendChart
        points={[
          { at: addDays(NOW, -95), value: 5.2 },
          { at: addDays(NOW, -4), value: 5.5 },
        ]}
        unit="%"
        digits={1}
        height={140}
        refRange={{ low: 4, high: 5.6 }}
      />
    ),
  },
  {
    id: 'lab-three',
    title: 'lab: 3 points, one-sided range (glucose < 100 mg/dL)',
    node: () => (
      <TrendChart
        points={[
          { at: addDays(NOW, -200), value: 92 },
          { at: addDays(NOW, -110), value: 104 },
          { at: addDays(NOW, -12), value: 97 },
        ]}
        unit="mg/dL"
        digits={0}
        height={140}
        refRange={{ low: null, high: 100 }}
      />
    ),
  },
  {
    id: 'lab-one',
    title: 'lab: single reading with a range',
    node: () => (
      <TrendChart
        points={[{ at: addDays(NOW, -3), value: 5.5 }]}
        unit="%"
        digits={1}
        height={140}
        refRange={{ low: 4, high: 5.6 }}
      />
    ),
  },
  {
    id: 'hours',
    title: 'two readings the same day',
    node: () => (
      <TrendChart
        points={[
          { at: new Date(2026, 9, 5, 8, 10), value: 77.6 },
          { at: new Date(2026, 9, 5, 21, 40), value: 77.1 },
        ]}
        unit="kg"
        digits={1}
      />
    ),
  },
  {
    id: 'flat',
    title: 'flat series',
    node: () => (
      <TrendChart
        points={series(8, 3, () => 77.2).map((p) => ({ ...p, value: 77.2 }))}
        unit="kg"
        digits={1}
        height={140}
      />
    ),
  },
  {
    id: 'year',
    title: '365 days, trend',
    node: () => (
      <TrendChart
        points={weightsYear}
        smooth={ema(weightsYear)}
        smoothLabel="Tendencia"
        unit="kg"
        digits={1}
        xDomain={win(365)}
        target={80}
        label="Peso"
      />
    ),
  },
  {
    id: 'cycle12w',
    title: '12 weeks, weekly changes labelled, trend',
    node: () => {
      const w = win(84)
      const pts = series(24, 3.5, (i) => 84 - i * 0.22, 21)
      return (
        <TrendChart
          points={pts}
          smooth={ema(pts)}
          smoothLabel="Tendencia"
          unit="kg"
          digits={1}
          xDomain={w}
          guides={weekly(w[0], 12)}
        />
      )
    },
  },
  { id: 'empty', title: 'no readings', node: () => <TrendChart points={[]} unit="kg" /> },
]

const only = new URLSearchParams(location.search).get('only')?.split(',')
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="mx-auto flex max-w-[640px] flex-col gap-3 px-4 py-4">
      {cases
        .filter((c) => !only || only.includes(c.id))
        .map((c) => (
          <Card key={c.id} padded={false} className="p-3.5">
            <div className="spec mb-2 normal-case">{c.title}</div>
            {c.node()}
          </Card>
        ))}
    </main>
  </StrictMode>,
)
