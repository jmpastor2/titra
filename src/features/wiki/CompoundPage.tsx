import { AlertTriangle, ChevronRight, ExternalLink, FlaskConical, LineChart } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, SectionTitle, Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { blendsContaining, compoundById } from '@/content/compounds'
import { templatesForCompound } from '@/content/protocols/templates'
import type { CompoundDetail } from '@/content/schema'
import { categoryColor } from '@/content/substanceColor'
import { useCompoundNotes } from '@/data/hooks'
import { steadyState } from '@/domain/pk/engine'
import { fmtDate, fmtDose, fmtHours, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { BlendCalculator, BlendComponents, InBlends } from './BlendParts'
import { ClinicianNotes } from './ClinicianNotes'
import { Fold } from './Fold'
import { KeyFacts } from './KeyFacts'
import { BulletList, ClampedText, FactGrid, Section } from './parts'
import { regulatoryTone } from './tones'
import { useCompoundDetail } from './useCompoundDetail'

/** A long status wraps inside its badge instead of pushing the page wider than the screen. */
const WRAP = 'max-w-full whitespace-normal! text-left leading-snug'

/** Contraindications shown up front; the rest wait in the safety fold. */
const CAUTIONS_SHOWN = 3

/**
 * The header, badges and warnings come from the light registry and show at once; the body needs
 * the full entry (long texts, trials, references), which loads on demand.
 */
export function CompoundPage() {
  const { compoundId = '' } = useParams()
  const { t } = useTranslation()
  const { pick } = useLocale()
  const { patient } = usePatientScope()
  const compound = compoundById(compoundId)
  const { detail, failed, retry } = useCompoundDetail(compound?.id)
  const notes = useCompoundNotes(compoundId)

  if (!compound) return <Navigate to="/wiki" replace />

  return (
    <div className="pb-4">
      <PageHeader
        title={
          <span className="block whitespace-normal text-balance">{compound.names.generic}</span>
        }
        back="/wiki"
      />

      <p className="-mt-2 mb-3 text-[13.5px] leading-snug text-muted">
        {pick(compound.pharmClass)}
      </p>

      <div className="mb-4 flex flex-wrap gap-1.5">
        <Badge className={WRAP}>
          <SubstanceDot color={categoryColor(compound.category)} size={6} />
          {t(`wiki.categories.${compound.category}`)}
        </Badge>
        <Badge tone={regulatoryTone(compound.regulatory.us)} className={WRAP}>
          <span className="opacity-70">{t('wiki.us')}</span>
          {t(`wiki.regulatoryStatus.${compound.regulatory.us}`)}
        </Badge>
        {compound.regulatory.eu && (
          <Badge tone={regulatoryTone(compound.regulatory.eu)} className={WRAP}>
            <span className="opacity-70">{t('wiki.eu')}</span>
            {t(`wiki.regulatoryStatus.${compound.regulatory.eu}`)}
          </Badge>
        )}
      </div>

      {compound.blend && (
        <p className="mb-4 flex gap-2.5 px-1 text-[13px] leading-snug text-ink-2">
          <FlaskConical className="mt-px size-4 shrink-0 text-warn" aria-hidden />
          {t('wiki.blendNoTrials')}
        </p>
      )}

      {detail ? (
        <CompoundBody
          compound={detail}
          notes={notes.data ?? []}
          isClinician={patient?.role === 'clinician'}
        />
      ) : (
        <DetailPending failed={failed} onRetry={retry} />
      )}
    </div>
  )
}

/** Placeholder for the cards below the header while the full entry loads (or failed to). */
function DetailPending({ failed, onRetry }: { failed: boolean; onRetry: () => void }) {
  const { t } = useTranslation()
  if (failed) {
    return (
      <Card>
        <p className="text-[13.5px] text-ink-2">{t('wiki.loadFailed')}</p>
        <Button size="sm" variant="secondary" className="mt-3" onClick={onRetry}>
          {t('common.retry')}
        </Button>
      </Card>
    )
  }
  return (
    <div
      className="flex flex-col gap-3"
      role="status"
      aria-busy="true"
      aria-label={t('common.loading')}
    >
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-14 w-full" />
      <Skeleton className="h-14 w-full" />
    </div>
  )
}

function CompoundBody({
  compound,
  notes,
  isClinician,
}: {
  compound: CompoundDetail
  notes: { id: string; body: string; clinician_id: string }[]
  isClinician: boolean
}) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  const { readOnly } = usePatientScope()
  const templates = templatesForCompound(compound.id)
  const inBlends = compound.blend ? [] : blendsContaining(compound.id)
  const { dosing } = compound
  const cautions = compound.contraindications.slice(0, CAUTIONS_SHOWN)
  const moreCautions = compound.contraindications.length - cautions.length
  const pkFacts = compound.pk
    ? [
        compound.pk.tmaxH !== undefined && {
          label: t('wiki.tmax'),
          value: fmtHours(compound.pk.tmaxH, locale),
        },
        compound.pk.bioavailability !== undefined && {
          label: t('wiki.bioavailability'),
          value: fmtPercent(compound.pk.bioavailability, locale),
        },
        compound.pk.apparentVolumeL !== undefined && {
          label: 'V/F',
          value: `${fmtNumber(compound.pk.apparentVolumeL, locale, 1)} L`,
        },
      ].filter((f) => f !== false)
    : []

  return (
    <div className="flex flex-col gap-3">
      <KeyFacts compound={compound} templates={templates} />

      <Card>
        <ClampedText text={pick(compound.summary)} className="text-[14.5px] text-ink-2" />
        {(compound.names.brands.length > 0 || compound.names.aliases.length > 0) && (
          <dl className="mt-3.5 flex flex-col gap-2 border-t border-line pt-3.5 text-[13px] leading-snug">
            {compound.names.brands.length > 0 && (
              <div>
                <dt className="spec">{t('wiki.brands')}</dt>
                <dd className="mt-0.5 text-ink-2">{compound.names.brands.join(' · ')}</dd>
              </div>
            )}
            {compound.names.aliases.length > 0 && (
              <div>
                <dt className="spec">{t('wiki.aliases')}</dt>
                <dd className="mt-0.5 text-muted">{compound.names.aliases.join(' · ')}</dd>
              </div>
            )}
          </dl>
        )}
      </Card>

      {cautions.length > 0 && (
        <Card
          title={
            <span className="flex items-center gap-2">
              <AlertTriangle className="size-4 shrink-0 text-warn" aria-hidden />
              {t('wiki.watch')}
            </span>
          }
        >
          <BulletList items={cautions} pick={pick} />
          {moreCautions > 0 && (
            <p className="mt-2.5 text-[12.5px] text-muted">
              {t('wiki.watchMore', { count: moreCautions })}
            </p>
          )}
        </Card>
      )}

      {compound.blend && <BlendComponents blend={compound.blend} />}

      {inBlends.length > 0 && <InBlends blends={inBlends} />}

      <ClinicianNotes compoundId={compound.id} isClinician={isClinician} notes={notes} />

      {templates.length > 0 && !readOnly && (
        <Card title={t('wiki.templates')} subtitle={t('protocols.templateHint')}>
          <ul className="-mb-1 divide-y divide-line border-t border-line">
            {templates.map((tpl) => (
              <li key={tpl.id}>
                <button
                  type="button"
                  onClick={() => nav(`/protocols/new?template=${tpl.id}`)}
                  className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
                >
                  <span className="min-w-0 flex-1">
                    <span className="block text-[14.5px] font-semibold leading-snug">
                      {pick(tpl.name)}
                    </span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
                      {pick(tpl.source)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-0.5 text-[13px] font-semibold text-signal">
                    {t('wiki.useTemplate')}
                    <ChevronRight className="size-4" aria-hidden />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {compound.blend && <BlendCalculator blend={compound.blend} />}

      <section className="mt-2">
        <SectionTitle>{t('wiki.fullEntry')}</SectionTitle>
        <Card padded={false} className="px-4">
          <div className="divide-y divide-line">
            <Fold title={t('wiki.dosing')}>
              {dosing.labeled && (
                <Section title={t('wiki.dosingLabeled')}>{pick(dosing.labeled)}</Section>
              )}
              {dosing.investigational && (
                <Section title={t('wiki.dosingInvestigational')}>
                  {pick(dosing.investigational)}
                </Section>
              )}
              {dosing.anecdotal && (
                <Section
                  tone="warn"
                  title={
                    <>
                      <AlertTriangle className="size-3.5 shrink-0" aria-hidden />
                      {t('wiki.dosingAnecdotal')}
                    </>
                  }
                >
                  <p>{pick(dosing.anecdotal)}</p>
                  <p className="mt-1.5 text-[12.5px] leading-snug text-warn">
                    {t('wiki.anecdotalWarning')}
                  </p>
                </Section>
              )}
            </Fold>

            <Fold title={t('wiki.safety')}>
              <Section title={t('wiki.common')}>
                <BulletList items={compound.adverseEffects.common} pick={pick} />
              </Section>
              <Section title={t('wiki.serious')} tone="danger">
                <BulletList items={compound.adverseEffects.serious} pick={pick} />
              </Section>
              <Section title={t('wiki.contraindications')}>
                <BulletList items={compound.contraindications} pick={pick} />
              </Section>
              {compound.interactions.length > 0 && (
                <Section title={t('wiki.interactions')}>
                  <BulletList items={compound.interactions} pick={pick} />
                </Section>
              )}
              {compound.monitoring && compound.monitoring.length > 0 && (
                <Section title={t('wiki.monitoring')}>
                  <BulletList items={compound.monitoring} pick={pick} />
                </Section>
              )}
            </Fold>

            <Fold title={t('wiki.mechanism')}>
              <p className="text-[14px] leading-relaxed text-ink-2">{pick(compound.mechanism)}</p>
              <Section title={t('wiki.indications')}>
                <BulletList items={compound.indications} pick={pick} />
              </Section>
            </Fold>

            {compound.pk && (
              <Fold title={t('wiki.pk')}>
                {pkFacts.length > 0 && <FactGrid items={pkFacts} />}
                {templates[0] && <SteadyStatePreview compound={compound} />}
                {(compound.pk.notes || compound.pk.source) && (
                  <div className="flex flex-col gap-1.5 text-[12.5px] leading-snug text-muted">
                    {compound.pk.notes && <p>{compound.pk.notes}</p>}
                    {compound.pk.source && (
                      <p>
                        {t('wiki.pkSource')}: {compound.pk.source}
                      </p>
                    )}
                  </div>
                )}
                {!readOnly && (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="self-start"
                    leading={<LineChart className="size-4" />}
                    onClick={() => nav('/simulator')}
                  >
                    {t('wiki.simulate')}
                  </Button>
                )}
              </Fold>
            )}

            <Fold title={t('wiki.storageRecon')}>
              {compound.reconstitution && (
                <Section title={t('wiki.reconstitution')}>
                  {pick(compound.reconstitution)}
                  {!readOnly && (
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-2.5"
                      onClick={() => nav('/calculator')}
                    >
                      {t('calculator.title')}
                    </Button>
                  )}
                </Section>
              )}
              <Section title={t('wiki.storage')}>{pick(compound.storage)}</Section>
            </Fold>

            {compound.keyTrials.length > 0 && (
              <Fold title={t('wiki.trials')} aside={compound.keyTrials.length}>
                <ul className="flex flex-col gap-3.5">
                  {compound.keyTrials.map((trial) => (
                    <li key={`${trial.name}-${trial.year}`}>
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-[14px] font-semibold leading-snug">{trial.name}</span>
                        <span className="readout text-[12px] text-muted">{trial.year}</span>
                      </div>
                      <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">
                        {pick(trial.finding)}
                      </p>
                      {trial.ref && <p className="mt-0.5 text-[11.5px] text-muted">{trial.ref}</p>}
                    </li>
                  ))}
                </ul>
              </Fold>
            )}

            <Fold title={t('wiki.references')} aside={compound.references.length}>
              <ul className="flex flex-col gap-2.5">
                {compound.references.map((r) => (
                  <li key={r.label}>
                    {r.url ? (
                      <a
                        href={r.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="inline-flex items-start gap-1.5 text-[13.5px] leading-snug text-signal underline decoration-signal/30 underline-offset-2"
                      >
                        {r.label}
                        <ExternalLink className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                      </a>
                    ) : (
                      <span className="text-[13.5px] leading-snug text-ink-2">{r.label}</span>
                    )}
                  </li>
                ))}
              </ul>
              <p className="text-[12px] text-muted">
                {t('wiki.lastReviewed', {
                  date: fmtDate(new Date(compound.lastReviewed), locale),
                })}
              </p>
            </Fold>
          </div>
        </Card>
      </section>

      <p className="px-2 pt-2 text-center text-[11.5px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>
    </div>
  )
}

/** Trough, mean and peak at the end of the first template, from the entry's own PK numbers. */
function SteadyStatePreview({ compound }: { compound: CompoundDetail }) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const tpl = templatesForCompound(compound.id)[0]
  if (!compound.pk || !tpl) return null
  const last = tpl.steps[tpl.steps.length - 1]
  if (!last) return null
  const ss = steadyState(last.doseMg, last.intervalDays * 24, compound.pk)
  const mg = (x: number) => `${fmtNumber(x, locale, 2)} mg`
  return (
    <div className="border-t border-line pt-3.5">
      <h4 className="spec mb-2.5">
        {t('protocols.previewHint')} · {pick(tpl.name)} ·{' '}
        {fmtDose(last.doseMg, compound.defaultUnit, locale)}
      </h4>
      <FactGrid
        columns={3}
        items={[
          { label: t('protocols.ssTrough'), value: mg(ss.troughMg) },
          { label: t('protocols.ssAvg'), value: mg(ss.avgMg) },
          { label: t('protocols.ssPeak'), value: mg(ss.peakMg) },
        ]}
      />
      <p className="mt-2.5 text-[12.5px] leading-snug text-muted">
        {t('protocols.ssTime', { time: fmtHours(ss.hoursTo90, locale) })}
      </p>
    </div>
  )
}
