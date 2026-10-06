import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { PatientScopeProvider } from '@/app/scope'
import { compoundById } from '@/content/compounds'
import { createFakeSupabase } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { WikiPage } from './WikiPage'

function visit() {
  setSupabaseClient(createFakeSupabase(buildStore(new Date()), LAB_USER))
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return render(
    <QueryClientProvider client={client}>
      <PatientScopeProvider
        value={{
          patientId: LAB_USER.id,
          patient: null,
          isSelf: true,
          readOnly: false,
          canPrescribe: false,
        }}
      >
        <MemoryRouter>
          <WikiPage />
        </MemoryRouter>
      </PatientScopeProvider>
    </QueryClientProvider>,
  )
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
  window.scrollTo = () => {}
})
afterEach(() => {
  cleanup()
  setSupabaseClient(null)
})

const search = () => screen.getByRole('searchbox', { name: i18n.t('common.search') })

describe('WikiPage', () => {
  it('counts the lean catalogue and groups it by family, without the retired ones', () => {
    visit()
    expect(screen.getByText(/^\d+ compuestos$/)).toBeInTheDocument()
    expect(screen.getAllByText('Incretinas / GLP-1').length).toBeGreaterThan(0)
    expect(screen.queryAllByText('Insulinas')).toHaveLength(0)
    expect(screen.queryAllByText('Otros')).toHaveLength(0)
  })

  it('lists a blend of yours once: under yours, not again under blends', async () => {
    visit()
    const mine = await screen.findByText(i18n.t('wiki.mine'))
    const blend = compoundById('blend-cjc-ipamorelin')?.names.generic ?? ''
    expect(blend).not.toBe('')
    expect(screen.getAllByText(blend)).toHaveLength(1)
    expect(mine.closest('section')).toContainElement(screen.getByText(blend))
  })

  it('searches by any words of the name, in any order', () => {
    visit()
    fireEvent.change(search(), { target: { value: 'ipamorelina cjc' } })
    const rows = screen.getAllByRole('button').filter((b) => b.textContent?.includes('Ipamorelina'))
    expect(rows.length).toBeGreaterThan(0)
    expect(screen.queryByText('Retatrutida')).not.toBeInTheDocument()
    fireEvent.change(search(), { target: { value: 'zzzz' } })
    expect(screen.getByText(i18n.t('wiki.noResults'))).toBeInTheDocument()
  })

  it('narrows to a family with its chip', () => {
    visit()
    fireEvent.click(screen.getByRole('button', { name: i18n.t('wiki.categories.repair') }))
    const list = screen.getByRole('list')
    expect(within(list).getByText('BPC-157')).toBeInTheDocument()
    expect(within(list).queryByText('Retatrutida')).not.toBeInTheDocument()
  })
})
