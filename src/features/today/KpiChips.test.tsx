import { cleanup, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { KpiChips } from './KpiChips'
import { coverTone, type DayVerdict } from './kpis'

const trail: DayVerdict[] = ['done', 'done', 'rest', 'done', 'done', 'broken', 'open']

type Props = Parameters<typeof KpiChips>[0]
const base: Props = {
  streak: 8,
  trail,
  adherence: 0.92,
  week: { taken: 11, planned: 12 },
  cycle: { name: 'CJC-1295 + Ipamorelina', week: 2, total: 12, rest: false },
  cover: { days: 15, compoundIds: ['mots-c'] },
}

function show(over: Partial<Props> = {}) {
  return render(
    <MemoryRouter>
      <KpiChips {...base} {...over} />
    </MemoryRouter>,
  )
}
const chip = (label: string) => screen.getByText(label).closest('a')!

beforeAll(async () => {
  await i18n.changeLanguage('es')
})
afterEach(cleanup)

describe('KpiChips', () => {
  it('answers the four questions, each chip a link to where it is worked on', () => {
    show()
    expect(within(chip('Racha')).getByText('8')).toBeInTheDocument()
    expect(chip('Racha')).toHaveTextContent('8días')
    expect(chip('Racha')).toHaveAttribute('href', '/log')
    expect(chip('Adherencia')).toHaveTextContent('92 %')
    expect(chip('Adherencia')).toHaveTextContent('11 de 12 tomas en 7 días')
    expect(chip('Semana del ciclo')).toHaveTextContent('2/12')
    expect(chip('Semana del ciclo')).toHaveTextContent('CJC-1295 + Ipamorelina')
    expect(chip('Semana del ciclo')).toHaveAttribute('href', '/cycles')
    expect(chip('Stock para')).toHaveTextContent('15días')
    expect(chip('Stock para')).toHaveTextContent('MOTS-c')
    expect(chip('Stock para')).toHaveAttribute('href', '/inventory')
  })

  it('describes the last seven days to a screen reader', () => {
    show()
    expect(screen.getByRole('img', { name: 'Últimos 7 días: 4 completos' })).toBeInTheDocument()
  })

  it('says "1 día" for a streak of one, and says there is none when it is zero', () => {
    show({ streak: 1 })
    expect(chip('Racha')).toHaveTextContent('1día')
    cleanup()
    show({ streak: 0 })
    expect(chip('Racha')).toHaveTextContent('sin racha ahora')
  })

  it('leaves out the chips with nothing to say', () => {
    show({ adherence: null, cycle: null, cover: null })
    expect(screen.queryByText('Adherencia')).toBeNull()
    expect(screen.queryByText('Semana del ciclo')).toBeNull()
    expect(screen.queryByText('Stock para')).toBeNull()
    expect(screen.getByText('Racha')).toBeInTheDocument()
  })

  it('reads an open titration as a bare week, and a rest week as such', () => {
    show({ cycle: { name: 'Retatrutida', week: 4, total: null, rest: false } })
    expect(chip('Semana del ciclo')).toHaveTextContent('4')
    expect(chip('Semana del ciclo')).not.toHaveTextContent('/')
    cleanup()
    show({ cycle: { name: 'Retatrutida', week: 6, total: 8, rest: true } })
    expect(chip('Descanso del ciclo')).toHaveTextContent('6/8')
  })

  it('counts months once the supply outlasts a hundred days, and says "all covered" past the horizon', () => {
    show({ cover: { days: 150, compoundIds: ['mots-c'] } })
    expect(chip('Stock para')).toHaveTextContent('5meses')
    cleanup()
    show({ cover: { days: null, compoundIds: [] } })
    expect(chip('Stock para')).toHaveTextContent('+8meses')
    expect(chip('Stock para')).toHaveTextContent('Todo cubierto')
  })

  it('lights a short supply in amber and a very short one in rose', () => {
    expect(coverTone(60)).toBe('ok')
    expect(coverTone(30)).toBe('warn')
    expect(coverTone(14)).toBe('danger')
    show({ cover: { days: 9, compoundIds: ['mots-c'] } })
    expect(within(chip('Stock para')).getByText('9')).toHaveClass('text-danger')
  })

  it('is only a reading, with no links, in a shared view', () => {
    show({ linked: false })
    expect(screen.queryByRole('link')).toBeNull()
    expect(screen.getByText('Racha')).toBeInTheDocument()
  })

  it('lets the last chip take the whole row when the count is odd', () => {
    show({ cycle: null })
    expect(chip('Stock para').className).toContain('col-span-2')
  })

  it('reads in English too', async () => {
    await i18n.changeLanguage('en')
    show()
    expect(chip('Streak')).toHaveTextContent('8days')
    expect(chip('Supply for')).toHaveTextContent('15days')
    expect(screen.getByRole('img', { name: 'Last 7 days: 4 complete' })).toBeInTheDocument()
    await i18n.changeLanguage('es')
  })
})
