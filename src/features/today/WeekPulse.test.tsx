import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import type { DoseRow, ProtocolRow } from '@/data/database.types'
import { weekPlanVsActual, summariseWeek } from '@/features/doses/week'
import '@/i18n'
import { WeekGrid, WeekRing } from './WeekPulse'

const cjc: ProtocolRow = {
  id: 'cjc',
  patient_id: 'u',
  created_by: 'u',
  compound_id: 'mod-grf-1-29',
  name: 'CJC-1295 + Ipamorelina',
  route: 'sc',
  unit: 'mcg',
  start_date: '2026-09-21',
  time_of_day: '22:00',
  times: ['22:00'],
  steps: [{ doseMg: 0.1, intervalDays: 1, weekdays: [1, 2, 3, 4, 5], durationWeeks: null }],
  components: [{ compoundId: 'ipamorelin', doseMg: 0.1 }],
  status: 'active',
  template_id: null,
  notes: null,
  created_at: '',
  updated_at: '',
}
const dose = (iso: string): DoseRow => ({
  id: iso,
  patient_id: 'u',
  protocol_id: 'cjc',
  compound_id: 'mod-grf-1-29',
  dose_mg: 0.1,
  administered_at: new Date(iso).toISOString(),
  site_id: null,
  inventory_id: null,
  batch_id: null,
  notes: null,
  created_at: '',
})

describe('WeekPulse', () => {
  it('renders the last seven days with an extra dose', () => {
    const now = new Date('2026-09-26T03:00')
    const days = weekPlanVsActual(
      [cjc],
      [
        '2026-09-21T22:05',
        '2026-09-22T22:10',
        '2026-09-23T22:00',
        '2026-09-24T22:04',
        '2026-09-26T00:02',
        '2026-09-26T02:40',
      ].map(dose),
      new Date('2026-09-20T00:00'),
      now,
    )
    render(
      <>
        <WeekRing summary={summariseWeek(days)} extras={1} />
        <WeekGrid days={days} protocols={[cjc]} now={now} />
      </>,
    )
    expect(screen.getByText('CJC-1295 + Ipamorelina')).toBeTruthy()
    expect(screen.getByText(/\+1/)).toBeTruthy()
  })
})
