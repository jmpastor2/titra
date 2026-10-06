import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { VialLabelInput } from './VialLabelInput'

describe('vial label input', () => {
  it('reports what is typed, with any line break turned into a space', () => {
    const onChange = vi.fn()
    render(
      <VialLabelInput
        id="l"
        describedBy={undefined}
        value=""
        onChange={onChange}
        placeholder="p"
      />,
    )
    fireEvent.change(screen.getByRole('textbox'), { target: { value: 'CJC-1295\nIpamorelina' } })
    expect(onChange).toHaveBeenCalledWith('CJC-1295 Ipamorelina')
  })

  it('finishes on Enter instead of adding a line', () => {
    render(
      <VialLabelInput
        id="l"
        describedBy={undefined}
        value="x"
        onChange={() => {}}
        placeholder="p"
      />,
    )
    const notPrevented = fireEvent.keyDown(screen.getByRole('textbox'), { key: 'Enter' })
    expect(notPrevented).toBe(false)
  })
})
