import { ChevronRight, ExternalLink, FlaskConical, Plus, Syringe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { Meter } from '@/components/kpi/Meter'
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
import {
  activeVial,
  fillOf,
  remainingOf,
  vialContents,
  vialHas,
  vialLook,
} from '@/features/inventory/vials'
import { useScheduleLabel } from '@/features/protocols/scheduleLabel'
import { EvidenceTag } from '@/features/wiki/EvidenceMeter'
import { fmtDateTime, fmtDose, fmtDoseValue, fmtHours } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { recentAdministrations } from './recent'

const RECENT = 8
const ROW_LINK =
  '-mx-2 flex min-h-[60px] w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60'

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
  // The vials on the shelf; finished ones are history and live in the inventory.
  const shelf = useMemo(() => vials.filter((v) => !v.archived), [vials])
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
        title={
          <span className="flex items-center gap-2.5">
            <SubstanceDot color={color} size={10} />
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

      <div className="flex flex-col gap-5">
        {exposure.isPending ? (
          <ExposureCardSkeleton />
        ) : !x ? (
          <Card>
            <div className="flex items-start gap-3">
              <FlaskConical className="mt-0.5 size-5 shrink-0 text-muted" aria-hidden />
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold leading-snug">
                  {t('substance.notInUse.title')}
                </h2>
                <p className="mt-1 text-[13.5px] leading-snug text-muted">
                  {t('substance.notInUse.body')}
                </p>
              </div>
            </div>
          </Card>
        ) : rides ? (
          <Card>
            <div className="flex items-start gap-3">
              <span className="mt-1.5">
                <SubstanceDot color={color} size={10} />
              </span>
              <div className="min-w-0">
                <h2 className="text-[16px] font-semibold leading-snug">
                  {t('substance.partner.title', { name: rides.name })}
                </h2>
                <p className="mt-1 text-[13.5px] leading-snug text-muted">
                  {t('substance.partner.body')}
                </p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link
                to={`/substance/${rides.compound_id}`}
                className="inline-flex h-11 items-center gap-1.5 rounded-full border border-line bg-panel-2 px-4 text-[13.5px] font-semibold text-ink outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
              >
                {t('substance.partner.open')}
                <ExternalLink className="size-3.5 text-muted" aria-hidden />
              </Link>
              <Link
                to={`/protocols/${rides.id}`}
                className="inline-flex h-11 items-center rounded-full px-4 text-[13.5px] font-semibold text-ink-2 outline-none hover:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
              >
                {t('substance.partner.protocol')}
              </Link>
            </div>
          </Card>
        ) : (
          <div className="flex flex-col gap-2">
            {x.partnerOf && (
              <Link
                to={`/substance/${x.partnerOf.compound_id}`}
                className="tap-link flex items-center gap-1.5 px-1 text-[13px] font-medium text-signal"
              >
                {t('substance.partner.title', { name: x.partnerOf.name })}
                <ChevronRight className="size-3.5" aria-hidden />
              </Link>
            )}
            <ExposureCard
              x={x}
              symptoms={symptoms.data ?? []}
              vials={allVials ?? []}
              showTitle={x.title !== compound.names.generic}
              readOnly
            />
          </div>
        )}

        <section>
          <SectionTitle
            action={
              !readOnly && (
                <Link
                  to={`/protocols/new?compound=${compoundId}`}
                  className="spec inline-flex items-center gap-1 text-signal"
                >
                  <Plus className="size-3.5" aria-hidden />
                  {t('common.add')}
                </Link>
              )
            }
          >
            {t('substance.protocols')}
          </SectionTitle>
          <Card padded={protocols.length === 0} className={protocols.length > 0 ? 'px-4' : ''}>
            {protocols.length === 0 ? (
              <p className="text-[13.5px] text-muted">{t('substance.noProtocol')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {protocols.map((p) => {
                  const pl = toProtocolLike(p)
                  return (
                    <li key={p.id}>
                      <Link to={`/protocols/${p.id}`} className={ROW_LINK}>
                        <span className="min-w-0 flex-1">
                          <span className="block text-[15px] font-semibold leading-snug">
                            {p.name}
                          </span>
                          <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
                            {scheduleLabel(pl.steps, pl.times)}
                          </span>
                        </span>
                        {p.status !== 'active' && (
                          <Badge className="shrink-0">{t(`protocols.statuses.${p.status}`)}</Badge>
                        )}
                        <ChevronRight className="size-4 shrink-0 text-muted/70" aria-hidden />
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </section>

        <section>
          <SectionTitle
            action={
              !readOnly && (
                <Link to="/inventory" className="spec text-signal">
                  {t('substance.manage')}
                </Link>
              )
            }
          >
            {t('substance.vials')}
          </SectionTitle>
          <Card padded={shelf.length === 0} className={shelf.length > 0 ? 'px-4' : ''}>
            {shelf.length === 0 ? (
              <p className="text-[13.5px] text-muted">{t('substance.noVial')}</p>
            ) : (
              <ul className="divide-y divide-line">
                {shelf.map((v) => {
                  const look = vialLook(v)
                  const inUse = v.id === open?.id
                  // In a blend, what is left of THIS compound (its partners go down with it).
                  const total = vialContents(v).find((c) => c.compoundId === compoundId)?.mg ?? 0
                  return (
                    <li key={v.id} className="flex items-center gap-3.5 py-3.5">
                      <Vial {...look} size={44} low={low && inUse} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="min-w-0 text-[14.5px] font-semibold leading-snug">
                            {v.label}
                          </span>
                          {inUse && (
                            <span className="shrink-0 text-[12px] font-medium text-muted">
                              {t('substance.inUse')}
                            </span>
                          )}
                        </div>
                        <div className="readout mt-1 text-[13px] text-muted">
                          <span className="text-[16px] font-semibold text-ink">
                            {fmtDoseValue(remainingOf(v, compoundId), 'mg', locale)}
                          </span>{' '}
                          {t('substance.ofTotal', {
                            total: fmtDose(total, 'mg', locale),
                          })}
                        </div>
                        <Meter value={fillOf(v)} color={look.color} height={4} className="mt-2" />
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}
          </Card>
        </section>

        {recent.length > 0 && (
          <section>
            <SectionTitle>{t('substance.recent')}</SectionTitle>
            <Card padded={false} className="px-4">
              <ul className="divide-y divide-line">
                {recent.map((r) => (
                  <li key={r.id} className="flex items-center justify-between gap-3 py-3">
                    <span className="min-w-0">
                      <span className="readout block text-[13.5px] text-ink-2">
                        {fmtDateTime(r.at, locale)}
                      </span>
                      {r.siteId && (
                        <span className="block text-[12px] text-muted">
                          {t(`sites.labels.${r.siteId}`)}
                        </span>
                      )}
                    </span>
                    <span className="readout shrink-0 text-right text-[15px] font-semibold">
                      {describeDoses(r.doses, locale)}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        )}

        <section>
          <SectionTitle>{t('substance.learn')}</SectionTitle>
          <Link
            to={`/wiki/${compoundId}`}
            className="card block p-4 outline-none transition active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-signal/60"
          >
            <p className="line-clamp-3 text-[14px] leading-relaxed text-ink-2">
              {pick(compound.summary)}
            </p>
            <div className="mt-3.5 flex flex-wrap items-end justify-between gap-x-4 gap-y-2 border-t border-line pt-3.5">
              <span className="flex flex-wrap items-end gap-x-4 gap-y-2 text-[12.5px] text-muted">
                <EvidenceTag tier={compound.evidence} layout="inline" />
                {compound.pk && (
                  <span className="leading-none">
                    T½{' '}
                    <span className="readout font-semibold text-ink-2">
                      {fmtHours(compound.pk.halfLifeH, locale)}
                    </span>
                  </span>
                )}
                <span className="leading-none">
                  {compound.routes.map((r) => t(`wiki.routeNames.${r}`)).join(', ')}
                </span>
              </span>
              <span className="flex items-center gap-0.5 text-[13px] font-semibold leading-none text-signal">
                {t('substance.readMore')}
                <ChevronRight className="size-4" aria-hidden />
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
