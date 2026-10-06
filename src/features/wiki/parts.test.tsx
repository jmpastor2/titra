import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import i18n from '@/i18n'
import { ClampedText } from './parts'

beforeAll(() => i18n.changeLanguage('es'))
afterEach(cleanup)

describe('ClampedText', () => {
  it('shows a short text as it is', () => {
    render(<ClampedText text="Texto breve." />)
    expect(screen.getByText('Texto breve.')).not.toHaveClass('line-clamp-4')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('folds a long text and opens it on request', () => {
    const text = 'Una frase larga. '.repeat(30)
    render(<ClampedText text={text} />)
    const paragraph = screen.getByText(text.trim())
    expect(paragraph).toHaveClass('line-clamp-4')
    fireEvent.click(screen.getByRole('button', { name: i18n.t('wiki.more') }))
    expect(paragraph).not.toHaveClass('line-clamp-4')
    fireEvent.click(screen.getByRole('button', { name: i18n.t('wiki.less') }))
    expect(paragraph).toHaveClass('line-clamp-4')
  })
})
