import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest'
import i18n from '@/i18n'
import { UpdatesCard } from './UpdatesCard'

const sw = vi.hoisted(() => ({ needRefresh: false, updateServiceWorker: vi.fn(async () => {}) }))
vi.mock('virtual:pwa-register/react', () => ({
  useRegisterSW: () => ({
    needRefresh: [sw.needRefresh, () => {}],
    updateServiceWorker: sw.updateServiceWorker,
  }),
}))

function registration(over: { waiting?: object | null } = {}) {
  const reg = { update: vi.fn(async () => {}), installing: null, waiting: null, ...over }
  Object.defineProperty(navigator, 'serviceWorker', {
    configurable: true,
    value: { getRegistration: async () => reg },
  })
  return reg
}

beforeAll(async () => {
  await i18n.changeLanguage('es')
})

afterEach(() => {
  cleanup()
  sw.needRefresh = false
  Reflect.deleteProperty(navigator, 'serviceWorker')
})

describe('UpdatesCard', () => {
  it('shows the version of the build', () => {
    render(<UpdatesCard />)
    expect(screen.getByText('Versión y actualizaciones')).toBeInTheDocument()
    expect(screen.getByText('Versión')).toBeInTheDocument()
    expect(screen.getByText(/^\d+\.\d+\.\d+$/)).toBeInTheDocument()
  })

  it('explains, instead of offering a button, where there is no service worker', () => {
    render(<UpdatesCard />)
    expect(screen.getByText(/Aquí no hay actualizaciones/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Buscar actualización' })).toBeNull()
  })

  it('says "Estás al día" when the worker finds nothing newer', async () => {
    const reg = registration()
    render(<UpdatesCard />)
    fireEvent.click(await screen.findByRole('button', { name: 'Buscar actualización' }))
    expect(await screen.findByText(/Estás al día/)).toBeInTheDocument()
    expect(reg.update).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Buscar actualización' })).toBeEnabled()
  })

  it('offers to apply a newer version and applies it', async () => {
    registration({ waiting: {} })
    render(<UpdatesCard />)
    fireEvent.click(await screen.findByRole('button', { name: 'Buscar actualización' }))
    expect(await screen.findByText('Hay una versión nueva: aplícala')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Aplicar actualización' }))
    await waitFor(() => expect(sw.updateServiceWorker).toHaveBeenCalledWith(true))
  })

  it('does not call a failed check "up to date"', async () => {
    const reg = registration()
    reg.update.mockRejectedValueOnce(new TypeError('Failed to fetch'))
    render(<UpdatesCard />)
    fireEvent.click(await screen.findByRole('button', { name: 'Buscar actualización' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('No se ha podido comprobar')
    expect(screen.queryByText(/Estás al día/)).toBeNull()
  })
})
