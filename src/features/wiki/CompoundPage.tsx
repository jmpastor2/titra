import { AlertTriangle, ExternalLink, LineChart, Plus } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Field'
import { Badge, Divider } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { templatesForCompound } from '@/content/protocols/templates'
import type { L10n } from '@/content/schema'
import { useCompoundNotes, useSaveCompoundNote } from '@/data/hooks'
import { steadyState } from '@/domain/pk/engine'
import { useSession } from '@/features/auth/SessionProvider'
import { fmtDate, fmtDose, fmtHours, fmtNumber, fmtPercent } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { evidenceTone, regulatoryTone } from './tones'

export function CompoundPage() {
  const { compoundId = '' } = useParams()
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  const { patient, readOnly } = usePatientScope()
  const compound = compoundById(compoundId)
  const notes = useCompoundNotes(compoundId)

  if (!compound) return <Navigate to="/wiki" replace />

  const templates = templatesForCompound(compound.id)
  const isClinician = patient?.role === 'clinician'

  return (
    <div className="pb-4">
      <PageHeader
        title={compound.names.generic}
        subtitle={pick(compound.pharmClass)}
        back="/wiki"
      />

      <div className="mb-3 flex flex-wrap gap-1.5">
        <Badge tone={evidenceTone(compound.evidence)}>
          {t(`wiki.evidenceTiers.${compound.evidence}`)}
        </Badge>
        <Badge tone={regulatoryTone(compound.regulatory.us)}>
          {t('wiki.us')}: {t(`wiki.regulatoryStatus.${compound.regulatory.us}`)}
        </Badge>
        {compound.regulatory.eu && (
          <Badge tone={regulatoryTone(compound.regulatory.eu)}>
            {t('wiki.eu')}: {t(`wiki.regulatoryStatus.${compound.regulatory.eu}`)}
          </Badge>
        )}
        {compound.routes.map((r) => (
          <Badge key={r}>{t(`wiki.routeNames.${r}`)}</Badge>
        ))}
      </div>

      {compound.regulatory.us === 'research_only' && (
        <Card tone="danger" className="mb-3">
          <div className="flex gap-2.5">
            <AlertTriangle className="mt-0.5 size-5 shrink-0 text-danger" />
            <p className="text-[13.5px]">{t('wiki.regulatoryStatus.research_only')}</p>
          </div>
        </Card>
      )}

      <div className="flex flex-col gap-3">
        <Card title={t('wiki.summary')}>
          <p className="text-[14px] leading-relaxed text-ink-2">{pick(compound.summary)}</p>
          {(compound.names.brands.length > 0 || compound.names.aliases.length > 0) && (
            <dl className="mt-3 flex flex-col gap-1 text-[13px]">
              {compound.names.brands.length > 0 && (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold text-muted">{t('wiki.brands')}:</dt>
                  <dd>{compound.names.brands.join(' · ')}</dd>
                </div>
              )}
              {compound.names.aliases.length > 0 && (
                <div className="flex gap-2">
                  <dt className="shrink-0 font-semibold text-muted">{t('wiki.aliases')}:</dt>
                  <dd className="text-muted">{compound.names.aliases.join(' · ')}</dd>
                </div>
              )}
            </dl>
          )}
        </Card>

        <ClinicianNotes
          compoundId={compound.id}
          isClinician={isClinician}
          notes={notes.data ?? []}
        />

        <Card title={t('wiki.mechanism')}>
          <p className="text-[14px] leading-relaxed text-ink-2">{pick(compound.mechanism)}</p>
        </Card>

        <Card title={t('wiki.indications')}>
          <BulletList items={compound.indications} pick={pick} />
        </Card>

        {compound.pk && (
          <Card
            title={t('wiki.pk')}
            action={
              !readOnly && (
                <Button
                  size="sm"
                  variant="soft"
                  leading={<LineChart className="size-4" />}
                  onClick={() => nav('/simulator')}
                >
                  {t('wiki.simulate')}
                </Button>
              )
            }
          >
            <div className="grid grid-cols-2 gap-3">
              <PkStat label={t('wiki.halfLife')} value={fmtHours(compound.pk.halfLifeH, locale)} />
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
            {templates[0] && compound.pk && <SteadyStatePreview compoundId={compound.id} />}
            {compound.pk.notes && (
              <p className="mt-3 text-[12.5px] text-muted">{compound.pk.notes}</p>
            )}
            {compound.pk.source && (
              <p className="mt-2 text-[11.5px] text-muted">
                {t('wiki.pkSource')}: {compound.pk.source}
              </p>
            )}
          </Card>
        )}

        <Card title={t('wiki.dosing')}>
          {compound.dosing.labeled && (
            <Section title={t('wiki.dosingLabeled')}>{pick(compound.dosing.labeled)}</Section>
          )}
          {compound.dosing.investigational && (
            <Section title={t('wiki.dosingInvestigational')}>
              {pick(compound.dosing.investigational)}
            </Section>
          )}
          {compound.dosing.anecdotal && (
            <div className="mt-3 rounded-control bg-warn-soft p-3">
              <div className="mb-1 flex items-center gap-1.5 text-[12px] font-semibold uppercase tracking-wide text-warn">
                <AlertTriangle className="size-3.5" /> {t('wiki.dosingAnecdotal')}
              </div>
              <p className="text-[13.5px] leading-relaxed">{pick(compound.dosing.anecdotal)}</p>
              <p className="mt-1.5 text-[11.5px] text-warn">{t('wiki.anecdotalWarning')}</p>
            </div>
          )}
          {compound.dosing.frequency && (
            <p className="mt-3 text-[13px] text-muted">{pick(compound.dosing.frequency)}</p>
          )}
        </Card>

        {templates.length > 0 && !readOnly && (
          <Card title={t('wiki.templates')} subtitle={t('protocols.templateHint')}>
            <ul className="flex flex-col gap-2">
              {templates.map((tpl) => (
                <li key={tpl.id}>
                  <button
                    type="button"
                    onClick={() => nav(`/protocols/new?template=${tpl.id}`)}
                    className="flex w-full items-center justify-between gap-3 rounded-control border border-line px-3 py-2.5 text-left transition active:scale-[0.99]"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-[14px] font-semibold">
                        {pick(tpl.name)}
                      </span>
                      <span className="block truncate text-[12px] text-muted">
                        {pick(tpl.source)}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[12.5px] font-semibold text-brand-strong">
                      <Plus className="size-4" /> {t('wiki.useTemplate')}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        )}

        {compound.reconstitution && (
          <Card title={t('wiki.reconstitution')}>
            <p className="text-[14px] leading-relaxed text-ink-2">
              {pick(compound.reconstitution)}
            </p>
            {!readOnly && (
              <Button variant="ghost" size="sm" className="mt-2" onClick={() => nav('/calculator')}>
                {t('calculator.title')}
              </Button>
            )}
          </Card>
        )}

        <Card title={t('wiki.storage')}>
          <p className="text-[14px] leading-relaxed text-ink-2">{pick(compound.storage)}</p>
        </Card>

        <Card title={t('wiki.adverse')}>
          <Section title={t('wiki.common')}>
            <BulletList items={compound.adverseEffects.common} pick={pick} />
          </Section>
          <Divider className="my-3" />
          <Section title={t('wiki.serious')} tone="danger">
            <BulletList items={compound.adverseEffects.serious} pick={pick} />
          </Section>
        </Card>

        <Card title={t('wiki.contraindications')} tone="warn">
          <BulletList items={compound.contraindications} pick={pick} />
        </Card>

        {compound.interactions.length > 0 && (
          <Card title={t('wiki.interactions')}>
            <BulletList items={compound.interactions} pick={pick} />
          </Card>
        )}

        {compound.monitoring && compound.monitoring.length > 0 && (
          <Card title={t('wiki.monitoring')}>
            <BulletList items={compound.monitoring} pick={pick} />
          </Card>
        )}

        {compound.keyTrials.length > 0 && (
          <Card title={t('wiki.trials')}>
            <ul className="flex flex-col gap-3">
              {compound.keyTrials.map((trial) => (
                <li key={`${trial.name}-${trial.year}`}>
                  <div className="flex items-baseline gap-2">
                    <span className="text-[14px] font-semibold">{trial.name}</span>
                    <span className="tabular text-[12px] text-muted">{trial.year}</span>
                  </div>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-ink-2">
                    {pick(trial.finding)}
                  </p>
                  {trial.ref && <p className="mt-0.5 text-[11.5px] text-muted">{trial.ref}</p>}
                </li>
              ))}
            </ul>
          </Card>
        )}

        <Card title={t('wiki.references')}>
          <ul className="flex flex-col gap-2">
            {compound.references.map((r) => (
              <li key={r.label}>
                {r.url ? (
                  <a
                    href={r.url}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-start gap-1.5 text-[13.5px] text-brand-strong underline underline-offset-2"
                  >
                    {r.label}
                    <ExternalLink className="mt-0.5 size-3.5 shrink-0" />
                  </a>
                ) : (
                  <span className="text-[13.5px] text-ink-2">{r.label}</span>
                )}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[11.5px] text-muted">
            {t('wiki.lastReviewed', { date: fmtDate(new Date(compound.lastReviewed), locale) })}
          </p>
        </Card>

        <p className="px-2 text-center text-[11px] leading-relaxed text-muted">
          {t('app.disclaimer')}
        </p>
      </div>
    </div>
  )
}

function SteadyStatePreview({ compoundId }: { compoundId: string }) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const compound = compoundById(compoundId)
  const tpl = templatesForCompound(compoundId)[0]
  if (!compound?.pk || !tpl) return null
  const last = tpl.steps[tpl.steps.length - 1]
  if (!last) return null
  const ss = steadyState(last.doseMg, last.intervalDays * 24, compound.pk)
  return (
    <div className="mt-3 rounded-control bg-surface-2 p-3">
      <div className="text-[11.5px] font-semibold uppercase tracking-wide text-muted">
        {t('protocols.previewHint')} · {pick(tpl.name)}
      </div>
      <div className="mt-2 grid grid-cols-3 gap-2 text-center">
        <MiniStat
          label={t('protocols.ssTrough')}
          value={`${fmtNumber(ss.troughMg, locale, 2)} mg`}
        />
        <MiniStat label={t('protocols.ssAvg')} value={`${fmtNumber(ss.avgMg, locale, 2)} mg`} />
        <MiniStat label={t('protocols.ssPeak')} value={`${fmtNumber(ss.peakMg, locale, 2)} mg`} />
      </div>
      <p className="mt-2 text-center text-[11.5px] text-muted">
        {t('protocols.ssTime', { time: fmtHours(ss.hoursTo90, locale) })} ·{' '}
        {fmtDose(last.doseMg, compound.defaultUnit, locale)}
      </p>
    </div>
  )
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="tabular text-[14px] font-bold">{value}</div>
    </div>
  )
}

function ClinicianNotes({
  compoundId,
  isClinician,
  notes,
}: {
  compoundId: string
  isClinician: boolean
  notes: { id: string; body: string; clinician_id: string }[]
}) {
  const { t } = useTranslation()
  const { user } = useSession()
  const { toast } = useToast()
  const save = useSaveCompoundNote(user?.id ?? '', compoundId)
  const mine = notes.find((n) => n.clinician_id === user?.id)
  const others = notes.filter((n) => n.clinician_id !== user?.id)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(mine?.body ?? '')

  if (!isClinician) {
    if (others.length === 0) return null
    return (
      <Card title={t('wiki.clinicianNote')} tone="accent">
        {others.map((n) => (
          <p key={n.id} className="whitespace-pre-wrap text-[13.5px]">
            {n.body}
          </p>
        ))}
      </Card>
    )
  }

  return (
    <Card
      title={t('wiki.myNote')}
      subtitle={t('wiki.myNoteHint')}
      tone="accent"
      action={
        !editing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setBody(mine?.body ?? '')
              setEditing(true)
            }}
          >
            {mine ? t('common.edit') : t('common.add')}
          </Button>
        )
      }
    >
      {editing ? (
        <>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              loading={save.isPending}
              onClick={async () => {
                try {
                  await save.mutateAsync(body)
                  setEditing(false)
                  toast(t('common.saved'), 'success')
                } catch {
                  toast(t('common.error'), 'error')
                }
              }}
            >
              {t('common.save')}
            </Button>
          </div>
        </>
      ) : mine ? (
        <p className="whitespace-pre-wrap text-[13.5px]">{mine.body}</p>
      ) : (
        <p className="text-[13px] text-muted">—</p>
      )}
    </Card>
  )
}

function Section({
  title,
  tone,
  children,
}: {
  title: string
  tone?: 'danger'
  children: React.ReactNode
}) {
  return (
    <div className="mt-2 first:mt-0">
      <h3
        className={
          tone === 'danger'
            ? 'mb-1 text-[12px] font-semibold uppercase tracking-wide text-danger'
            : 'mb-1 text-[12px] font-semibold uppercase tracking-wide text-muted'
        }
      >
        {title}
      </h3>
      <div className="text-[14px] leading-relaxed text-ink-2">{children}</div>
    </div>
  )
}

function BulletList({ items, pick }: { items: L10n[]; pick: (l: L10n) => string }) {
  return (
    <ul className="flex flex-col gap-1.5">
      {items.map((item) => (
        <li key={item.es} className="flex gap-2 text-[14px] leading-relaxed text-ink-2">
          <span className="mt-[9px] size-1 shrink-0 rounded-full bg-muted" />
          <span>{pick(item)}</span>
        </li>
      ))}
    </ul>
  )
}

function PkStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-control bg-surface-2 px-3 py-2">
      <div className="text-[11px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="tabular mt-0.5 text-[16px] font-bold">{value}</div>
    </div>
  )
}
