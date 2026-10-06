import { ChevronRight, Copy, Share2, UserMinus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Input } from '@/components/ui/Field'
import { Badge, SectionTitle } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { useCareLinks, useClinicBundle, useLinkClinician, useRevokeLink } from '@/data/hooks'
import { flagTone, summarisePatients } from '@/features/clinic/triage'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

/**
 * Sharing is opt-in and owner-driven: I enter the code of whoever should see my control.
 * Nobody can reach my data from my own code alone.
 */
export function SharePage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const nav = useNavigate()
  const { toast } = useToast()
  const { patient } = usePatientScope()
  const me = patient?.id ?? ''
  const links = useCareLinks(me)
  const link = useLinkClinician(me)
  const revoke = useRevokeLink(me)
  const bundle = useClinicBundle(me)
  const [code, setCode] = useState('')
  const now = useMemo(() => new Date(), [])

  const viewers = (links.data ?? []).filter((l) => l.patient_id === me)
  const sharedWithMe = useMemo(
    () => (bundle.data ? summarisePatients({ ...bundle.data, now }) : []),
    [bundle.data, now],
  )

  async function copy() {
    if (!patient?.clinic_code) return
    try {
      await navigator.clipboard.writeText(patient.clinic_code)
      toast(t('common.copied'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  async function submit() {
    if (!code.trim()) return
    try {
      await link.mutateAsync(code)
      setCode('')
      toast(t('share.linked'), 'success')
    } catch (e) {
      const m = (e as Error).message
      toast(
        m.includes('invalid_code')
          ? t('clinic.linkErrors.invalid_code')
          : m.includes('self_link')
            ? t('clinic.linkErrors.self_link')
            : t('clinic.linkErrors.generic'),
        'warn',
      )
    }
  }

  return (
    <div className="pb-8">
      <PageHeader title={t('share.title')} back="/more" />

      <div className="flex flex-col gap-4">
        <Card>
          <div className="spec">{t('share.myCode')}</div>
          <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
            <span className="readout text-[34px] font-semibold leading-none tracking-[0.08em]">
              {patient?.clinic_code ?? '······'}
            </span>
            <Button
              size="sm"
              variant="secondary"
              leading={<Copy className="size-4" aria-hidden />}
              disabled={!patient?.clinic_code}
              onClick={copy}
            >
              {t('clinic.copyCode')}
            </Button>
          </div>
          <p className="mt-3 text-[13px] leading-snug text-muted">{t('share.myCodeHint')}</p>
        </Card>

        <Card title={t('share.shareMine')} subtitle={t('share.shareMineHint')}>
          <div className="flex gap-2">
            <Input
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC234"
              maxLength={6}
              aria-label={t('onboarding.clinicCode')}
              className="readout min-w-0 tracking-[0.08em]"
            />
            <Button
              className="shrink-0"
              loading={link.isPending}
              disabled={!code.trim()}
              leading={<Share2 className="size-4" />}
              onClick={submit}
            >
              {t('share.share')}
            </Button>
          </div>
        </Card>

        <section>
          <SectionTitle>{t('share.viewers')}</SectionTitle>
          <Card padded={false} className="px-4">
            {viewers.length === 0 ? (
              <p className="py-4 text-[13.5px] text-muted">{t('share.noViewers')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {viewers.map((l) => (
                  <li
                    key={l.id}
                    className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-3"
                  >
                    <div className="min-w-0">
                      <div className="text-[15px] font-semibold leading-snug">
                        {l.clinician?.display_name ?? '—'}
                      </div>
                      <div className="text-[12px] text-muted">
                        {t('clinic.linkedSince', { date: fmtDate(new Date(l.created_at), locale) })}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="-mr-2"
                      leading={<UserMinus className="size-4" />}
                      onClick={async () => {
                        if (!window.confirm(t('clinic.unlinkMineConfirm'))) return
                        try {
                          await revoke.mutateAsync(l.id)
                        } catch {
                          toast(t('common.error'), 'error')
                        }
                      }}
                    >
                      {t('clinic.unlinkMine')}
                    </Button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle>{t('share.sharedWithMe')}</SectionTitle>
          <Card padded={false} className="px-4">
            {sharedWithMe.length === 0 ? (
              <p className="py-4 text-[13.5px] text-muted">{t('share.noneSharedWithMe')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {sharedWithMe.map((s) => (
                  <li key={s.patient.id}>
                    <button
                      type="button"
                      onClick={() => nav(`/shared/${s.patient.id}`)}
                      className="flex min-h-[68px] w-full items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
                    >
                      <span
                        aria-hidden
                        className="grid size-10 shrink-0 place-items-center rounded-full bg-panel-3 text-[15px] font-semibold text-ink-2"
                      >
                        {s.patient.display_name.charAt(0).toUpperCase()}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold leading-snug">
                          {s.patient.display_name}
                        </span>
                        <span className="flex flex-wrap gap-1 pt-0.5">
                          {s.flags.slice(0, 3).map((f) => (
                            <Badge key={f} tone={flagTone(f)}>
                              {t(`clinic.flags.${f}`)}
                            </Badge>
                          ))}
                        </span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted/70" aria-hidden />
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </section>
      </div>
    </div>
  )
}
