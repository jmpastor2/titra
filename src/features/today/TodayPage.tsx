import { differenceInCalendarDays, getDayOfYear } from 'date-fns'
import { Activity, BookOpen, FlaskConical, Gauge, Plus, Scale, Syringe } from 'lucide-react'
import { useMemo, useState, type ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressRing, SectionTitle, Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { useInventory } from '@/data/hooks'
import { CheckInSheet } from '@/features/checkin/CheckInSheet'
import { LogDoseSheet } from '@/features/doses/LogDoseSheet'
import { useExposure } from '@/features/exposure/useExposure'
import { LogMeasurementSheet } from '@/features/health/LogMeasurementSheet'
import { LogSymptomSheet } from '@/features/symptoms/LogSymptomSheet'
import { fmtDate, fmtHours } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { AgendaRow } from './AgendaRow'
import { buildToday, focusItem, summarise } from './agenda'
import { DayStrip } from './DayStrip'
import { LevelCard } from './LevelCard'

type SheetState =
  | { kind: 'dose'; protocolId?: string | null; compoundId?: string }
  | { kind: 'checkin' | 'symptom' | 'weight' }
  | null

/** `embedded` renders the page inside another screen (a shared, read-only view) without its header. */
export function TodayPage({ embedded = false }: { embedded?: boolean }) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  const { patientId, patient, readOnly } = usePatientScope()
  const now = useNow()
  const exposure = useExposure(patientId, now)
  const inventory = useInventory(patientId)
  const [sheet, setSheet] = useState<SheetState>(null)

  const items = useMemo(
    () => buildToday(exposure.protocols, exposure.doses, now),
    [exposure.protocols, exposure.doses, now],
  )
  const summary = summarise(items)
  const focus = focusItem(items)
  const tracked = exposure.items.filter((x) => x.protocol || x.lastDose)
  const firstStart = exposure.protocols
    .filter((p) => p.status === 'active')
    .map((p) => new Date(p.start_date))
    .toSorted((a, b) => a.getTime() - b.getTime())[0]
  const dayN = firstStart ? differenceInCalendarDays(now, firstStart) + 1 : null

  // One substance to learn about today, rotating through the ones in use.
  const learn = tracked.length ? tracked[getDayOfYear(now) % tracked.length]!.compound : undefined

  const hasProtocols = exposure.protocols.some((p) => p.status === 'active')

  return (
    <div
      className={
        embedded
          ? 'flex flex-col gap-5 pt-2'
          : 'flex flex-col gap-5 pt-[max(env(safe-area-inset-top),18px)]'
      }
    >
      {!embedded && (
        <header className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <div className="spec">
              {fmtDate(now, locale, 'EEE d MMM').toUpperCase()}
              {dayN && dayN > 0 ? ` · ${t('today.dayN', { n: dayN })}` : ''}
            </div>
            <h1 className="mt-1 truncate font-display text-[32px] font-bold leading-none">
              {readOnly ? patient?.display_name : t('today.title')}
            </h1>
          </div>
          {!readOnly && (
            <Link
              to="/settings"
              aria-label={t('more.settings')}
              className="grid size-11 shrink-0 place-items-center rounded-full border border-line-strong bg-panel font-display text-[15px] font-bold text-signal"
            >
              {(patient?.display_name ?? '?').trim().charAt(0).toUpperCase()}
            </Link>
          )}
        </header>
      )}

      {exposure.isPending ? (
        <Card>
          <Skeleton className="h-28 w-full" />
        </Card>
      ) : !hasProtocols && tracked.length === 0 ? (
        <SetupLab readOnly={readOnly} onFreeDose={() => setSheet({ kind: 'dose' })} />
      ) : (
        <Card instrument className="overflow-hidden p-5">
          <div className="flex items-center gap-5">
            <ProgressRing
              fraction={summary.total ? summary.taken / summary.total : 1}
              size={96}
              stroke={7}
            >
              <div className="text-center leading-none">
                <div className="readout text-[24px] font-semibold text-glow">
                  {summary.taken}
                  <span className="text-[14px] text-muted">/{summary.total}</span>
                </div>
                <div className="spec mt-1 text-[9px]">{t('today.doses')}</div>
              </div>
            </ProgressRing>
            <div className="min-w-0 flex-1">
              <div className="spec">{t('today.next')}</div>
              {focus ? (
                <>
                  <div className="mt-1 flex items-center gap-1.5">
                    {focus.doses.map((d) => (
                      <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
                    ))}
                    <span className="truncate text-[16px] font-semibold">
                      {focus.doses
                        .map((d) => compoundById(d.compoundId)?.names.generic)
                        .join(' + ')}
                    </span>
                  </div>
                  <div className="readout mt-1 text-[13px] text-muted">
                    {focus.status === 'due' || focus.status === 'overdue'
                      ? t('today.dueNow')
                      : t('today.inTime', {
                          time: fmtHours((focus.at.getTime() - now.getTime()) / 3_600_000, locale),
                        })}
                  </div>
                  {!readOnly && (
                    <Button
                      size="sm"
                      className="mt-3"
                      leading={<Syringe className="size-4" />}
                      onClick={() => setSheet({ kind: 'dose', protocolId: focus.protocol.id })}
                    >
                      {t('today.logNow')}
                    </Button>
                  )}
                </>
              ) : (
                <p className="mt-1 text-[14px] text-ink-2">
                  {summary.total ? t('today.allDone') : t('today.nothingToday')}
                </p>
              )}
            </div>
          </div>
          <DayStrip items={items} now={now} />
        </Card>
      )}

      {items.length > 0 && (
        <section>
          <SectionTitle index="01">{t('today.agenda')}</SectionTitle>
          <ul className="flex flex-col gap-2">
            {items.map((i) => (
              <AgendaRow
                key={i.key}
                item={i}
                now={now}
                readOnly={readOnly}
                onLog={() => setSheet({ kind: 'dose', protocolId: i.protocol.id })}
              />
            ))}
          </ul>
        </section>
      )}

      {tracked.length > 0 && (
        <section>
          <SectionTitle
            index="02"
            action={
              !readOnly && (
                <Link to="/protocols" className="spec text-signal">
                  {t('today.manage')}
                </Link>
              )
            }
          >
            {t('today.levels')}
          </SectionTitle>
          <div className="hide-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1">
            {tracked.map((x) => (
              <LevelCard
                key={x.compoundId}
                x={x}
                now={now}
                vial={(inventory.data ?? []).find((v) => v.compound_id === x.compoundId)}
              />
            ))}
          </div>
        </section>
      )}

      {!readOnly && (
        <section>
          <SectionTitle index="03">{t('today.quick')}</SectionTitle>
          <div className="grid grid-cols-4 gap-2">
            <Quick
              icon={<Plus className="size-5" />}
              label={t('today.freeDose')}
              onClick={() => setSheet({ kind: 'dose' })}
            />
            <Quick
              icon={<Gauge className="size-5" />}
              label={t('today.checkin')}
              onClick={() => setSheet({ kind: 'checkin' })}
            />
            <Quick
              icon={<Activity className="size-5" />}
              label={t('dashboard.logSymptom')}
              onClick={() => setSheet({ kind: 'symptom' })}
            />
            <Quick
              icon={<Scale className="size-5" />}
              label={t('dashboard.logWeight')}
              onClick={() => setSheet({ kind: 'weight' })}
            />
          </div>
        </section>
      )}

      {learn && (
        <section>
          <SectionTitle index="04">{t('today.learn')}</SectionTitle>
          <Card
            className="cursor-pointer"
            onClick={() => nav(`/wiki/${learn.id}`)}
            style={{
              borderColor: `color-mix(in oklab, ${compoundColor(learn.id)} 30%, var(--line))`,
            }}
          >
            <div className="flex items-center gap-2">
              <SubstanceDot color={compoundColor(learn.id)} />
              <span className="font-display text-[17px] font-semibold">{learn.names.generic}</span>
            </div>
            <p className="mt-2 line-clamp-3 text-[13.5px] leading-relaxed text-ink-2">
              {pick(learn.summary)}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {learn.pk && (
                <span className="spec">
                  T½ <span className="text-ink">{fmtHours(learn.pk.halfLifeH, locale)}</span>
                </span>
              )}
              <span className="spec">
                {t('wiki.evidence')}{' '}
                <span className="text-ink">{t(`wiki.evidenceTiers.${learn.evidence}`)}</span>
              </span>
              <span className="spec flex items-center gap-1 text-signal">
                <BookOpen className="size-3" /> {t('today.readMore')}
              </span>
            </div>
          </Card>
        </section>
      )}

      <p className="px-2 pb-2 text-center text-[11px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>

      <LogDoseSheet
        open={sheet?.kind === 'dose'}
        onClose={() => setSheet(null)}
        protocolId={sheet?.kind === 'dose' ? sheet.protocolId : undefined}
        compoundId={sheet?.kind === 'dose' ? sheet.compoundId : undefined}
      />
      <CheckInSheet open={sheet?.kind === 'checkin'} onClose={() => setSheet(null)} />
      <LogSymptomSheet open={sheet?.kind === 'symptom'} onClose={() => setSheet(null)} />
      <LogMeasurementSheet
        open={sheet?.kind === 'weight'}
        onClose={() => setSheet(null)}
        defaultKind="weight"
      />
    </div>
  )
}

function Quick({ icon, label, onClick }: { icon: ReactNode; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="card flex flex-col items-center gap-2 px-1 py-3 text-center transition active:scale-[0.97]"
    >
      <span className="grid size-10 place-items-center rounded-full border border-signal/25 bg-signal-soft text-signal">
        {icon}
      </span>
      <span className="text-[11.5px] font-semibold leading-tight text-ink-2">{label}</span>
    </button>
  )
}

/** First run: three steps to a working lab. */
function SetupLab({ readOnly, onFreeDose }: { readOnly?: boolean; onFreeDose: () => void }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const steps = [
    {
      n: '01',
      title: t('setupLab.protocol'),
      body: t('setupLab.protocolHint'),
      to: '/protocols/new',
    },
    { n: '02', title: t('setupLab.vial'), body: t('setupLab.vialHint'), to: '/inventory' },
    { n: '03', title: t('setupLab.learn'), body: t('setupLab.learnHint'), to: '/wiki' },
  ]
  return (
    <Card instrument className="p-5">
      <div className="flex items-center gap-3">
        <span className="glow grid size-12 place-items-center rounded-2xl border border-signal/30 bg-signal-soft text-signal">
          <FlaskConical className="size-6" />
        </span>
        <div>
          <h2 className="font-display text-[20px] font-bold">{t('setupLab.title')}</h2>
          <p className="text-[13px] text-muted">{t('setupLab.intro')}</p>
        </div>
      </div>
      {!readOnly && (
        <ol className="mt-5 flex flex-col gap-2">
          {steps.map((s) => (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => nav(s.to)}
                className="flex w-full items-start gap-3 rounded-[16px] border border-line bg-panel-2 p-3 text-left transition active:scale-[0.99]"
              >
                <span className="readout pt-0.5 text-[13px] font-semibold text-signal">{s.n}</span>
                <span>
                  <span className="block text-[14.5px] font-semibold">{s.title}</span>
                  <span className="block text-[12.5px] text-muted">{s.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {!readOnly && (
        <Button variant="ghost" size="sm" className="mt-3" onClick={onFreeDose}>
          {t('setupLab.freeDose')}
        </Button>
      )}
    </Card>
  )
}
