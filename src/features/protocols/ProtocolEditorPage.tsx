import { Plus, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Segmented, Skeleton } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { COMPOUNDS, compoundById } from '@/content/compounds'
import { PROTOCOL_TEMPLATES, templateById } from '@/content/protocols/templates'
import type { L10n } from '@/content/schema'
import type { Json, ProtocolRow } from '@/data/database.types'
import { useProtocols, useSaveProtocol } from '@/data/hooks'
import { parseSteps } from '@/data/mappers'
import { steadyState } from '@/domain/pk/engine'
import type { DoseUnit, ScheduleStep } from '@/domain/types'
import { useSession } from '@/features/auth/SessionProvider'
import { fmtHours, fmtNumber, toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'

interface StepDraft {
  /** Stable identity so removing a row never shifts focus or values to its neighbour. */
  key: number
  dose: string
  intervalDays: string
  durationWeeks: string
  label: string
}

interface Draft {
  mode: 'template' | 'custom'
  templateId: string
  compoundId: string
  name: string
  startDate: string
  timeOfDay: string
  steps: StepDraft[]
  notes: string
}

function fromMg(mg: number, unit: DoseUnit): number {
  return unit === 'mcg' ? mg * 1000 : mg
}
function toMg(v: number, unit: DoseUnit): number {
  return unit === 'mcg' ? v / 1000 : v
}
function unitOf(compoundId: string): DoseUnit {
  return compoundById(compoundId)?.defaultUnit ?? 'mg'
}

let stepSeq = 0
const nextKey = () => ++stepSeq

function toDrafts(steps: readonly ScheduleStep[], unit: DoseUnit): StepDraft[] {
  return steps.map((s) => ({
    key: nextKey(),
    dose: String(fromMg(s.doseMg, unit)),
    intervalDays: String(s.intervalDays),
    durationWeeks: s.durationWeeks === null ? '' : String(s.durationWeeks),
    label: s.label ?? '',
  }))
}

const emptyStep = (): StepDraft => ({
  key: nextKey(),
  dose: '',
  intervalDays: '7',
  durationWeeks: '4',
  label: '',
})

function initialDraft(
  existing: ProtocolRow | undefined,
  templateId: string | null,
  pick: (l: L10n) => string,
): Draft {
  if (existing) {
    return {
      mode: 'custom',
      templateId: existing.template_id ?? '',
      compoundId: existing.compound_id,
      name: existing.name,
      startDate: existing.start_date,
      timeOfDay: existing.time_of_day.slice(0, 5),
      steps: toDrafts(parseSteps(existing.steps), unitOf(existing.compound_id)),
      notes: existing.notes ?? '',
    }
  }
  const tpl = templateId ? templateById(templateId) : undefined
  const base: Draft = {
    mode: 'template',
    templateId: '',
    compoundId: 'semaglutide',
    name: '',
    startDate: toDateInputValue(new Date()),
    timeOfDay: '09:00',
    steps: [emptyStep()],
    notes: '',
  }
  if (!tpl) return base
  return {
    ...base,
    templateId: tpl.id,
    compoundId: tpl.compoundId,
    name: pick(tpl.name),
    steps: toDrafts(tpl.steps, unitOf(tpl.compoundId)),
  }
}

/** Waits for the protocol list when editing, then mounts the form with its data. */
export function ProtocolEditorPage() {
  const { t } = useTranslation()
  const { protocolId } = useParams()
  const [params] = useSearchParams()
  const scope = usePatientScope()
  // A clinician prescribing for a patient passes ?patient=<id>.
  const patientId = params.get('patient') ?? scope.patientId
  const protocols = useProtocols(patientId)

  if (protocolId && protocols.isPending) {
    return (
      <div className="pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-60 w-full" />
      </div>
    )
  }
  const existing = protocolId ? protocols.data?.find((p) => p.id === protocolId) : undefined
  if (protocolId && !existing) {
    return <PageHeader title={t('errors.notFound')} back />
  }
  return (
    <ProtocolForm
      key={existing?.id ?? 'new'}
      patientId={patientId}
      existing={existing}
      templateId={params.get('template')}
    />
  )
}

function ProtocolForm({
  patientId,
  existing,
  templateId,
}: {
  patientId: string
  existing: ProtocolRow | undefined
  templateId: string | null
}) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  const { toast } = useToast()
  const { user } = useSession()
  const save = useSaveProtocol(patientId)
  const [draft, setDraft] = useState<Draft>(() => initialDraft(existing, templateId, pick))

  const compound = compoundById(draft.compoundId)
  const unit = unitOf(draft.compoundId)
  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))
  const patchStep = (key: number, p: Partial<StepDraft>) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s) => (s.key === key ? { ...s, ...p } : s)) }))

  function applyTemplate(id: string) {
    const tpl = templateById(id)
    if (!tpl) {
      patch({ templateId: '' })
      return
    }
    patch({
      templateId: tpl.id,
      compoundId: tpl.compoundId,
      name: pick(tpl.name),
      steps: toDrafts(tpl.steps, unitOf(tpl.compoundId)),
    })
  }

  const parsedSteps = useMemo<ScheduleStep[]>(
    () =>
      draft.steps.flatMap((s): ScheduleStep[] => {
        const dose = Number(s.dose.replace(',', '.'))
        const interval = Number(s.intervalDays.replace(',', '.'))
        if (!(dose > 0) || !(interval > 0)) return []
        const weeks = s.durationWeeks.trim() === '' ? null : Number(s.durationWeeks)
        return [
          {
            doseMg: toMg(dose, unit),
            intervalDays: interval,
            durationWeeks: weeks !== null && Number.isFinite(weeks) && weeks > 0 ? weeks : null,
            ...(s.label.trim() ? { label: s.label.trim() } : {}),
          },
        ]
      }),
    [draft.steps, unit],
  )

  // Only the last step may be open-ended; an open-ended step in the middle would
  // make every later step unreachable.
  const openEndedInMiddle = parsedSteps.slice(0, -1).some((s) => s.durationWeeks === null)

  const preview = useMemo(() => {
    const last = parsedSteps[parsedSteps.length - 1]
    if (!last || !compound?.pk) return null
    return steadyState(last.doseMg, last.intervalDays * 24, compound.pk)
  }, [parsedSteps, compound])

  async function submit() {
    if (parsedSteps.length === 0) {
      toast(t('errors.positive'), 'warn')
      return
    }
    if (openEndedInMiddle) {
      toast(t('protocols.openEndedLastOnly'), 'warn')
      return
    }
    if (!user) return
    try {
      await save.mutateAsync({
        ...(existing ? { id: existing.id } : {}),
        patient_id: patientId,
        created_by: existing?.created_by ?? user.id,
        compound_id: draft.compoundId,
        name: draft.name.trim() || compound?.names.generic || draft.compoundId,
        route: compound?.routes[0] ?? 'sc',
        unit,
        start_date: draft.startDate,
        time_of_day: draft.timeOfDay,
        steps: parsedSteps as unknown as Json,
        template_id:
          draft.mode === 'template' ? draft.templateId || null : (existing?.template_id ?? null),
        notes: draft.notes.trim() || null,
        status: existing?.status ?? 'active',
      })
      toast(t('common.saved'), 'success')
      nav(-1)
    } catch (e) {
      toast((e as Error).message || t('common.error'), 'error')
    }
  }

  const lockedToTemplate = draft.mode === 'template' && Boolean(draft.templateId)

  return (
    <div className="pb-6">
      <PageHeader title={existing ? t('protocols.edit') : t('protocols.new')} back />

      <div className="flex flex-col gap-3">
        {!existing && (
          <Segmented<'template' | 'custom'>
            value={draft.mode}
            onChange={(mode) => patch({ mode })}
            options={[
              { value: 'template', label: t('protocols.fromTemplate') },
              { value: 'custom', label: t('protocols.custom') },
            ]}
          />
        )}

        {draft.mode === 'template' && !existing && (
          <Card title={t('protocols.template')} subtitle={t('protocols.templateHint')}>
            <Select value={draft.templateId} onChange={(e) => applyTemplate(e.target.value)}>
              <option value="">—</option>
              {PROTOCOL_TEMPLATES.map((tpl) => (
                <option key={tpl.id} value={tpl.id}>
                  {pick(tpl.name)}
                </option>
              ))}
            </Select>
          </Card>
        )}

        <Card>
          <div className="flex flex-col gap-4">
            <Field label={t('protocols.compound')}>
              {(id) => (
                <Select
                  id={id}
                  value={draft.compoundId}
                  disabled={lockedToTemplate}
                  onChange={(e) => patch({ compoundId: e.target.value })}
                >
                  {COMPOUNDS.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.names.generic}
                    </option>
                  ))}
                </Select>
              )}
            </Field>

            <Field label={t('protocols.name')}>
              {(id) => (
                <Input
                  id={id}
                  value={draft.name}
                  onChange={(e) => patch({ name: e.target.value })}
                />
              )}
            </Field>

            <div className="grid grid-cols-2 gap-3">
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
              <Field label={t('protocols.timeOfDay')}>
                {(id) => (
                  <Input
                    id={id}
                    type="time"
                    value={draft.timeOfDay}
                    onChange={(e) => patch({ timeOfDay: e.target.value })}
                  />
                )}
              </Field>
            </div>
          </div>
        </Card>

        <Card
          title={t('protocols.steps')}
          action={
            <Button
              size="sm"
              variant="soft"
              leading={<Plus className="size-4" />}
              onClick={() => setDraft((d) => ({ ...d, steps: [...d.steps, emptyStep()] }))}
            >
              {t('protocols.addStep')}
            </Button>
          }
        >
          <ul className="flex flex-col gap-3">
            {draft.steps.map((s, i) => (
              <li key={s.key} className="rounded-control border border-line p-3">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-[12px] font-semibold uppercase tracking-wide text-muted">
                    {t('protocols.step')} {i + 1}
                    {s.label ? ` · ${s.label}` : ''}
                  </span>
                  {draft.steps.length > 1 && (
                    <button
                      type="button"
                      aria-label={t('protocols.removeStep')}
                      onClick={() =>
                        setDraft((d) => ({ ...d, steps: d.steps.filter((x) => x.key !== s.key) }))
                      }
                      className="grid size-7 place-items-center rounded-full text-muted hover:bg-danger-soft hover:text-danger"
                    >
                      <Trash2 className="size-3.5" />
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label={t('protocols.doseMg')}>
                    {(id) => (
                      <Input
                        id={id}
                        inputMode="decimal"
                        value={s.dose}
                        onChange={(e) => patchStep(s.key, { dose: e.target.value })}
                        suffix={t(`units.${unit}`)}
                      />
                    )}
                  </Field>
                  <Field label={t('protocols.intervalDays')}>
                    {(id) => (
                      <Input
                        id={id}
                        inputMode="decimal"
                        value={s.intervalDays}
                        onChange={(e) => patchStep(s.key, { intervalDays: e.target.value })}
                      />
                    )}
                  </Field>
                  <Field
                    label={t('protocols.durationWeeks')}
                    hint={s.durationWeeks.trim() === '' ? t('protocols.openEnded') : undefined}
                  >
                    {(id) => (
                      <Input
                        id={id}
                        inputMode="numeric"
                        value={s.durationWeeks}
                        placeholder="∞"
                        onChange={(e) => patchStep(s.key, { durationWeeks: e.target.value })}
                      />
                    )}
                  </Field>
                </div>
              </li>
            ))}
          </ul>
          {openEndedInMiddle && (
            <p role="alert" className="mt-3 text-[12.5px] text-danger">
              {t('protocols.openEndedLastOnly')}
            </p>
          )}
        </Card>

        {preview && (
          <Card title={t('protocols.preview')} subtitle={t('protocols.previewHint')} tone="brand">
            <div className="grid grid-cols-3 gap-2 text-center">
              <PreviewStat
                label={t('protocols.ssTrough')}
                value={`${fmtNumber(preview.troughMg, locale, 2)} mg`}
              />
              <PreviewStat
                label={t('protocols.ssAvg')}
                value={`${fmtNumber(preview.avgMg, locale, 2)} mg`}
              />
              <PreviewStat
                label={t('protocols.ssPeak')}
                value={`${fmtNumber(preview.peakMg, locale, 2)} mg`}
              />
            </div>
            <p className="mt-2 text-center text-[12px] text-muted">
              {t('protocols.ssTime', { time: fmtHours(preview.hoursTo90, locale) })}
            </p>
          </Card>
        )}

        <Card title={t('protocols.notes')}>
          <Textarea
            value={draft.notes}
            onChange={(e) => patch({ notes: e.target.value })}
            rows={2}
          />
        </Card>

        <Button size="lg" block loading={save.isPending} onClick={submit}>
          {t('common.save')}
        </Button>
      </div>
    </div>
  )
}

function PreviewStat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10.5px] font-semibold uppercase tracking-wide text-muted">{label}</div>
      <div className="tabular text-[15px] font-bold">{value}</div>
    </div>
  )
}
