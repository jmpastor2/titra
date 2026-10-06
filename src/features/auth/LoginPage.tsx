import { CircleAlert, MailCheck } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Field, Input } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { currentLocale } from '@/i18n'
import { requireSupabase } from '@/lib/supabase'
import { BrandMark } from './BrandMark'
import { useSession } from './SessionProvider'

type Mode = 'signin' | 'signup' | 'reset'

/**
 * The first screen anyone sees: the mark, two fields and one button. Creating an account and
 * recovering the password are the same form with one more or one less field, reached from a
 * quiet line underneath.
 */
export function LoginPage() {
  const { t } = useTranslation()
  const { status } = useSession()
  const { toast } = useToast()
  const [mode, setMode] = useState<Mode>('signin')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  if (status === 'signed_in') return <Navigate to="/" replace />

  const redirectTo = `${window.location.origin}${import.meta.env.BASE_URL}`

  function switchTo(next: Mode) {
    setMode(next)
    setError(null)
    setInfo(null)
  }

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
            data: { display_name: name.trim(), locale: currentLocale() },
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
    <div className="safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6">
      <div className="min-h-10 flex-[1.1]" />

      <BrandMark />

      <form onSubmit={submit} className="mt-10 flex flex-col gap-4">
        {mode !== 'signin' && (
          <div className="mb-1">
            <h2 className="text-[20px] font-semibold tracking-[-0.015em]">
              {mode === 'signup' ? t('auth.signupTitle') : t('auth.resetTitle')}
            </h2>
            {mode === 'reset' && (
              <p className="mt-1 text-[13.5px] leading-snug text-muted">{t('auth.resetHint')}</p>
            )}
          </div>
        )}

        {mode === 'signup' && (
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
                  className="tap-link text-[12.5px] font-medium text-muted outline-none hover:text-ink focus-visible:ring-2 focus-visible:ring-signal/60"
                  onClick={() => switchTo('reset')}
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
          <p role="alert" className="flex items-start gap-2 text-[13.5px] leading-snug text-danger">
            <CircleAlert className="mt-px size-4 shrink-0" aria-hidden />
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="flex items-start gap-2 text-[13.5px] leading-snug text-ink-2">
            <MailCheck className="mt-px size-4 shrink-0 text-signal" aria-hidden />
            {info}
          </p>
        )}

        <Button type="submit" size="lg" block loading={busy} className="mt-2">
          {mode === 'signin'
            ? t('auth.enter')
            : mode === 'signup'
              ? t('auth.signUp')
              : t('auth.reset')}
        </Button>

        {mode === 'signin' && (
          <Button variant="ghost" size="sm" onClick={magicLink} disabled={busy || !email}>
            {t('auth.magicLink')}
          </Button>
        )}
      </form>

      <div className="min-h-8 flex-1" />

      <div className="flex flex-col items-center gap-4 pb-4 text-center">
        <button
          type="button"
          onClick={() => switchTo(mode === 'signin' ? 'signup' : 'signin')}
          className="inline-flex min-h-11 flex-wrap items-center justify-center gap-x-1.5 rounded-full px-3 text-[14px] outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
        >
          {mode === 'signin' ? (
            <>
              <span className="text-muted">{t('auth.noAccount')}</span>
              <span className="font-semibold text-ink">{t('auth.signUp')}</span>
            </>
          ) : mode === 'signup' ? (
            <>
              <span className="text-muted">{t('auth.haveAccount')}</span>
              <span className="font-semibold text-ink">{t('auth.signIn')}</span>
            </>
          ) : (
            <span className="font-semibold text-ink">{t('auth.backToSignIn')}</span>
          )}
        </button>
        <p className="max-w-[34ch] text-[11.5px] leading-relaxed text-muted">
          {t('app.disclaimer')}
        </p>
      </div>
    </div>
  )
}
