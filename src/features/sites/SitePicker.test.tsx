import { fireEvent, render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { t } from 'i18next'
import { SitePicker } from './SitePicker'

const now = new Date(2026, 8, 28, 8, 5)
const history = [
  { siteId: 'abd_ul', at: new Date(2026, 8, 28, 8, 0), compoundId: 'retatrutide' },
  { siteId: 'thigh_l', at: new Date(2026, 8, 20, 22, 0), compoundId: 'ipamorelin' },
]
const point = (id: string) =>
  screen.getByRole('button', { name: new RegExp(t(`sites.labels.${id}`)) })

describe('SitePicker', () => {
  it('lists every point by zone a tap away, and clears when tapping the chosen one again', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <SitePicker value="" onChange={onChange} history={history} now={now} />,
    )
    const all = screen.getByRole('button', { name: t('sites.allPoints') })
    expect(all).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(all)
    for (const zone of ['abdomen', 'thigh', 'flank', 'glute', 'arm'])
      expect(screen.getByRole('group', { name: t(`sites.zones.${zone}`) })).toBeInTheDocument()
    fireEvent.click(point('flank_r'))
    expect(onChange).toHaveBeenLastCalledWith('flank_r')

    rerender(<SitePicker value="flank_r" onChange={onChange} history={history} now={now} />)
    expect(point('flank_r')).toHaveAttribute('aria-pressed', 'true')
    fireEvent.click(point('flank_r'))
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('opens the list when the chosen point is not a suggestion', () => {
    render(<SitePicker value="glute_l" onChange={() => {}} history={history} now={now} />)
    expect(screen.getByRole('button', { name: t('sites.allPoints') })).toHaveAttribute(
      'aria-expanded',
      'true',
    )
  })

  it('offers three suggestions, never the site used minutes ago', () => {
    const onChange = vi.fn()
    render(<SitePicker value="" onChange={onChange} history={history} now={now} />)
    const chips = within(screen.getByRole('group', { name: t('sites.next') })).getAllByRole(
      'button',
    )
    expect(chips).toHaveLength(3)
    const usedLabel = t('sites.labels.abd_ul')
    for (const c of chips) expect(c).not.toHaveTextContent(usedLabel)
    fireEvent.click(chips[0]!)
    expect(onChange).toHaveBeenCalledTimes(1)
  })

  it('warns when the selected site is still resting', () => {
    render(<SitePicker value="abd_ul" onChange={() => {}} history={history} now={now} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('does not warn for a rested site', () => {
    render(<SitePicker value="thigh_l" onChange={() => {}} history={history} now={now} />)
    expect(screen.queryByRole('status')).toBeNull()
  })
})
