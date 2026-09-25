import { BookOpen, FlaskConical, Package, Syringe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, SectionTitle, SubstanceDot, Vial } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { useInventory, useSymptoms } from '@/data/hooks'
import { protocolCompoundIds, toProtocolLike } from '@/data/mappers'
import { LogDoseSheet } from '@/features/doses/LogDoseSheet'
import { ExposureCard } from '@/features/exposure/ExposureCard'
import { useExposure } from '@/features/exposure/useExposure'
import { useScheduleLabel } from '@/features/protocols/scheduleLabel'
import { vialHas, vialLook } from '@/features/inventory/vials'
import { evidenceTone, regulatoryTone } from '@/features/wiki/tones'
import { fmtDateTime, fmtDose, fmtHours, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'

export function SubstancePage() {
  const { compoundId = '' } = useParams()
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  const { patientId, readOnly } = usePatientScope()
  const now = useNow()
  const exposure = useExposure(patientId, now)
  const inventory = useInventory(patientId)
  const symptoms = useSymptoms(patientId, 60)
  const scheduleLabel = useScheduleLabel()
  const [logging, setLogging] = useState(false)
  const compound = compoundById(compoundId)
  const color = compoundColor(compoundId)

  const x = exposure.items.find((i) => i.compoundId === compoundId)
  const protocols = useMemo(
    () => exposure.protocols.filter((p) => protocolCompoundIds(p).includes(compoundId)),
    [exposure.protocols, compoundId],
  )
  const vials = (inventory.data ?? []).filter((v) => vialHas(v, compoundId))
  const recent = (x?.doses ?? []).toReversed().slice(0, 8)

  if (!compound) return <Navigate to="/" replace />

  return (
    <div className="pb-8">
      <PageHeader
        eyebrow={t(`wiki.categories.${compound.category}`)}
        title={
          <span className="flex items-center gap-2">
            <SubstanceDot color={color} size={11} />
            {compound.names.generic}
          </span>
        }
        back
        action={
          !readOnly && (
            <Button
              size="sm"
              leading={<Syringe className="size-4" />}
              onClick={() => setLogging(true)}
            >
              {t('doses.log')}
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-4">
        {x && x.pk ? (
          <ExposureCard x={x} symptoms={symptoms.data ?? []} now={now} readOnly />
        ) : (
          <Card instrument>
            <div className="spec">{t('today.lastDose')}</div>
            <div className="readout mt-1 text-[24px] font-semibold" style={{ color }}>
              {x?.lastDose ? fmtDateTime(x.lastDose.at, locale) : '—'}
            </div>
            <p className="mt-2 text-[13px] text-muted">{t('substance.noCurve')}</p>
          </Card>
        )}

        <section>
          <SectionTitle
            index="01"
            action={
              !readOnly && (
                <Link to={`/protocols/new?compound=${compoundId}`} className="spec text-signal">
                  + {t('common.add')}
                </Link>
              )
            }
          >
            {t('substance.protocols')}
          </SectionTitle>
          {protocols.length === 0 ? (
            <Card className="text-[13.5px] text-muted">
              <div className="flex items-center gap-3">
                <FlaskConical className="size-5 text-signal" />
                {t('substance.noProtocol')}
              </div>
            </Card>
          ) : (
            <div className="flex flex-col gap-2">
              {protocols.map((p) => {
                const pl = toProtocolLike(p)
                return (
                  <Link
                    key={p.id}
                    to={`/protocols/${p.id}`}
                    className="card flex items-center justify-between gap-3 p-3.5"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-[14.5px] font-semibold">{p.name}</div>
                      <div className="readout truncate text-[12px] text-muted">
                        {scheduleLabel(pl.steps, pl.times)}
                      </div>
                    </div>
                    <Badge tone={p.status === 'active' ? 'ok' : 'neutral'}>
                      {t(`protocols.statuses.${p.status}`)}
                    </Badge>
                  </Link>
                )
              })}
            </div>
          )}
        </section>

        <section>
          <SectionTitle
            index="02"
            action={
              !readOnly && (
                <Link to="/inventory" className="spec text-signal">
                  {t('today.manage')}
                </Link>
              )
            }
          >
            {t('substance.vials')}
          </SectionTitle>
          {vials.length === 0 ? (
            <Card className="text-[13.5px] text-muted">
              <div className="flex items-center gap-3">
                <Package className="size-5 text-signal" />
                {t('substance.noVial')}
              </div>
            </Card>
          ) : (
            <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4">
              {vials.map((v) => {
                return (
                  <div key={v.id} className="card flex w-[200px] shrink-0 items-center gap-3 p-3.5">
                    <Vial {...vialLook(v)} size={48} />
                    <div className="min-w-0">
                      <div className="truncate text-[13.5px] font-semibold">{v.label}</div>
                      <div className="readout text-[16px] font-semibold" style={{ color }}>
                        {fmtNumber(Number(v.remaining_mg), locale, 2)} mg
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {recent.length > 0 && (
          <section>
            <SectionTitle index="03">{t('substance.recent')}</SectionTitle>
            <Card padded={false} className="px-4">
              <ul className="divide-y divide-line">
                {recent.map((d) => (
                  <li key={d.id} className="flex items-center justify-between py-2.5">
                    <span className="readout text-[13px] text-ink-2">
                      {fmtDateTime(new Date(d.administered_at), locale)}
                    </span>
                    <span className="flex items-center gap-2">
                      {d.site_id && <span className="spec">{t(`sites.labels.${d.site_id}`)}</span>}
                      <span className="readout text-[14px] font-semibold">
                        {fmtDose(Number(d.dose_mg), compound.defaultUnit, locale)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        <section>
          <SectionTitle index="04">{t('today.learn')}</SectionTitle>
          <Card className="cursor-pointer" onClick={() => nav(`/wiki/${compoundId}`)}>
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge tone={evidenceTone(compound.evidence)}>
                {t(`wiki.evidenceTiers.${compound.evidence}`)}
              </Badge>
              <Badge tone={regulatoryTone(compound.regulatory.us)}>
                {t('wiki.us')}: {t(`wiki.regulatoryStatus.${compound.regulatory.us}`)}
              </Badge>
            </div>
            <p className="line-clamp-4 text-[13.5px] leading-relaxed text-ink-2">
              {pick(compound.summary)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {compound.pk && (
                <span className="spec">
                  T½ <span className="text-ink">{fmtHours(compound.pk.halfLifeH, locale)}</span>
                </span>
              )}
              <span className="spec">
                {t('wiki.routes')}{' '}
                <span className="text-ink">
                  {compound.routes.map((r) => t(`wiki.routeNames.${r}`)).join(', ')}
                </span>
              </span>
              <span className="spec flex items-center gap-1 text-signal">
                <BookOpen className="size-3" /> {t('today.readMore')}
              </span>
            </div>
          </Card>
        </section>
      </div>

      <LogDoseSheet
        open={logging}
        onClose={() => setLogging(false)}
        protocolId={protocols.find((p) => p.status === 'active')?.id}
        compoundId={compoundId}
      />
    </div>
  )
}
