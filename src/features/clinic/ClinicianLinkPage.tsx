import { Stethoscope } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input } from '@/components/ui/Field'
import { EmptyState, Row } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { useCareLinks, useLinkClinician, useRevokeLink } from '@/data/hooks'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

export function ClinicianLinkPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const links = useCareLinks(patientId)
  const link = useLinkClinician(patientId)
  const revoke = useRevokeLink(patientId)
  const [code, setCode] = useState('')

  const mine = (links.data ?? []).filter((l) => l.patient_id === patientId)

  async function submit() {
    if (!code.trim()) return
    try {
      await link.mutateAsync(code)
      setCode('')
      toast(t('clinic.linked'), 'success')
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
    <div>
      <PageHeader title={t('clinic.myClinician')} back="/more" />

      {mine.length === 0 ? (
        <Card className="mb-3">
          <EmptyState
            icon={<Stethoscope className="size-7" />}
            title={t('clinic.notLinked')}
            description={t('onboarding.linkClinicianHint')}
          />
        </Card>
      ) : (
        <Card padded={false} className="mb-3 px-4">
          <ul className="divide-y divide-line">
            {mine.map((l) => (
              <li key={l.id}>
                <Row
                  leading={
                    <span className="grid size-10 place-items-center rounded-full bg-brand-soft text-brand-strong">
                      <Stethoscope className="size-5" />
                    </span>
                  }
                  title={l.clinician?.display_name ?? '—'}
                  subtitle={t('clinic.linkedSince', {
                    date: fmtDate(new Date(l.created_at), locale),
                  })}
                  trailing={
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={async () => {
                        if (!window.confirm(t('clinic.unlinkMineConfirm'))) return
                        try {
                          await revoke.mutateAsync(l.id)
                          toast(t('common.saved'), 'success')
                        } catch {
                          toast(t('common.error'), 'error')
                        }
                      }}
                    >
                      {t('clinic.unlinkMine')}
                    </Button>
                  }
                />
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card title={t('clinic.link')} subtitle={t('onboarding.linkClinicianHint')}>
        <Field label={t('onboarding.clinicCode')}>
          {(id) => (
            <Input
              id={id}
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="ABC234"
              maxLength={6}
              className="font-mono uppercase tracking-[0.3em]"
            />
          )}
        </Field>
        <Button
          className="mt-3"
          block
          loading={link.isPending}
          disabled={!code.trim()}
          onClick={submit}
        >
          {t('clinic.link')}
        </Button>
      </Card>
    </div>
  )
}
