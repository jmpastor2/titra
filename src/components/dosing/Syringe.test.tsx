import { act, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { Vial } from '@/components/ui/primitives'
import { Syringe } from './Syringe'

const loads = [
  { from: 0, to: 10, color: 'var(--sub-violet)' },
  { from: 10, to: 15, color: 'var(--sub-mint)' },
]
// 30 U barrel: x = 54 + u / 30 * 232
const xAt = (u: number) => 54 + (u / 30) * 232

const stopperX = (container: HTMLElement) =>
  Number(container.querySelector('rect[fill="#1b2527"]')?.getAttribute('x'))

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe('Syringe', () => {
  it('draws the final state straight away without animation', () => {
    const { container, getByRole } = render(
      <Syringe capacity={30} loads={loads} label="15 U" animate={false} />,
    )
    expect(getByRole('img', { name: '15 U' })).toBeInTheDocument()
    expect(stopperX(container)).toBeCloseTo(xAt(15))
  })

  it('draws up from empty on mount and stops at the total', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame', 'performance'] })
    const { container } = render(<Syringe capacity={30} loads={loads} label="15 U" />)
    expect(stopperX(container)).toBeCloseTo(xAt(0))
    act(() => {
      vi.advanceTimersByTime(2000)
    })
    expect(stopperX(container)).toBeCloseTo(xAt(15))
  })

  it('jumps to the end with prefers-reduced-motion', () => {
    vi.stubGlobal('matchMedia', (q: string) => ({
      matches: q.includes('reduce'),
      media: q,
      addEventListener() {},
      removeEventListener() {},
    }))
    const { container } = render(<Syringe capacity={30} loads={loads} label="15 U" />)
    expect(stopperX(container)).toBeCloseTo(xAt(15))
  })
})

describe('Vial', () => {
  it('renders liquid, powder and blend variants', () => {
    const liquid = render(<Vial color="var(--sub-mint)" fill={0.5} size={64} low />)
    expect(liquid.container.querySelector('svg')).toHaveAttribute('width', '40')
    expect(liquid.container.querySelector('circle[fill="var(--warn)"]')).not.toBeNull()

    const powder = render(<Vial color="var(--sub-mint)" state="powder" size={48} />)
    expect(powder.container.querySelector('pattern')).toBeNull()

    const blend = render(
      <Vial color="var(--sub-mint)" colors={['var(--sub-mint)', 'var(--sub-violet)']} />,
    )
    expect(blend.container.querySelectorAll('pattern rect')).toHaveLength(2)
  })
})
