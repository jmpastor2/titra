import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { UserRole } from '@/data/database.types'
import { currentLocale } from '@/i18n'
import { requireSupabase } from '@/lib/supabase'
import { useSession } from './SessionProvider'

type Mode = 'signin' | 'signup' | 'reset'

export function LoginPage() {
  const { t } = useTranslation()
  const { status } = useSession()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [role, setRole] = useState<UserRole>('patient')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (status === 'signed_in') return <Navigate to="/" replace />

  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`

  async function submit(e: FormEvent) {
    e.preventDefault()
    setBusy(true)
    setError(null)
    setInfo(null)
    const sb = requireSupabase()
    try {
      if (mode === 'signin') {
        const res = await sb.auth.signInWithPassword({ email, password })
        if (res.error) throw res.error
      } else if (mode === 'signup') {
        if (password.length < 8) throw new Error('weak')
        const res = await sb.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectTo,
            data: { display_name: name.trim(), role, locale: currentLocale() },
          },
        })
        if (res.error) throw res.error
        if (!res.data.session) setInfo(t('auth.confirmEmail'))
      } else {
        const res = await sb.auth.resetPasswordForEmail(email, { redirectTo })
        if (res.error) throw res.error
        setInfo(t('auth.resetSent'))
      }
    } catch (err) {
      const msg = (err as Error).message ?? ''
      if (msg === 'weak' || /password/i.test(msg)) setError(t('auth.errors.weak'))
      else if (/invalid login/i.test(msg)) setError(t('auth.errors.invalid'))
      else if (/already registered|exists/i.test(msg)) setError(t('auth.errors.exists'))
      else setError(t('auth.errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  async function magicLink() {
    if (!email) return
    setBusy(true)
    try {
      const res = await requireSupabase().auth.signInWithOtp({
        email,
        options: { emailRedirectTo: redirectTo },
      })
      if (res.error) throw res.error
      toast(t('auth.magicSent'), 'success')
    } catch {
      setError(t('auth.errors.generic'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-bg px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <img
            src={`${import.meta.env.BASE_URL}icons/icon-192.png`}
            alt=""
            className="size-20 rounded-[22px] shadow-card"
          />
          <h1 className="mt-4 text-[30px] font-bold tracking-tight">{t('app.name')}</h1>
          <p className="text-[14px] text-muted">{t('app.tagline')}</p>
        </div>

        <form onSubmit={submit} className="card flex flex-col gap-4 p-5">
          <Segmented<Mode>
            value={mode === 'reset' ? 'signin' : mode}
            onChange={(m) => {
              setMode(m)
              setError(null)
              setInfo(null)
            }}
            options={[
              { value: 'signin', label: t('auth.signIn') },
              { value: 'signup', label: t('auth.signUp') },
            ]}
          />

          {mode === 'signup' && (
            <>
              <Field label={t('auth.displayName')}>
                {(id) => (
                  <Input
                    id={id}
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    required
                  />
                )}
              </Field>
              <Field label={t('auth.iAm')} hint={t('auth.roleHint')}>
                {() => (
                  <Segmented<UserRole>
                    value={role}
                    onChange={setRole}
                    options={[
                      { value: 'patient', label: t('auth.rolePatient') },
                      { value: 'clinician', label: t('auth.roleClinician') },
                    ]}
                  />
                )}
              </Field>
            </>
          )}

          <Field label={t('auth.email')}>
            {(id) => (
              <Input
                id={id}
                type="email"
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            )}
          </Field>

          {mode !== 'reset' && (
            <Field
              label={t('auth.password')}
              hint={mode === 'signup' ? t('auth.passwordHint') : undefined}
              trailing={
                mode === 'signin' && (
                  <button
                    type="button"
                    className="text-[12.5px] font-medium text-brand-strong"
                    onClick={() => setMode('reset')}
                  >
                    {t('auth.forgot')}
                  </button>
                )
              }
            >
              {(id) => (
                <Input
                  id={id}
                  type="password"
                  autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={mode === 'signup' ? 8 : undefined}
                  required
                />
              )}
            </Field>
          )}

          {error && (
            <p
              role="alert"
              className="rounded-control bg-danger-soft px-3 py-2 text-[13px] text-danger"
            >
              {error}
            </p>
          )}
          {info && (
            <p role="status" className="rounded-control bg-ok-soft px-3 py-2 text-[13px] text-ok">
              {info}
            </p>
          )}

          <Button type="submit" size="lg" block loading={busy}>
            {mode === 'signin'
              ? t('auth.signIn')
              : mode === 'signup'
                ? t('auth.signUp')
                : t('auth.reset')}
          </Button>

          {mode === 'signin' && (
            <Button variant="ghost" size="sm" onClick={magicLink} disabled={busy || !email}>
              {t('auth.magicLink')}
            </Button>
          )}
          {mode === 'reset' && (
            <Button variant="ghost" size="sm" onClick={() => setMode('signin')}>
              {t('common.back')}
            </Button>
          )}
        </form>

        <p className="mt-6 px-2 text-center text-[11.5px] leading-relaxed text-muted">
          {t('app.disclaimer')}
        </p>
      </div>
    </div>
  )
}
