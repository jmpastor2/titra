import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { Splash } from '@/components/layout/Splash'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { ProfileRow } from '@/data/database.types'
import { useProfile, useUpdateProfile } from '@/data/hooks'
import { setLocale, type AppLocale } from '@/i18n'
import { useSession } from './SessionProvider'

export function OnboardingPage() {
  const { status, user } = useSession()
  const profile = useProfile(user?.id)
  const nav = useNavigate()

  if (status === 'signed_out') return <Navigate to="/auth" replace />
  if (!user || profile.isPending) return <Splash />
  if (profile.data?.onboarded) return <Navigate to="/" replace />
  if (!profile.data) return <Splash error={profile.error?.message} />

  return (
    <OnboardingForm
      userId={user.id}
      initial={profile.data}
      onDone={() => nav('/', { replace: true })}
    />
  )
}

function OnboardingForm({
  userId,
  initial,
  onDone,
}: {
  userId: string
  initial: ProfileRow
  onDone: () => void
}) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const update = useUpdateProfile(userId)
  const [name, setName] = useState(initial.display_name)
  const [locale, setLoc] = useState<AppLocale>(initial.locale)
  const [units, setUnits] = useState<'metric' | 'imperial'>(initial.unit_system)
  const [birthYear, setBirthYear] = useState(initial.birth_year?.toString() ?? '')
  const [sex, setSex] = useState<'M' | 'F' | 'O' | ''>(initial.sex ?? '')
  const [height, setHeight] = useState(initial.height_cm?.toString() ?? '')
  const [goal, setGoal] = useState(initial.goal_weight_kg?.toString() ?? '')

  async function finish() {
    try {
      await update.mutateAsync({
        display_name: name.trim() || initial.display_name,
        locale,
        unit_system: units,
        birth_year: birthYear ? Number(birthYear) : null,
        sex: sex || null,
        height_cm: height ? Number(height) : null,
        goal_weight_kg: goal ? Number(goal) : null,
        onboarded: true,
      })
      setLocale(locale)
      onDone()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="mx-auto min-h-dvh w-full max-w-md px-5 py-10">
      <div className="spec">TITRA · {t('onboarding.setup')}</div>
      <h1 className="mt-1 font-display text-[30px] font-bold">{t('onboarding.welcome')}</h1>
      <p className="mt-1 text-[14px] text-muted">{t('onboarding.intro')}</p>

      <div className="card mt-6 flex flex-col gap-4 p-5">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-muted">
          {t('onboarding.profile')}
        </h2>
        <Field label={t('auth.displayName')}>
          {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}
        </Field>
        <Field label={t('onboarding.language')}>
          {() => (
            <Segmented<AppLocale>
              value={locale}
              onChange={setLoc}
              options={[
                { value: 'es', label: 'Español' },
                { value: 'en', label: 'English' },
              ]}
            />
          )}
        </Field>
        <Field label={t('onboarding.units')}>
          {() => (
            <Segmented<'metric' | 'imperial'>
              value={units}
              onChange={setUnits}
              options={[
                { value: 'metric', label: t('onboarding.metric') },
                { value: 'imperial', label: t('onboarding.imperial') },
              ]}
            />
          )}
        </Field>
        {
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('onboarding.birthYear')}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="numeric"
                    value={birthYear}
                    onChange={(e) => setBirthYear(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="1985"
                  />
                )}
              </Field>
              <Field label={t('onboarding.sex')}>
                {(id) => (
                  <Select
                    id={id}
                    value={sex}
                    onChange={(e) => setSex(e.target.value as typeof sex)}
                  >
                    <option value="">—</option>
                    <option value="M">{t('onboarding.sexM')}</option>
                    <option value="F">{t('onboarding.sexF')}</option>
                    <option value="O">{t('onboarding.sexO')}</option>
                  </Select>
                )}
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('onboarding.heightCm')}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    value={height}
                    onChange={(e) => setHeight(e.target.value)}
                    suffix="cm"
                  />
                )}
              </Field>
              <Field label={t('onboarding.goalWeight')}>
                {(id) => (
                  <Input
                    id={id}
                    inputMode="decimal"
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    suffix="kg"
                  />
                )}
              </Field>
            </div>
          </>
        }
      </div>

      <Button size="lg" block className="mt-6" loading={update.isPending} onClick={finish}>
        {t('onboarding.finish')}
      </Button>
    </div>
  )
}
