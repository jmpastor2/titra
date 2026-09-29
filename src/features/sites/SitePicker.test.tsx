import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import '@/i18n'
import { t } from 'i18next'
import { SPOTS } from './bodyMapGeometry'
import { SitePicker } from './SitePicker'

const now = new Date(2026, 8, 28, 8, 5)
const history = [
  { siteId: 'abd_ul', at: new Date(2026, 8, 28, 8, 0), compoundId: 'retatrutide' },
  { siteId: 'thigh_l', at: new Date(2026, 8, 20, 22, 0), compoundId: 'ipamorelin' },
]
const radio = (id: string) => screen.getAllByRole('radio')[SPOTS.findIndex((s) => s.id === id)]!

describe('SitePicker', () => {
  it('selects by tapping a spot and clears when tapping it again', () => {
    const onChange = vi.fn()
    const { rerender } = render(
      <SitePicker value="" onChange={onChange} history={history} now={now} />,
    )
    expect(screen.getAllByRole('radio')).toHaveLength(SPOTS.length)
    fireEvent.click(radio('glute_r'))
    expect(onChange).toHaveBeenLastCalledWith('glute_r')

    rerender(<SitePicker value="glute_r" onChange={onChange} history={history} now={now} />)
    expect(radio('glute_r')).toHaveAttribute('aria-checked', 'true')
    fireEvent.click(radio('glute_r'))
    expect(onChange).toHaveBeenLastCalledWith('')
  })

  it('offers three suggestions, never the site used minutes ago', () => {
    const onChange = vi.fn()
    render(<SitePicker value="" onChange={onChange} history={history} now={now} />)
    const chips = screen.getAllByRole('button', { pressed: false })
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
