import { BookOpen, ExternalLink, FlaskConical, Package, Syringe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router-dom'
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
import { ExposureCard, ExposureCardSkeleton } from '@/features/exposure/ExposureCard'
import { levelKind, upcomingDoses, vialIsLow } from '@/features/exposure/levelSummary'
import { describeDoses } from '@/features/exposure/units'
import { useExposure } from '@/features/exposure/useExposure'
import { activeVial, vialHas, vialLook } from '@/features/inventory/vials'
import { useScheduleLabel } from '@/features/protocols/scheduleLabel'
import { evidenceTone, regulatoryTone } from '@/features/wiki/tones'
import { fmtDateTime, fmtHours, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { recentAdministrations } from './recent'

const RECENT = 8
/** A long status wraps inside its badge instead of pushing the page wider than the screen. */
const WRAP = 'max-w-full whitespace-normal! text-left leading-snug'

export function SubstancePage() {
  const { compoundId = '' } = useParams()
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const { patientId, readOnly } = usePatientScope()
  const clock = useNow()
  const exposure = useExposure(patientId, clock)
  const now = exposure.now
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
  const allVials = inventory.data
  const vials = useMemo(
    () => (allVials ?? []).filter((v) => vialHas(v, compoundId)),
    [allVials, compoundId],
  )
  const open = useMemo(() => activeVial(vials, compoundId), [vials, compoundId])
  const low = useMemo(
    () => (x && open ? vialIsLow(open, compoundId, upcomingDoses(x, now), now) : false),
    [x, open, compoundId, now],
  )
  const recent = useMemo(() => (x ? recentAdministrations(x, RECENT) : []), [x])

  if (!compound) return <Navigate to="/" replace />

  const logProtocol = protocols.find((p) => p.status === 'active')
  // A compound that rides in another protocol's syringe has no level of its own to show.
  const rides = x?.partnerOf && levelKind(x) === 'timeline' ? x.partnerOf : null

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
              aria-label={t('doses.log')}
              leading={<Syringe className="size-[18px]" />}
              className="w-11 px-0! sm:w-auto sm:px-5!"
              onClick={() => setLogging(true)}
            >
              <span className="hidden sm:inline">{t('doses.log')}</span>
            </Button>
          )
        }
      />

      <div className="flex flex-col gap-4">
        {exposure.isPending ? (
          <ExposureCardSkeleton />
        ) : !x ? (
          <Card instrument>
            <div className="flex items-center gap-3">
              <span className="grid size-11 shrink-0 place-items-center rounded-2xl border border-signal/25 bg-signal-soft text-signal">
                <FlaskConical className="size-5" />
              </span>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold">{t('substance.notInUse.title')}</h2>
                <p className="mt-0.5 text-[13px] text-muted">{t('substance.notInUse.body')}</p>
              </div>
            </div>
          </Card>
        ) : rides ? (
          <Card>
            <div className="flex items-start gap-3">
              <SubstanceDot color={color} size={11} />
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold leading-snug">
                  {t('substance.partner.title', { name: rides.name })}
                </h2>
                <p className="mt-1 text-[13px] text-muted">{t('substance.partner.body')}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                to={`/substance/${rides.compound_id}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-signal/20 bg-signal-soft px-4 text-[13px] font-semibold text-signal"
              >
                {t('substance.partner.open')}
                <ExternalLink className="size-3.5" />
              </Link>
              <Link
                to={`/protocols/${rides.id}`}
                className="inline-flex h-11 items-center rounded-full border border-line-strong bg-panel-2 px-4 text-[13px] font-semibold text-ink-2"
              >
                {t('substance.partner.protocol')}
              </Link>
            </div>
          </Card>
        ) : (
          <>
            {x.partnerOf && (
              <Link
                to={`/substance/${x.partnerOf.compound_id}`}
                className="spec flex items-center gap-1.5 px-1 text-signal"
              >
                {t('substance.partner.title', { name: x.partnerOf.name })}
                <ExternalLink className="size-3" />
              </Link>
            )}
            <ExposureCard
              x={x}
              symptoms={symptoms.data ?? []}
              vials={allVials ?? []}
              showTitle={x.title !== compound.names.generic}
              readOnly
            />
          </>
        )}

        <section>
          <SectionTitle
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
                      <div className="text-[14.5px] font-semibold leading-snug">{p.name}</div>
                      <div className="readout mt-0.5 text-[12px] leading-snug text-muted">
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
              {vials.map((v) => (
                <div key={v.id} className="card flex w-[200px] shrink-0 items-center gap-3 p-3.5">
                  <Vial {...vialLook(v)} size={48} low={low && v.id === open?.id} />
                  <div className="min-w-0">
                    <div className="line-clamp-2 text-[13.5px] font-semibold leading-snug">
                      {v.label}
                    </div>
                    <div className="readout text-[16px] font-semibold" style={{ color }}>
                      {fmtNumber(Number(v.remaining_mg), locale, 2)} mg
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {recent.length > 0 && (
          <section>
            <SectionTitle>{t('substance.recent')}</SectionTitle>
            <Card padded={false} className="px-4">
              <ul className="divide-y divide-line">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="readout text-[13px] text-ink-2">
                      {fmtDateTime(r.at, locale)}
                    </span>
                    <span className="flex min-w-0 items-center gap-2">
                      {r.siteId && (
                        <span className="spec text-right">{t(`sites.labels.${r.siteId}`)}</span>
                      )}
                      <span className="readout shrink-0 text-[14px] font-semibold">
                        {describeDoses(r.doses, locale)}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        <section>
          <SectionTitle>{t('today.learn')}</SectionTitle>
          <Link
            to={`/wiki/${compoundId}`}
            className="card block p-4 outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
          >
            <div className="mb-2 flex flex-wrap gap-1.5">
              <Badge tone={evidenceTone(compound.evidence)} className={WRAP}>
                {t(`wiki.evidenceTiers.${compound.evidence}`)}
              </Badge>
              <Badge tone={regulatoryTone(compound.regulatory.us)} className={WRAP}>
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
          </Link>
        </section>
      </div>

      <LogDoseSheet
        open={logging}
        onClose={() => setLogging(false)}
        protocolId={logProtocol?.id}
        compoundId={compoundId}
      />
    </div>
  )
}
