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
import { useUpdateProfile } from '@/data/hooks'
import { setLocale, type AppLocale } from '@/i18n'
import { RemindersCard } from '@/features/reminders/RemindersCard'
import { env } from '@/lib/env'
import { getSupabase } from '@/lib/supabase'
import { setSyringePref, useSyringePref, type SyringePref } from '@/lib/syringePref'
import { useTheme, type ThemePref } from '@/lib/theme'

export function SettingsPage() {
  const { t, i18n } = useTranslation()
  const { patient } = usePatientScope()
  const { toast } = useToast()
  const update = useUpdateProfile(patient?.id ?? '')
  const [theme, setTheme] = useTheme()
  const syringe = useSyringePref()
  const [name, setName] = useState(patient?.display_name ?? '')
  const [protein, setProtein] = useState(String(patient?.protein_g_per_kg ?? 1.6))
  const [goal, setGoal] = useState(patient?.goal_weight_kg?.toString() ?? '')

  const locale: AppLocale = i18n.language.startsWith('en') ? 'en' : 'es'
  const isClinician = patient?.role === 'clinician'

  async function saveProfile() {
    try {
      await update.mutateAsync({
        display_name: name.trim() || patient?.display_name,
        protein_g_per_kg: Number(protein.replace(',', '.')) || 1.6,
        goal_weight_kg: goal ? Number(goal.replace(',', '.')) : null,
      })
      toast(t('common.saved'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  async function changeLocale(next: AppLocale) {
    setLocale(next)
    if (patient) await update.mutateAsync({ locale: next })
  }

  async function changeUnits(next: 'metric' | 'imperial') {
    if (patient) await update.mutateAsync({ unit_system: next })
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
              <div className="grid grid-cols-2 gap-3">
                <Field label={t('settings.proteinGPerKg')}>
                  {(id) => (
                    <Input
                      id={id}
                      inputMode="decimal"
                      value={protein}
                      onChange={(e) => setProtein(e.target.value)}
                      suffix="g/kg"
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
                    { value: '30', label: '0,3 mL' },
                    { value: '50', label: '0,5 mL' },
                    { value: '100', label: '1 mL' },
                  ]}
                />
              )}
            </Field>
            <Field label={t('settings.language')}>
              {() => (
                <Segmented<AppLocale>
                  value={locale}
                  onChange={(l) => void changeLocale(l)}
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
                    onChange={(u) => void changeUnits(u)}
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

        <Card title={t('settings.about')}>
          <div className="flex items-start gap-2.5 rounded-control bg-panel-2 p-3">
            <Share className="mt-0.5 size-4 shrink-0 text-signal" />
            <p className="text-[13px] leading-relaxed">{t('settings.installHint')}</p>
          </div>
          <p className="mt-3 text-[12.5px] text-muted">
            {t('settings.version', { v: env.appVersion })}
          </p>
          <p className="mt-2 text-[11.5px] leading-relaxed text-muted">{t('app.disclaimer')}</p>
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
