import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate } from 'react-router-dom'
import { Splash } from '@/components/layout/Splash'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { ProfileRow } from '@/data/database.types'
import { useProfile, useUpdateProfile } from '@/data/hooks'
import { setLocale, type AppLocale } from '@/i18n'
import { goalText, parseGoal } from '@/features/settings/profileForm'
import { BrandMark } from './BrandMark'
import { useSession } from './SessionProvider'

type Sex = 'M' | 'F' | 'O'

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

/**
 * First set-up, one screen: how the app talks to you (language, units), then who you are. Only
 * the name is needed; everything else can wait for Ajustes.
 */
export function OnboardingForm({
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
  const [sex, setSex] = useState<Sex | ''>(initial.sex ?? '')
  const [height, setHeight] = useState(initial.height_cm?.toString() ?? '')
  const [goal, setGoal] = useState(
    goalText(initial.goal_weight_kg, initial.unit_system === 'imperial', initial.locale),
  )
  const [goalInvalid, setGoalInvalid] = useState(false)

  // The screen switches language at once, so the rest is read in the chosen one.
  function chooseLocale(next: AppLocale) {
    setLoc(next)
    setLocale(next)
  }

  async function finish() {
    // The goal is typed in the unit chosen above and stored in kg.
    const goalKg = parseGoal(goal, units === 'imperial')
    setGoalInvalid(!goalKg.ok)
    if (!goalKg.ok) return
    try {
      await update.mutateAsync({
        display_name: name.trim() || initial.display_name,
        locale,
        unit_system: units,
        birth_year: birthYear ? Number(birthYear) : null,
        sex: sex || null,
        height_cm: height ? Number(height) : null,
        goal_weight_kg: goalKg.kg,
        onboarded: true,
      })
      setLocale(locale)
      onDone()
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="safe-top safe-bottom mx-auto min-h-dvh w-full max-w-md px-5 pb-8">
      <div className="pt-6">
        <BrandMark compact />
      </div>
      <h1 className="mt-9 font-display text-[30px] font-bold leading-[1.1] tracking-[-0.03em]">
        {t('onboarding.welcome')}
      </h1>
      <p className="mt-2 text-[15px] leading-snug text-muted">{t('onboarding.intro')}</p>

      <div className="mt-7 flex flex-col gap-3">
        <Card title={t('settings.preferences')}>
          <div className="flex flex-col gap-4">
            <Field label={t('onboarding.language')}>
              {() => (
                <Segmented<AppLocale>
                  value={locale}
                  onChange={chooseLocale}
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
          </div>
        </Card>

        <Card title={t('onboarding.profile')} subtitle={t('onboarding.profileHint')}>
          <div className="flex flex-col gap-4">
            <Field label={t('auth.displayName')}>
              {(id) => (
                <Input
                  id={id}
                  value={name}
                  autoComplete="name"
                  onChange={(e) => setName(e.target.value)}
                />
              )}
            </Field>
            <Field label={t('onboarding.sex')}>
              {() => (
                <Segmented<Sex | ''>
                  value={sex}
                  onChange={setSex}
                  options={[
                    { value: 'M', label: t('onboarding.sexM') },
                    { value: 'F', label: t('onboarding.sexF') },
                    { value: 'O', label: t('onboarding.sexO') },
                  ]}
                />
              )}
            </Field>
            <div className="grid grid-cols-2 items-start gap-3">
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
            </div>
            <Field
              label={t('onboarding.goalWeight')}
              hint={t('onboarding.goalHint')}
              error={goalInvalid ? t('settings.invalidNumber') : undefined}
            >
              {(id, describedBy) => (
                <Input
                  id={id}
                  aria-describedby={describedBy}
                  inputMode="decimal"
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  invalid={goalInvalid}
                  suffix={units === 'imperial' ? 'lb' : 'kg'}
                />
              )}
            </Field>
          </div>
        </Card>
      </div>

      <Button size="lg" block className="mt-6" loading={update.isPending} onClick={finish}>
        {t('onboarding.finish')}
      </Button>
    </div>
  )
}
