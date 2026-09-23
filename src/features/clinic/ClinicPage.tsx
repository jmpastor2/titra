import { Copy, Users } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { Card } from '@/components/ui/Card'
import { Badge, EmptyState, Row, Segmented, Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundName } from '@/content/compounds'
import { useClinicBundle } from '@/data/hooks'
import { fmtDistance, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { flagTone, summarisePatients } from './triage'

type Sort = 'flags' | 'name' | 'lastDose'

export function ClinicPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patient } = usePatientScope()
  const nav = useNavigate()
  const { toast } = useToast()
  const bundle = useClinicBundle(patient?.id)
  const [sort, setSort] = useState<Sort>('flags')
  const now = useMemo(() => new Date(), [])

  const summaries = useMemo(() => {
    if (!bundle.data) return []
    const list = summarisePatients({ ...bundle.data, now })
    if (sort === 'name')
      return list.toSorted((a, b) => a.patient.display_name.localeCompare(b.patient.display_name))
    if (sort === 'lastDose')
      return list.toSorted(
        (a, b) => (b.lastDoseAt?.getTime() ?? 0) - (a.lastDoseAt?.getTime() ?? 0),
      )
    return list
  }, [bundle.data, sort, now])

  async function copyCode() {
    if (!patient?.clinic_code) return
    try {
      await navigator.clipboard.writeText(patient.clinic_code)
      toast(t('common.copied'), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="flex flex-col gap-4 pt-[max(env(safe-area-inset-top),16px)]">
      <header>
        <h1 className="text-[28px] font-bold tracking-tight">{t('clinic.title')}</h1>
        <p className="text-[13px] text-muted">
          {t('clinic.patients', { count: summaries.length })}
        </p>
      </header>

      <Card tone="brand" title={t('clinic.clinicCode')} subtitle={t('clinic.clinicCodeHint')}>
        <button
          type="button"
          onClick={copyCode}
          className="flex w-full items-center justify-between rounded-control border border-brand/30 bg-surface px-4 py-3"
        >
          <span className="font-mono text-[26px] font-bold tracking-[0.35em] text-brand-strong">
            {patient?.clinic_code ?? '······'}
          </span>
          <span className="flex items-center gap-1.5 text-[13px] font-semibold text-brand-strong">
            <Copy className="size-4" /> {t('clinic.copyCode')}
          </span>
        </button>
      </Card>

      {summaries.length > 1 && (
        <Segmented<Sort>
          value={sort}
          onChange={setSort}
          size="sm"
          options={[
            { value: 'flags', label: t('clinic.sort.flags') },
            { value: 'name', label: t('clinic.sort.name') },
            { value: 'lastDose', label: t('clinic.sort.lastDose') },
          ]}
        />
      )}

      {bundle.isPending ? (
        <Card>
          <Skeleton className="h-14 w-full" />
          <Skeleton className="mt-2 h-14 w-full" />
        </Card>
      ) : summaries.length === 0 ? (
        <Card>
          <EmptyState
            icon={<Users className="size-7" />}
            title={t('clinic.empty')}
            description={t('clinic.emptyHint')}
          />
        </Card>
      ) : (
        <Card padded={false} className="px-4">
          <ul className="divide-y divide-line">
            {summaries.map((s) => (
              <li key={s.patient.id}>
                <Row
                  onClick={() => nav(`/patients/${s.patient.id}`)}
                  leading={
                    <span className="grid size-10 place-items-center rounded-full bg-surface-2 text-[14px] font-bold text-ink-2">
                      {initials(s.patient.display_name)}
                    </span>
                  }
                  title={s.patient.display_name}
                  subtitle={
                    <span className="flex flex-wrap items-center gap-x-2">
                      {s.compoundId && <span>{compoundName(s.compoundId)}</span>}
                      {s.lastDoseAt && <span>· {fmtDistance(s.lastDoseAt, locale)}</span>}
                      {s.adherenceRatio !== null && (
                        <span>· {fmtPercent(s.adherenceRatio, locale)}</span>
                      )}
                      {s.weightDeltaKg !== null && s.weightDeltaKg !== 0 && (
                        <span className="tabular">
                          · {s.weightDeltaKg > 0 ? '+' : ''}
                          {fmtNumber(s.weightDeltaKg, locale, 1)} kg
                        </span>
                      )}
                    </span>
                  }
                  trailing={
                    s.flags.length > 0 && (
                      <span className="flex max-w-[110px] flex-wrap justify-end gap-1">
                        {s.flags.slice(0, 2).map((f) => (
                          <Badge key={f} tone={flagTone(f)}>
                            {t(`clinic.flags.${f}`)}
                          </Badge>
                        ))}
                      </span>
                    )
                  }
                />
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  )
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}
