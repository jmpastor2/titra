import { addDays, startOfDay } from 'date-fns'
import { Clock, Pause, Plus, Syringe, Trash2, X } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Segmented, Skeleton, SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { PROTOCOL_TEMPLATES, templateById } from '@/content/protocols/templates'
import { compoundColor } from '@/content/substanceColor'
import type { Json, ProtocolRow, SavedProtocolRow } from '@/data/database.types'
import {
  useProtocols,
  useSavedProtocols,
  useSaveProtocol,
  useSaveSavedProtocol,
} from '@/data/hooks'
import { parseComponents, parseSteps } from '@/data/mappers'
import { effectiveIntervalH, normaliseTimes, scheduledDoses } from '@/domain/dosing/schedule'
import { steadyState } from '@/domain/pk/engine'
import type { DoseUnit, ProtocolLike, ScheduleStep, StackComponent } from '@/domain/types'
import { useSession } from '@/features/auth/SessionProvider'
import { fmtHours, fmtNumber, toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { SubstancePicker } from './SubstancePicker'

type ScheduleMode = 'interval' | 'weekdays'

interface StepDraft {
  key: number
  pause: boolean
  dose: string
  weeks: string
  label: string
}
interface ComponentDraft {
  key: number
  compoundId: string
  dose: string
}
interface Draft {
  templateRef: string
  compoundId: string
  components: ComponentDraft[]
  name: string
  startDate: string
  mode: ScheduleMode
  intervalDays: string
  weekdays: number[]
  times: string[]
  steps: StepDraft[]
  notes: string
  saveAsTemplate: boolean
}

/** Monday-first week, as both locales expect. */
const WEEK: readonly number[] = [1, 2, 3, 4, 5, 6, 0]

let seq = 0
const key = () => ++seq

function unitOf(compoundId: string): DoseUnit {
  return compoundById(compoundId)?.defaultUnit ?? 'mg'
}
const fromMg = (mg: number, u: DoseUnit) => (u === 'mcg' ? mg * 1000 : mg)
const toMg = (v: number, u: DoseUnit) => (u === 'mcg' ? v / 1000 : v)
const num = (s: string) => Number(s.replace(',', '.'))
const plain = (n: number) => String(Math.round(n * 1000) / 1000)

function draftFromParts(
  compoundId: string,
  steps: readonly ScheduleStep[],
  components: readonly StackComponent[],
  times: readonly string[],
): Pick<
  Draft,
  'compoundId' | 'steps' | 'components' | 'times' | 'mode' | 'intervalDays' | 'weekdays'
> {
  const unit = unitOf(compoundId)
  const firstDose = steps.find((s) => !s.pause)
  const mode: ScheduleMode = firstDose?.weekdays?.length ? 'weekdays' : 'interval'
  return {
    compoundId,
    mode,
    intervalDays: String(firstDose?.intervalDays ?? 7),
    weekdays: firstDose?.weekdays ?? [1, 2, 3, 4, 5],
    times: normaliseTimes(times),
    steps: steps.map((s) => ({
      key: key(),
      pause: Boolean(s.pause),
      dose: s.pause ? '' : plain(fromMg(s.doseMg, unit)),
      weeks: s.durationWeeks === null ? '' : String(s.durationWeeks),
      label: s.label ?? '',
    })),
    components: components.map((c) => ({
      key: key(),
      compoundId: c.compoundId,
      dose: plain(fromMg(c.doseMg, unitOf(c.compoundId))),
    })),
  }
}

function emptyDraft(): Draft {
  return {
    templateRef: '',
    compoundId: '',
    components: [],
    name: '',
    startDate: toDateInputValue(new Date()),
    mode: 'interval',
    intervalDays: '7',
    weekdays: [1, 2, 3, 4, 5],
    times: ['09:00'],
    steps: [{ key: key(), pause: false, dose: '', weeks: '', label: '' }],
    notes: '',
    saveAsTemplate: false,
  }
}

/** Waits for the protocol list when editing, then mounts the form with its data. */
export function ProtocolEditorPage() {
  const { t } = useTranslation()
  const { protocolId } = useParams()
  const [params] = useSearchParams()
  const scope = usePatientScope()
  // Someone I share with can propose a protocol for me: ?patient=<id>.
  const patientId = params.get('patient') ?? scope.patientId
  const protocols = useProtocols(patientId)
  const { user } = useSession()
  const savedParam = params.get('saved')
  const saved = useSavedProtocols(user?.id)

  if ((protocolId && protocols.isPending) || (savedParam && saved.isPending)) {
    return (
      <div className="pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-60 w-full" />
      </div>
    )
  }
  const existing = protocolId ? protocols.data?.find((p) => p.id === protocolId) : undefined
  if (protocolId && !existing) return <PageHeader title={t('errors.notFound')} back />
  return (
    <ProtocolForm
      key={existing?.id ?? 'new'}
      patientId={patientId}
      existing={existing}
      templateId={params.get('template')}
      savedRow={savedParam ? saved.data?.find((s) => s.id === savedParam) : undefined}
      compoundParam={params.get('compound')}
    />
  )
}

function ProtocolForm({
  patientId,
  existing,
  templateId,
  savedRow,
  compoundParam,
}: {
  patientId: string
  existing: ProtocolRow | undefined
  templateId: string | null
  savedRow: SavedProtocolRow | undefined
  compoundParam: string | null
}) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  const { toast } = useToast()
  const { user } = useSession()
  const save = useSaveProtocol(patientId)
  const saved = useSavedProtocols(user?.id)
  const saveTemplate = useSaveSavedProtocol(user?.id ?? '')
  const [picker, setPicker] = useState<'primary' | 'component' | null>(null)

  const [draft, setDraft] = useState<Draft>(() => {
    if (existing) {
      return {
        ...emptyDraft(),
        ...draftFromParts(
          existing.compound_id,
          parseSteps(existing.steps),
          parseComponents(existing.components),
          existing.times?.length ? existing.times : [existing.time_of_day.slice(0, 5)],
        ),
        name: existing.name,
        startDate: existing.start_date,
        notes: existing.notes ?? '',
      }
    }
    if (savedRow) {
      return {
        ...emptyDraft(),
        ...draftFromParts(
          savedRow.compound_id,
          parseSteps(savedRow.steps),
          parseComponents(savedRow.components),
          savedRow.times,
        ),
        templateRef: `saved:${savedRow.id}`,
        name: savedRow.name,
        notes: savedRow.notes ?? '',
      }
    }
    const tpl = templateId ? templateById(templateId) : undefined
    if (tpl) {
      return {
        ...emptyDraft(),
        ...draftFromParts(tpl.compoundId, tpl.steps, [], ['09:00']),
        templateRef: `label:${tpl.id}`,
        name: pick(tpl.name),
      }
    }
    return { ...emptyDraft(), compoundId: compoundParam ?? '' }
  })

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))
  const patchStep = (k: number, p: Partial<StepDraft>) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s) => (s.key === k ? { ...s, ...p } : s)) }))
  const compound = draft.compoundId ? compoundById(draft.compoundId) : undefined
  const unit = unitOf(draft.compoundId)

  function applyTemplate(ref: string) {
    if (!ref) return patch({ templateRef: '' })
    const [source, id] = ref.split(':') as ['label' | 'saved', string]
    if (source === 'label') {
      const tpl = templateById(id)
      if (!tpl) return
      patch({
        ...draftFromParts(tpl.compoundId, tpl.steps, [], draft.times),
        templateRef: ref,
        name: pick(tpl.name),
      })
    } else {
      const row = (saved.data ?? []).find((s) => s.id === id)
      if (!row) return
      patch({
        ...draftFromParts(
          row.compound_id,
          parseSteps(row.steps),
          parseComponents(row.components),
          row.times,
        ),
        templateRef: ref,
        name: row.name,
        notes: row.notes ?? draft.notes,
      })
    }
  }

  // ---------- derived model ----------
  const steps = useMemo<ScheduleStep[]>(() => {
    const interval = num(draft.intervalDays)
    return draft.steps.flatMap((s): ScheduleStep[] => {
      const weeks = s.weeks.trim() === '' ? null : num(s.weeks)
      const durationWeeks = weeks !== null && weeks > 0 ? weeks : null
      const label = s.label.trim() ? { label: s.label.trim() } : {}
      if (s.pause) return [{ doseMg: 0, intervalDays: 1, pause: true, durationWeeks, ...label }]
      const dose = num(s.dose)
      if (!(dose > 0)) return []
      return [
        {
          doseMg: toMg(dose, unit),
          intervalDays: draft.mode === 'interval' && interval > 0 ? interval : 1,
          ...(draft.mode === 'weekdays' ? { weekdays: draft.weekdays.toSorted() } : {}),
          durationWeeks,
          ...label,
        },
      ]
    })
  }, [draft.steps, draft.mode, draft.intervalDays, draft.weekdays, unit])

  const components = useMemo<StackComponent[]>(
    () =>
      draft.components.flatMap((c) => {
        const v = num(c.dose)
        return v > 0 ? [{ compoundId: c.compoundId, doseMg: toMg(v, unitOf(c.compoundId)) }] : []
      }),
    [draft.components],
  )

  const openEndedInMiddle = steps.slice(0, -1).some((s) => s.durationWeeks === null)
  const times = normaliseTimes(draft.times)

  const weekPreview = useMemo(() => {
    const doseStep = steps.find((s) => !s.pause)
    if (!doseStep) return null
    const start = startOfDay(new Date())
    const pl: ProtocolLike = {
      compoundId: draft.compoundId,
      startDate: toDateInputValue(start),
      steps: [{ ...doseStep, durationWeeks: null }],
      times,
    }
    const occ = scheduledDoses(pl, start, addDays(start, 7))
    return Array.from({ length: 7 }, (_, i) => {
      const day = addDays(start, i)
      return { day, count: occ.filter((o) => startOfDay(o.at).getTime() === day.getTime()).length }
    })
  }, [steps, times, draft.compoundId])

  const preview = useMemo(() => {
    const last = steps.findLast((s) => !s.pause)
    if (!last || !compound?.pk) return null
    return steadyState(last.doseMg, effectiveIntervalH(last, times), compound.pk)
  }, [steps, times, compound])

  async function submit() {
    if (!draft.compoundId) {
      toast(t('protocols.pickSubstance'), 'warn')
      return setPicker('primary')
    }
    if (!steps.some((s) => !s.pause)) return toast(t('errors.positive'), 'warn')
    if (draft.mode === 'weekdays' && draft.weekdays.length === 0)
      return toast(t('protocols.pickDays'), 'warn')
    if (openEndedInMiddle) return toast(t('protocols.openEndedLastOnly'), 'warn')
    if (!user) return
    const name =
      draft.name.trim() ||
      [compound?.names.generic, ...components.map((c) => compoundById(c.compoundId)?.names.generic)]
        .filter(Boolean)
        .join(' + ')
    try {
      await save.mutateAsync({
        ...(existing ? { id: existing.id } : {}),
        patient_id: patientId,
        created_by: existing?.created_by ?? user.id,
        compound_id: draft.compoundId,
        name,
        route: compound?.routes[0] ?? 'sc',
        unit,
        start_date: draft.startDate,
        time_of_day: times[0]!,
        times,
        steps: steps as unknown as Json,
        components: components as unknown as Json,
        template_id: draft.templateRef.startsWith('label:')
          ? draft.templateRef.slice(6)
          : (existing?.template_id ?? null),
        notes: draft.notes.trim() || null,
        status: existing?.status ?? 'active',
      })
      if (draft.saveAsTemplate) {
        await saveTemplate.mutateAsync({
          owner_id: user.id,
          name,
          compound_id: draft.compoundId,
          unit,
          steps: steps as unknown as Json,
          components: components as unknown as Json,
          times,
          notes: draft.notes.trim() || null,
        })
      }
      toast(t('common.saved'), 'success')
      nav(-1)
    } catch (e) {
      toast((e as Error).message || t('common.error'), 'error')
    }
  }

  const weekdayShort = (d: number) =>
    new Intl.DateTimeFormat(locale === 'es' ? 'es-ES' : 'en-US', { weekday: 'narrow' }).format(
      new Date(2026, 2, 1 + d), // 2026-03-01 is a Sunday
    )

  const mySaved = (saved.data ?? []).filter((s) => s.owner_id === user?.id)
  const sharedSaved = (saved.data ?? []).filter((s) => s.owner_id !== user?.id)

  return (
    <div className="pb-8">
      <PageHeader
        eyebrow={t('protocols.eyebrow')}
        title={existing ? t('protocols.edit') : t('protocols.new')}
        back
      />

      <div className="flex flex-col gap-3">
        {!existing && (
          <Card
            eyebrow="00"
            title={t('protocols.startFrom')}
            subtitle={t('protocols.templateHint')}
          >
            <Select value={draft.templateRef} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">{t('protocols.fromScratch')}</option>
              {mySaved.length > 0 && (
                <optgroup label={t('protocols.mySaved')}>
                  {mySaved.map((s) => (
                    <option key={s.id} value={`saved:${s.id}`}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
              {sharedSaved.length > 0 && (
                <optgroup label={t('protocols.sharedSaved')}>
                  {sharedSaved.map((s: SavedProtocolRow) => (
                    <option key={s.id} value={`saved:${s.id}`}>
                      {s.name}
                    </option>
                  ))}
                </optgroup>
              )}
              <optgroup label={t('protocols.labelTemplates')}>
                {PROTOCOL_TEMPLATES.map((tpl) => (
                  <option key={tpl.id} value={`label:${tpl.id}`}>
                    {pick(tpl.name)}
                  </option>
                ))}
              </optgroup>
            </Select>
          </Card>
        )}

        {/* 01 · Substances */}
        <Card eyebrow="01" title={t('protocols.substances')}>
          <button
            type="button"
            onClick={() => setPicker('primary')}
            className="flex w-full items-center gap-3 rounded-control border border-line-strong bg-panel-2 px-3.5 py-3 text-left"
          >
            {compound ? (
              <>
                <SubstanceDot color={compoundColor(compound.id)} size={10} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[15.5px] font-semibold">
                    {compound.names.generic}
                  </span>
                  <span className="block truncate text-[12px] text-muted">
                    {pick(compound.pharmClass)}
                  </span>
                </span>
                <span className="spec">{t('common.edit')}</span>
              </>
            ) : (
              <span className="flex items-center gap-2 text-[15px] font-semibold text-signal">
                <Plus className="size-4" /> {t('protocols.pickSubstance')}
              </span>
            )}
          </button>

          {draft.components.map((c) => (
            <div
              key={c.key}
              className="mt-2 flex items-center gap-2 rounded-control border border-line bg-panel-2 p-2.5 pl-3.5"
            >
              <SubstanceDot color={compoundColor(c.compoundId)} />
              <span className="min-w-0 flex-1 truncate text-[14px] font-semibold">
                {compoundById(c.compoundId)?.names.generic}
              </span>
              <div className="w-[118px]">
                <Input
                  inputMode="decimal"
                  aria-label={t('protocols.doseMg')}
                  value={c.dose}
                  onChange={(e) =>
                    patch({
                      components: draft.components.map((x) =>
                        x.key === c.key ? { ...x, dose: e.target.value } : x,
                      ),
                    })
                  }
                  suffix={t(`units.${unitOf(c.compoundId)}`)}
                  className="readout h-10 bg-panel"
                />
              </div>
              <button
                type="button"
                aria-label={t('common.delete')}
                onClick={() =>
                  patch({ components: draft.components.filter((x) => x.key !== c.key) })
                }
                className="grid size-8 place-items-center rounded-full text-muted hover:text-danger"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}
          {compound && (
            <button
              type="button"
              onClick={() => setPicker('component')}
              className="mt-2.5 flex items-center gap-1.5 text-[13px] font-semibold text-signal"
            >
              <Syringe className="size-4" /> {t('protocols.addToSyringe')}
            </button>
          )}
        </Card>

        {/* 02 · Schedule */}
        <Card eyebrow="02" title={t('protocols.schedule')}>
          <Segmented<ScheduleMode>
            value={draft.mode}
            onChange={(mode) => patch({ mode })}
            options={[
              { value: 'interval', label: t('protocols.everyN') },
              { value: 'weekdays', label: t('protocols.onWeekdays') },
            ]}
          />
          {draft.mode === 'interval' ? (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-[14px] text-ink-2">{t('protocols.every')}</span>
              <div className="w-24">
                <Input
                  inputMode="decimal"
                  aria-label={t('protocols.intervalDays')}
                  value={draft.intervalDays}
                  onChange={(e) => patch({ intervalDays: e.target.value })}
                  className="readout text-center"
                />
              </div>
              <span className="text-[14px] text-ink-2">{t('protocols.days')}</span>
            </div>
          ) : (
            <div
              className="mt-3 grid grid-cols-7 gap-1.5"
              role="group"
              aria-label={t('protocols.onWeekdays')}
            >
              {WEEK.map((d) => {
                const on = draft.weekdays.includes(d)
                return (
                  <button
                    key={d}
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      patch({
                        weekdays: on
                          ? draft.weekdays.filter((x) => x !== d)
                          : [...draft.weekdays, d],
                      })
                    }
                    className={
                      on
                        ? 'readout h-11 rounded-control border border-signal/50 bg-signal-soft text-[14px] font-semibold text-signal'
                        : 'readout h-11 rounded-control border border-line bg-panel-2 text-[14px] text-muted'
                    }
                  >
                    {weekdayShort(d).toUpperCase()}
                  </button>
                )
              })}
            </div>
          )}

          <div className="mt-4">
            <div className="spec mb-2">{t('protocols.times')}</div>
            <div className="flex flex-wrap items-center gap-2">
              {draft.times.map((tm, i) => (
                // The value changes while the user edits it, so the position is the identity.
                // oxlint-disable-next-line react/no-array-index-key
                <div
                  key={i}
                  className="flex items-center gap-1 rounded-full border border-line-strong bg-panel-2 py-1 pl-3 pr-1"
                >
                  <Clock className="size-3.5 text-muted" />
                  <input
                    type="time"
                    aria-label={t('protocols.timeOfDay')}
                    value={tm}
                    onChange={(e) =>
                      patch({ times: draft.times.map((x, j) => (j === i ? e.target.value : x)) })
                    }
                    className="readout w-[74px] bg-transparent text-[14px] font-semibold outline-none"
                  />
                  {draft.times.length > 1 && (
                    <button
                      type="button"
                      aria-label={t('common.delete')}
                      onClick={() => patch({ times: draft.times.filter((_, j) => j !== i) })}
                      className="grid size-7 place-items-center rounded-full text-muted hover:text-danger"
                    >
                      <X className="size-3.5" />
                    </button>
                  )}
                </div>
              ))}
              {draft.times.length < 6 && (
                <button
                  type="button"
                  onClick={() => patch({ times: [...draft.times, '21:00'] })}
                  className="flex items-center gap-1 rounded-full border border-dashed border-line-strong px-3 py-2 text-[12.5px] font-semibold text-signal"
                >
                  <Plus className="size-3.5" /> {t('protocols.addTime')}
                </button>
              )}
            </div>
          </div>

          {weekPreview && (
            <div className="mt-4 rounded-control border border-line bg-panel-2 p-3">
              <div className="spec mb-2">{t('protocols.typicalWeek')}</div>
              <div className="grid grid-cols-7 gap-1.5">
                {weekPreview.map(({ day, count }) => (
                  <div key={day.getTime()} className="flex flex-col items-center gap-1.5">
                    <span className="readout text-[10px] text-muted">
                      {weekdayShort(day.getDay()).toUpperCase()}
                    </span>
                    <div className="flex h-5 flex-col items-center justify-end gap-0.5">
                      {Array.from({ length: Math.min(count, 3) }, (_, i) => (
                        <span
                          key={i}
                          className="block size-[7px] rounded-full"
                          style={{
                            background: compoundColor(draft.compoundId),
                            boxShadow: `0 0 6px ${compoundColor(draft.compoundId)}`,
                          }}
                        />
                      ))}
                      {count === 0 && (
                        <span className="block size-[7px] rounded-full border border-line-strong" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </Card>

        {/* 03 · Steps */}
        <Card eyebrow="03" title={t('protocols.steps')} subtitle={t('protocols.stepsHint')}>
          <ul className="flex flex-col gap-2.5">
            {draft.steps.map((s, i) => (
              <li
                key={s.key}
                className={
                  s.pause
                    ? 'rounded-control border border-dashed border-line-strong p-3'
                    : 'rounded-control border border-line bg-panel-2 p-3'
                }
              >
                <div className="mb-2 flex items-center justify-between">
                  <span className="spec flex items-center gap-1.5">
                    {s.pause && <Pause className="size-3" />}
                    {s.pause ? t('protocols.pause') : `${t('protocols.step')} ${i + 1}`}
                  </span>
                  {draft.steps.length > 1 && (
                    <button
                      type="button"
                      aria-label={t('protocols.removeStep')}
                      onClick={() => patch({ steps: draft.steps.filter((x) => x.key !== s.key) })}
                      className="grid size-7 place-items-center rounded-full text-muted hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {!s.pause && (
                    <Field label={t('protocols.doseMg')}>
                      {(id) => (
                        <Input
                          id={id}
                          inputMode="decimal"
                          value={s.dose}
                          onChange={(e) => patchStep(s.key, { dose: e.target.value })}
                          suffix={t(`units.${unit}`)}
                          className="readout bg-panel"
                        />
                      )}
                    </Field>
                  )}
                  <Field
                    label={t('protocols.durationWeeks')}
                    hint={!s.pause && s.weeks.trim() === '' ? t('protocols.openEnded') : undefined}
                    className={s.pause ? 'col-span-2' : undefined}
                  >
                    {(id) => (
                      <Input
                        id={id}
                        inputMode="numeric"
                        value={s.weeks}
                        placeholder="∞"
                        onChange={(e) => patchStep(s.key, { weeks: e.target.value })}
                        suffix={t('protocols.weeksShort')}
                        className="readout bg-panel"
                      />
                    )}
                  </Field>
                </div>
              </li>
            ))}
          </ul>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="sm"
              variant="soft"
              leading={<Plus className="size-4" />}
              onClick={() =>
                patch({
                  steps: [
                    ...draft.steps,
                    {
                      key: key(),
                      pause: false,
                      dose: draft.steps.findLast((x) => !x.pause)?.dose ?? '',
                      weeks: '',
                      label: '',
                    },
                  ],
                })
              }
            >
              {t('protocols.addStep')}
            </Button>
            <Button
              size="sm"
              variant="secondary"
              leading={<Pause className="size-4" />}
              onClick={() =>
                patch({
                  steps: [
                    ...draft.steps,
                    { key: key(), pause: true, dose: '', weeks: '4', label: '' },
                  ],
                })
              }
            >
              {t('protocols.addPause')}
            </Button>
          </div>
          {openEndedInMiddle && (
            <p role="alert" className="mt-3 text-[12.5px] text-danger">
              {t('protocols.openEndedLastOnly')}
            </p>
          )}
        </Card>

        {preview && (
          <Card
            instrument
            tone="signal"
            eyebrow={t('protocols.preview')}
            title={compound?.names.generic}
          >
            <div className="grid grid-cols-3 gap-2 text-center">
              <PreviewStat
                label={t('protocols.ssTrough')}
                value={fmtNumber(preview.troughMg, locale, 2)}
              />
              <PreviewStat
                label={t('protocols.ssAvg')}
                value={fmtNumber(preview.avgMg, locale, 2)}
              />
              <PreviewStat
                label={t('protocols.ssPeak')}
                value={fmtNumber(preview.peakMg, locale, 2)}
              />
            </div>
            <p className="mt-3 text-center text-[12px] text-muted">
              {t('protocols.previewHint')} ·{' '}
              {t('protocols.ssTime', { time: fmtHours(preview.hoursTo90, locale) })}
            </p>
          </Card>
        )}

        {/* 04 · Details */}
        <Card eyebrow="04" title={t('protocols.details')}>
          <div className="flex flex-col gap-4">
            <Field label={t('protocols.name')}>
              {(id) => (
                <Input
                  id={id}
                  value={draft.name}
                  placeholder={[
                    compound?.names.generic,
                    ...draft.components.map((c) => compoundById(c.compoundId)?.names.generic),
                  ]
                    .filter(Boolean)
                    .join(' + ')}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              )}
            </Field>
            <Field label={t('protocols.startDate')}>
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={draft.startDate}
                  onChange={(e) => patch({ startDate: e.target.value })}
                />
              )}
            </Field>
            <Field label={`${t('protocols.notes')} · ${t('common.optional')}`}>
              {(id) => (
                <Textarea
                  id={id}
                  value={draft.notes}
                  onChange={(e) => patch({ notes: e.target.value })}
                  rows={2}
                />
              )}
            </Field>
            <label className="flex items-center justify-between gap-3 rounded-control border border-line bg-panel-2 px-3.5 py-3">
              <span>
                <span className="block text-[14px] font-semibold">
                  {t('protocols.saveAsTemplate')}
                </span>
                <span className="block text-[12px] text-muted">
                  {t('protocols.saveAsTemplateHint')}
                </span>
              </span>
              <input
                type="checkbox"
                checked={draft.saveAsTemplate}
                onChange={(e) => patch({ saveAsTemplate: e.target.checked })}
                className="size-5 accent-[var(--signal)]"
              />
            </label>
          </div>
        </Card>

        <Button size="lg" block loading={save.isPending || saveTemplate.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      </div>

      <SubstancePicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        exclude={[draft.compoundId, ...draft.components.map((c) => c.compoundId)].filter(Boolean)}
        onPick={(cid) => {
          if (picker === 'primary') patch({ compoundId: cid })
          else
            patch({ components: [...draft.components, { key: key(), compoundId: cid, dose: '' }] })
          setPicker(null)
        }}
      />
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="spec">{label}</div>
      <div className="readout mt-1 text-[18px] font-semibold">
        {value}
        <span className="ml-0.5 text-[11px] text-muted">mg</span>
      </div>
    </div>
  )
}
