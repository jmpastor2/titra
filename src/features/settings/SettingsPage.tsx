import { LogOut, Share } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { Segmented } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { ProfileRow } from '@/data/database.types'
import { useUpdateProfile } from '@/data/hooks'
import { setLocale, type AppLocale } from '@/i18n'
import { RemindersCard } from '@/features/reminders/RemindersCard'
import { fmtNumber } from '@/lib/format'
import { getSupabase } from '@/lib/supabase'
import { setSyringePref, useSyringePref, type SyringePref } from '@/lib/syringePref'
import { useTheme, type ThemePref } from '@/lib/theme'
import { useLocale } from '@/lib/useLocale'
import { goalText, parseGoal, parseProtein } from './profileForm'
import { UpdatesCard } from './UpdatesCard'

/** The barrels the app can draw, in mL (the preference stores their capacity in units). */
const BARRELS = [
  { value: '30', ml: 0.3 },
  { value: '50', ml: 0.5 },
  { value: '100', ml: 1 },
] as const

export function SettingsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patient } = usePatientScope()
  const { toast } = useToast()
  const update = useUpdateProfile(patient?.id ?? '')
  const [theme, setTheme] = useTheme()
  const syringe = useSyringePref()
  const imperial = patient?.unit_system === 'imperial'
  const [name, setName] = useState(patient?.display_name ?? '')
  const [protein, setProtein] = useState(fmtNumber(patient?.protein_g_per_kg ?? 1.6, locale, 1))
  const [goal, setGoal] = useState(goalText(patient?.goal_weight_kg ?? null, imperial, locale))
  const [invalid, setInvalid] = useState({ protein: false, goal: false })

  // The goal is typed in the unit in use: when that changes (or a save lands), the field shows
  // the stored weight again in it. Adjusted while rendering, not in an effect, so there is no
  // frame with the old text.
  const savedGoalKg = patient?.goal_weight_kg ?? null
  const [shownFor, setShownFor] = useState({ imperial, savedGoalKg, locale })
  if (
    shownFor.imperial !== imperial ||
    shownFor.savedGoalKg !== savedGoalKg ||
    shownFor.locale !== locale
  ) {
    setShownFor({ imperial, savedGoalKg, locale })
    setGoal(goalText(savedGoalKg, imperial, locale))
    setInvalid((v) => ({ ...v, goal: false }))
  }

  const isClinician = patient?.role === 'clinician'

  async function saveProfile() {
    const goalKg = parseGoal(goal, imperial)
    const gPerKg = parseProtein(protein)
    const problems = {
      protein: !isClinician && gPerKg === null,
      goal: !isClinician && !goalKg.ok,
    }
    setInvalid(problems)
    if (problems.protein || problems.goal) return
    try {
      await update.mutateAsync({
        display_name: name.trim() || patient?.display_name,
        ...(isClinician
          ? {}
          : { protein_g_per_kg: gPerKg ?? 1.6, goal_weight_kg: goalKg.ok ? goalKg.kg : null }),
      })
      toast(t('common.saved'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  async function change(patch: Partial<ProfileRow>) {
    if (!patient) return
    try {
      await update.mutateAsync(patch)
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  function changeLocale(next: AppLocale) {
    setLocale(next)
    void change({ locale: next })
  }

  return (
    <div className="pb-8">
      <PageHeader title={t('settings.title')} back="/more" />

      <div className="flex flex-col gap-3">
        <RemindersCard />

        <Card title={t('settings.profile')}>
          <div className="flex flex-col gap-4">
            <Field label={t('auth.displayName')}>
              {(id) => <Input id={id} value={name} onChange={(e) => setName(e.target.value)} />}
            </Field>
            {!isClinician && (
              <div className="grid grid-cols-2 items-start gap-3">
                <Field
                  label={t('settings.proteinGPerKg')}
                  error={invalid.protein ? t('settings.invalidNumber') : undefined}
                >
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      inputMode="decimal"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      invalid={invalid.protein}
                      suffix="g/kg"
                    />
                  )}
                </Field>
                <Field
                  label={t('onboarding.goalWeight')}
                  error={invalid.goal ? t('settings.invalidNumber') : undefined}
                >
                  {(id, describedBy) => (
                    <Input
                      id={id}
                      aria-describedby={describedBy}
                      inputMode="decimal"
                      value={goal}
                      onChange={(e) => setGoal(e.target.value)}
                      invalid={invalid.goal}
                      suffix={imperial ? 'lb' : 'kg'}
                    />
                  )}
                </Field>
              </div>
            )}
            <Button size="sm" loading={update.isPending} onClick={saveProfile}>
              {t('common.save')}
            </Button>
          </div>
        </Card>

        <Card title={t('settings.preferences')}>
          <div className="flex flex-col gap-4">
            <Field label={t('settings.theme')}>
              {() => (
                <Segmented<ThemePref>
                  value={theme}
                  onChange={setTheme}
                  options={[
                    { value: 'system', label: t('settings.themeSystem') },
                    { value: 'light', label: t('settings.themeLight') },
                    { value: 'dark', label: t('settings.themeDark') },
                  ]}
                />
              )}
            </Field>
            <Field label={t('settings.syringe')} hint={t('settings.syringeHint')}>
              {() => (
                <Segmented<string>
                  value={String(syringe)}
                  onChange={(v) =>
                    setSyringePref(v === 'auto' ? 'auto' : (Number(v) as SyringePref))
                  }
                  options={[
                    { value: 'auto', label: t('settings.syringeAuto') },
                    ...BARRELS.map((b) => ({
                      value: b.value,
                      label: `${fmtNumber(b.ml, locale, 1)} mL`,
                    })),
                  ]}
                />
              )}
            </Field>
            <Field label={t('settings.language')}>
              {() => (
                <Segmented<AppLocale>
                  value={locale}
                  onChange={changeLocale}
                  options={[
                    { value: 'es', label: 'Español' },
                    { value: 'en', label: 'English' },
                  ]}
                />
              )}
            </Field>
            {!isClinician && (
              <Field label={t('settings.units')}>
                {() => (
                  <Segmented<'metric' | 'imperial'>
                    value={patient?.unit_system ?? 'metric'}
                    onChange={(u) => void change({ unit_system: u })}
                    options={[
                      { value: 'metric', label: t('onboarding.metric') },
                      { value: 'imperial', label: t('onboarding.imperial') },
                    ]}
                  />
                )}
              </Field>
            )}
          </div>
        </Card>

        <UpdatesCard />

        <Card title={t('settings.about')}>
          <div className="flex items-start gap-2.5 rounded-control bg-panel-2 p-3">
            <Share className="mt-0.5 size-4 shrink-0 text-signal" />
            <p className="text-[13px] leading-relaxed">{t('settings.installHint')}</p>
          </div>
          <p className="mt-3 text-[11.5px] leading-relaxed text-muted">{t('app.disclaimer')}</p>
        </Card>

        <Button
          variant="ghost"
          leading={<LogOut className="size-4" />}
          onClick={async () => {
            await getSupabase()?.auth.signOut()
            window.location.hash = '#/auth'
          }}
        >
          {t('settings.signOut')}
        </Button>
      </div>
    </div>
  )
}
