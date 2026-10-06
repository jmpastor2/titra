import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeAll, describe, expect, it } from 'vitest'
import { ToastProvider } from '@/components/ui/Toast'
import { createFakeSupabase } from '@/dev/fakeSupabase'
import { buildStore, LAB_USER } from '@/dev/fixtures'
import i18n from '@/i18n'
import { setSupabaseClient } from '@/lib/supabase'
import { LoginPage } from './LoginPage'

function visit() {
  setSupabaseClient(createFakeSupabase(buildStore(new Date(), { empty: true }), LAB_USER))
  return render(
    <ToastProvider>
      <MemoryRouter>
        <LoginPage />
      </MemoryRouter>
    </ToastProvider>,
  )
}

beforeAll(() => i18n.changeLanguage('es'))
afterEach(() => {
  cleanup()
  setSupabaseClient(null)
})

describe('LoginPage', () => {
  it('opens on signing in: the mark, two fields and one button', () => {
    visit()
    expect(screen.getByRole('heading', { level: 1, name: 'Titra' })).toBeInTheDocument()
    expect(screen.getByLabelText('Correo electrónico')).toBeInTheDocument()
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Entrar' })).toHaveAttribute('type', 'submit')
    expect(screen.queryByLabelText('Tu nombre')).not.toBeInTheDocument()
  })

  it('moves to creating an account from the line underneath, and back', () => {
    visit()
    fireEvent.click(screen.getByRole('button', { name: /¿Aún no tienes cuenta\?/ }))
    expect(screen.getByRole('heading', { name: 'Crea tu cuenta' })).toBeInTheDocument()
    expect(screen.getByLabelText('Tu nombre')).toBeInTheDocument()
    expect(screen.getByText('Mínimo 8 caracteres')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /¿Ya tienes cuenta\?/ }))
    expect(screen.queryByLabelText('Tu nombre')).not.toBeInTheDocument()
  })

  it('asks only for the email to recover the password', () => {
    visit()
    fireEvent.click(screen.getByRole('button', { name: '¿Olvidaste la contraseña?' }))
    expect(screen.getByRole('heading', { name: 'Recupera tu contraseña' })).toBeInTheDocument()
    expect(screen.queryByLabelText('Contraseña')).not.toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Enviar enlace de recuperación' }),
    ).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Volver a iniciar sesión' }))
    expect(screen.getByLabelText('Contraseña')).toBeInTheDocument()
  })

  it('says a short password is too short before asking the server', async () => {
    visit()
    fireEvent.click(screen.getByRole('button', { name: /¿Aún no tienes cuenta\?/ }))
    fireEvent.change(screen.getByLabelText('Tu nombre'), { target: { value: 'Jose' } })
    fireEvent.change(screen.getByLabelText('Correo electrónico'), {
      target: { value: 'jose@example.com' },
    })
    fireEvent.change(screen.getByLabelText('Contraseña'), { target: { value: 'corta' } })
    fireEvent.submit(screen.getByRole('button', { name: 'Crear cuenta' }))
    expect(await screen.findByRole('alert')).toHaveTextContent(i18n.t('auth.errors.weak'))
  })
})
