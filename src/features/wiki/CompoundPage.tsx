import { AlertTriangle, ExternalLink, FlaskConical, LineChart, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, Skeleton, SubstanceDot } from '@/components/ui/primitives'
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
import { BulletList, ClampedText, MiniStat, PkStat, Section } from './parts'
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
        eyebrow={
          <span className="inline-flex items-center gap-1.5">
            <SubstanceDot color={categoryColor(compound.category)} size={7} />
            {t(`wiki.categories.${compound.category}`)}
          </span>
        }
        title={
          <span className="block whitespace-normal text-balance">{compound.names.generic}</span>
        }
        back="/wiki"
      />

      <p className="-mt-2 mb-3 text-[13.5px] leading-snug text-muted">
        {pick(compound.pharmClass)}
      </p>

      <div className="mb-3 flex flex-wrap gap-1.5">
        {compound.blend && <Badge tone="accent">{t('wiki.blendBadge')}</Badge>}
        <Badge tone={regulatoryTone(compound.regulatory.us)} className={WRAP}>
          {t('wiki.us')}: {t(`wiki.regulatoryStatus.${compound.regulatory.us}`)}
        </Badge>
        {compound.regulatory.eu && (
          <Badge tone={regulatoryTone(compound.regulatory.eu)} className={WRAP}>
            {t('wiki.eu')}: {t(`wiki.regulatoryStatus.${compound.regulatory.eu}`)}
          </Badge>
        )}
      </div>

      {compound.blend && (
        <Card tone="warn" className="mb-3">
          <div className="flex gap-2.5">
            <FlaskConical className="mt-0.5 size-5 shrink-0 text-warn" aria-hidden />
            <p className="text-[13.5px] leading-snug">{t('wiki.blendNoTrials')}</p>
          </div>
        </Card>
      )}

      {compound.regulatory.us === 'research_only' && (
        <Card tone="danger" className="mb-3">
          <div className="flex gap-2.5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" aria-hidden />
            <p className="text-[13.5px] leading-snug">{t('wiki.regulatoryStatus.research_only')}</p>
          </div>
        </Card>
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
      <Card tone="warn">
        <p className="text-[13.5px]">{t('wiki.loadFailed')}</p>
        <Button size="sm" variant="soft" className="mt-3" onClick={onRetry}>
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

  return (
    <div className="flex flex-col gap-3">
      <KeyFacts compound={compound} templates={templates} />

      <Card>
        <ClampedText text={pick(compound.summary)} className="text-[14.5px] text-ink-2" />
        {(compound.names.brands.length > 0 || compound.names.aliases.length > 0) && (
          <dl className="mt-3 flex flex-col gap-1.5 text-[13px] leading-snug">
            {compound.names.brands.length > 0 && (
              <div>
                <dt className="spec">{t('wiki.brands')}</dt>
                <dd className="mt-0.5">{compound.names.brands.join(' · ')}</dd>
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
        <Card tone="warn" title={t('wiki.watch')}>
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
          <ul className="flex flex-col gap-2">
            {templates.map((tpl) => (
              <li key={tpl.id}>
                <button
                  type="button"
                  onClick={() => nav(`/protocols/new?template=${tpl.id}`)}
                  className="flex min-h-14 w-full items-center justify-between gap-3 rounded-control border border-line px-3 py-2.5 text-left transition active:scale-[0.99]"
                >
                  <span className="min-w-0">
                    <span className="block text-[14px] font-semibold leading-snug">
                      {pick(tpl.name)}
                    </span>
                    <span className="mt-0.5 block text-[12px] leading-snug text-muted">
                      {pick(tpl.source)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-signal">
                    <Plus className="size-4" aria-hidden /> {t('wiki.useTemplate')}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
      )}

      {compound.blend && <BlendCalculator blend={compound.blend} />}

      <Fold title={t('wiki.dosing')}>
        {dosing.labeled && (
          <Section title={t('wiki.dosingLabeled')}>{pick(dosing.labeled)}</Section>
        )}
        {dosing.investigational && (
          <Section title={t('wiki.dosingInvestigational')}>{pick(dosing.investigational)}</Section>
        )}
        {dosing.anecdotal && (
          <div className="rounded-control bg-warn-soft p-3.5">
            <div className="spec mb-1.5 flex items-center gap-1.5 text-warn">
              <AlertTriangle className="size-3.5 shrink-0" aria-hidden />{' '}
              {t('wiki.dosingAnecdotal')}
            </div>
            <p className="text-[13.5px] leading-relaxed">{pick(dosing.anecdotal)}</p>
            <p className="mt-2 text-[12px] leading-snug text-warn">{t('wiki.anecdotalWarning')}</p>
          </div>
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
          {(compound.pk.tmaxH !== undefined ||
            compound.pk.bioavailability !== undefined ||
            compound.pk.apparentVolumeL !== undefined) && (
            <div className="grid grid-cols-2 gap-2.5">
              {compound.pk.tmaxH !== undefined && (
                <PkStat label={t('wiki.tmax')} value={fmtHours(compound.pk.tmaxH, locale)} />
              )}
              {compound.pk.bioavailability !== undefined && (
                <PkStat
                  label={t('wiki.bioavailability')}
                  value={fmtPercent(compound.pk.bioavailability, locale)}
                />
              )}
              {compound.pk.apparentVolumeL !== undefined && (
                <PkStat
                  label="V/F"
                  value={`${fmtNumber(compound.pk.apparentVolumeL, locale, 1)} L`}
                />
              )}
            </div>
          )}
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
              variant="soft"
              size="sm"
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
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => nav('/calculator')}>
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
                <div className="flex items-baseline gap-2">
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
                  className="inline-flex items-start gap-1.5 text-[13.5px] leading-snug text-signal underline underline-offset-2"
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
        <p className="text-[11.5px] text-muted">
          {t('wiki.lastReviewed', { date: fmtDate(new Date(compound.lastReviewed), locale) })}
        </p>
      </Fold>

      <p className="px-2 text-center text-[11px] leading-relaxed text-muted">
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
  return (
    <div className="rounded-control bg-panel-2 p-3.5">
      <div className="spec">
        {t('protocols.previewHint')} · {pick(tpl.name)}
      </div>
      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <MiniStat
          label={t('protocols.ssTrough')}
          value={`${fmtNumber(ss.troughMg, locale, 2)} mg`}
        />
        <MiniStat label={t('protocols.ssAvg')} value={`${fmtNumber(ss.avgMg, locale, 2)} mg`} />
        <MiniStat label={t('protocols.ssPeak')} value={`${fmtNumber(ss.peakMg, locale, 2)} mg`} />
      </div>
      <p className="mt-3 text-center text-[11.5px] leading-snug text-muted">
        {t('protocols.ssTime', { time: fmtHours(ss.hoursTo90, locale) })} ·{' '}
        {fmtDose(last.doseMg, compound.defaultUnit, locale)}
      </p>
    </div>
  )
}
