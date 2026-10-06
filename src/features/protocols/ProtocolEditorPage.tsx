import { clsx } from 'clsx'
import { Pause, Plus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Field, Input, Select, Textarea } from '@/components/ui/Field'
import { Skeleton, ToggleRow } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { PROTOCOL_TEMPLATES, templateById } from '@/content/protocols/templates'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow, Json, SavedProtocolRow } from '@/data/database.types'
import {
  useInventory,
  useProtocols,
  useSavedProtocols,
  useSaveProtocol,
  useSaveSavedProtocol,
} from '@/data/hooks'
import { parseComponents, parseSteps } from '@/data/mappers'
import { effectiveIntervalH, splitNightTime } from '@/domain/dosing/schedule'
import { steadyState } from '@/domain/pk/engine'
import { useSession } from '@/features/auth/SessionProvider'
import { isBlend, activeVial, concentrationFor } from '@/features/inventory/vials'
import { fmtHours, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useNow } from '@/lib/useNow'
import { useCycleText } from './cycleText'
import { doseView, fmtDoseLine } from './cycleView'
import { EntryNote, EntryToggle } from './DoseField'
import { defaultEntry, type DoseEntry } from './doseUnits'
import {
  blendPartnerMg,
  buildModel,
  convertField,
  doseField,
  draftFromParts,
  nextKey,
  signature,
  unitOf,
  type ComponentDraft,
  type ConcOf,
  type Draft,
  type StepDraft,
} from './draft'
import { initialDraft, type DraftSource } from './initialDraft'
import { PlanPreview } from './PlanPreview'
import { ScheduleCard } from './ScheduleCard'
import { StepRow } from './StepRow'
import { SubstancesCard } from './SubstancesCard'
import { SubstancePicker } from './SubstancePicker'
import { TitrationLadder, type LadderDisplay } from './TitrationLadder'
import { UnsavedSheet } from './UnsavedSheet'
import { useUnsavedGuard } from './useUnsavedGuard'

/** Waits for the lists the form starts from, then mounts it. */
export function ProtocolEditorPage() {
  const { t } = useTranslation()
  const { protocolId } = useParams()
  const [params] = useSearchParams()
  const scope = usePatientScope()
  // Someone I share with can propose a protocol for me: ?patient=<id>.
  const patientId = params.get('patient') ?? scope.patientId
  const protocols = useProtocols(patientId)
  const inventory = useInventory(patientId)
  const { user } = useSession()
  const savedParam = params.get('saved')
  const copyParam = params.get('copy')
  const templateParam = params.get('template')
  const saved = useSavedProtocols(user?.id)
  const vials = useMemo(() => inventory.data ?? [], [inventory.data])

  if (
    ((protocolId || copyParam) && protocols.isPending) ||
    (savedParam && saved.isPending) ||
    inventory.isLoading
  ) {
    return (
      <div className="pt-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-4 h-60 w-full" />
      </div>
    )
  }
  const existing = protocolId ? protocols.data?.find((p) => p.id === protocolId) : undefined
  if (protocolId && !existing) return <PageHeader title={t('errors.notFound')} back />
  const copyRow = copyParam ? protocols.data?.find((p) => p.id === copyParam) : undefined
  const savedRow = savedParam ? saved.data?.find((s) => s.id === savedParam) : undefined
  const source: DraftSource = existing
    ? { kind: 'existing', row: existing }
    : copyRow
      ? { kind: 'copy', row: copyRow }
      : savedRow
        ? { kind: 'saved', row: savedRow }
        : templateParam
          ? { kind: 'template', id: templateParam }
          : { kind: 'blank', compoundId: params.get('compound') }

  return (
    <ProtocolForm
      key={`${existing?.id ?? 'new'}:${copyParam ?? ''}:${savedParam ?? ''}:${templateParam ?? ''}`}
      patientId={patientId}
      source={source}
      vials={vials}
    />
  )
}

function ProtocolForm({
  patientId,
  source,
  vials: liveVials,
}: {
  patientId: string
  source: DraftSource
  vials: readonly InventoryRow[]
}) {
  const { t } = useTranslation()
  const { locale, pick } = useLocale()
  const nav = useNavigate()
  const location = useLocation()
  const { toast } = useToast()
  const { user } = useSession()
  const text = useCycleText()
  const now = useNow()
  const save = useSaveProtocol(patientId)
  const saved = useSavedProtocols(user?.id)
  const saveTemplate = useSaveSavedProtocol(user?.id ?? '')
  const [picker, setPicker] = useState<'primary' | 'component' | null>(null)
  // What a unit means is fixed while editing: a refetch must not change doses under the thumb.
  const [vials] = useState(liveVials)
  // A dose change on the step in force starts this week unless the person says otherwise.
  const [fromThisWeek, setFromThisWeek] = useState(true)
  const existing = source.kind === 'existing' ? source.row : undefined

  /** mg/mL of each compound in the vial it is drawn from: what makes units mean something. */
  const concOf = useMemo<ConcOf>(
    () => (id) => {
      const vial = activeVial(vials, id)
      return vial ? concentrationFor(vial, id) : null
    },
    [vials],
  )

  const [initial] = useState(() => {
    const start = initialDraft(source, {
      concOf,
      pick,
      now: new Date(),
      copySuffix: t('protocols.copySuffix'),
    })
    const model = buildModel(start.draft, {
      concOf,
      vials,
      now: new Date(),
      origin: start.origin,
      fromThisWeek: true,
    })
    return { ...start, signature: signature(start.draft, model) }
  })
  const [draft, setDraft] = useState<Draft>(initial.draft)
  const origin = initial.origin

  const patch = (p: Partial<Draft>) => setDraft((d) => ({ ...d, ...p }))
  const patchStep = (k: number, p: Partial<StepDraft>) =>
    setDraft((d) => ({ ...d, steps: d.steps.map((s) => (s.key === k ? { ...s, ...p } : s)) }))
  const patchComponent = (k: number, p: Partial<ComponentDraft>) =>
    setDraft((d) => ({
      ...d,
      components: d.components.map((c) => (c.key === k ? { ...c, ...p } : c)),
    }))
  const compound = draft.compoundId ? compoundById(draft.compoundId) : undefined
  const native = unitOf(draft.compoundId)
  const primaryConc = concOf(draft.compoundId)
  const primaryVial = activeVial(vials, draft.compoundId)

  // ---------- derived model ----------
  const model = useMemo(
    () => buildModel(draft, { concOf, vials, now, origin, fromThisWeek }),
    [draft, concOf, vials, now, origin, fromThisWeek],
  )
  const dirty = signature(draft, model) !== initial.signature
  const guard = useUnsavedGuard(dirty)

  const rowOf = (key: number) => model.rows.find((r) => r.key === key)?.step ?? null
  const firstDoseMg = model.rows.find((r) => r.step && !r.step.pause)?.step?.doseMg ?? null
  /** A dose as it is read: "12 U (200 + 200 mcg)". */
  const readDose = (mg: number) =>
    model.plan ? fmtDoseLine(doseView(model.plan, mg, vials), locale) : fmtNumber(mg, locale, 3)

  function applyTemplate(ref: string) {
    if (!ref) return patch({ templateRef: '' })
    const [kind, id] = ref.split(':') as ['label' | 'saved', string]
    if (kind === 'label') {
      const tpl = templateById(id)
      if (!tpl) return
      patch({
        ...draftFromParts(tpl.compoundId, tpl.steps, [], model.times, concOf),
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
          concOf,
        ),
        templateRef: ref,
        name: row.name,
        notes: row.notes ?? draft.notes,
      })
    }
  }

  function setPrimaryEntry(to: DoseEntry) {
    setDraft((d) => ({
      ...d,
      doseEntry: to,
      steps: d.steps.map((s) =>
        s.pause ? s : convertField(s, d.doseEntry, to, concOf(d.compoundId)),
      ),
    }))
  }

  function setComponentEntry(c: ComponentDraft, to: DoseEntry) {
    patchComponent(c.key, convertField(c, c.entry, to, concOf(c.compoundId)))
  }

  function pickSubstance(id: string) {
    if (picker === 'primary') {
      patch({ compoundId: id, doseEntry: defaultEntry(unitOf(id), concOf(id)) })
    } else {
      const entry = defaultEntry(unitOf(id), concOf(id))
      // From a premixed vial that holds both, the new compound starts at the dose that
      // fills the same volume as the primary.
      const vial = activeVial(vials, id)
      const sameBlend = vial && primaryVial?.id === vial.id && isBlend(vial)
      const mg = sameBlend ? blendPartnerMg(firstDoseMg ?? 0, primaryConc, concOf(id)) : null
      setDraft((d) => ({
        ...d,
        components: [
          ...d.components,
          {
            key: nextKey(),
            compoundId: id,
            entry,
            ...(mg !== null ? doseField(mg, entry, concOf(id)) : { dose: '' }),
          },
        ],
      }))
    }
    setPicker(null)
  }

  const leave = () => (location.key === 'default' ? nav('/protocols', { replace: true }) : nav(-1))

  async function submit() {
    if (!draft.compoundId) {
      toast(t('protocols.pickSubstance'), 'warn')
      return setPicker('primary')
    }
    if (model.steps.length === 0) return toast(t('errors.positive'), 'warn')
    if (draft.mode === 'weekdays' && draft.weekdays.length === 0)
      return toast(t('protocols.pickDays'), 'warn')
    if (model.openEndedInMiddle) return toast(t('protocols.openEndedLastOnly'), 'warn')
    if (!user) return
    const name =
      draft.name.trim() ||
      [
        compound?.names.generic,
        ...model.components.map((c) => compoundById(c.compoundId)?.names.generic),
      ]
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
        unit: native,
        start_date: draft.startDate,
        // Postgres `time` has no 25:00: the clock time goes there, the full value in `times`.
        time_of_day: splitNightTime(model.times[0] ?? '09:00').clock,
        times: model.times,
        steps: model.steps as unknown as Json,
        components: model.components as unknown as Json,
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
          unit: native,
          steps: model.steps as unknown as Json,
          components: model.components as unknown as Json,
          times: model.times,
          notes: draft.notes.trim() || null,
        })
      }
      toast(t('common.saved'), 'success')
      guard.allow()
      leave()
    } catch (e) {
      toast((e as Error).message || t('common.error'), 'error')
    }
  }

  const preview = useMemo(() => {
    const last = model.steps.findLast((s) => !s.pause)
    if (!last || !compound?.pk) return null
    return steadyState(last.doseMg, effectiveIntervalH(last, model.times), compound.pk)
  }, [model.steps, model.times, compound])

  const mySaved = (saved.data ?? []).filter((s) => s.owner_id === user?.id)
  const sharedSaved = (saved.data ?? []).filter((s) => s.owner_id !== user?.id)

  // The ladder reads in syringe units when the vial is known.
  const plan = model.plan
  const display: LadderDisplay | undefined =
    plan && primaryConc
      ? { value: (mg) => doseView(plan, mg, vials).units ?? 0, unit: t('units.units') }
      : undefined
  const summary = model.summary
  const stickyLine = summary ? text.next(summary) : null

  return (
    <div className="pb-4">
      <PageHeader
        eyebrow={t('protocols.eyebrow')}
        title={existing ? t('protocols.edit') : t('protocols.new')}
        back
      />

      <div className="flex flex-col gap-3">
        {!existing && (
          <Card title={t('protocols.startFrom')} subtitle={t('protocols.templateHint')}>
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

        {source.kind === 'copy' && (
          <p className="rounded-control border border-line bg-panel-2 px-3.5 py-3 text-[13px] leading-snug text-ink-2">
            {t('protocols.copyHint', { name: source.row.name })}
          </p>
        )}

        {/* 01 · Substances */}
        <SubstancesCard
          draft={draft}
          vials={vials}
          concOf={concOf}
          firstDoseMg={firstDoseMg}
          onPick={setPicker}
          onPatchComponent={patchComponent}
          onComponentEntry={setComponentEntry}
          onRemoveComponent={(key) =>
            patch({ components: draft.components.filter((x) => x.key !== key) })
          }
        />

        {/* 02 · Schedule */}
        <ScheduleCard
          draft={draft}
          steps={model.steps}
          times={model.times}
          now={now}
          onChange={patch}
        />

        {/* 03 · Steps */}
        <Card title={t('protocols.steps')} subtitle={t('protocols.stepsHint')}>
          {compound && (
            <div className="mb-3 flex flex-col gap-2">
              <EntryToggle
                entry={draft.doseEntry}
                native={native}
                conc={primaryConc}
                onChange={setPrimaryEntry}
              />
              <EntryNote
                native={native}
                conc={primaryConc}
                vialLabel={primaryVial?.label}
                name={compound.names.generic}
              />
            </div>
          )}
          <ul className="flex flex-col gap-2.5">
            {draft.steps.map((s, i) => {
              const step = rowOf(s.key)
              const mg = step && !step.pause ? step.doseMg : null
              const offer = model.offer?.key === s.key ? model.offer : null
              return (
                <StepRow
                  key={s.key}
                  step={s}
                  index={i}
                  now={now}
                  doseEntry={draft.doseEntry}
                  native={native}
                  conc={primaryConc}
                  mg={mg}
                  weeks={step?.durationWeeks ?? null}
                  time={model.timeline.get(s.key)}
                  past={model.past.edited.get(s.key)}
                  syringe={
                    mg !== null && model.components.length > 0 && model.plan
                      ? fmtDoseLine(doseView(model.plan, mg, vials), locale)
                      : null
                  }
                  fromWeek={
                    offer
                      ? {
                          weeksBehind: offer.weeksBehind,
                          fromText: readDose(offer.fromMg),
                          apply: fromThisWeek,
                          onApply: setFromThisWeek,
                        }
                      : null
                  }
                  removable={draft.steps.length > 1}
                  onChange={(p) => patchStep(s.key, p)}
                  onRemove={() => patch({ steps: draft.steps.filter((x) => x.key !== s.key) })}
                />
              )
            })}
          </ul>
          {model.past.removed > 0 && (
            <p
              role="status"
              className="mt-2.5 rounded-control border border-warn/30 bg-warn-soft px-3 py-2 text-[12.5px] leading-snug text-ink-2"
            >
              {t('protocols.past.weeks')}
            </p>
          )}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              size="md"
              variant="soft"
              leading={<Plus className="size-4" />}
              onClick={() =>
                patch({
                  steps: [
                    ...draft.steps,
                    {
                      key: nextKey(),
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
              size="md"
              variant="secondary"
              leading={<Pause className="size-4" />}
              onClick={() =>
                patch({
                  steps: [
                    ...draft.steps,
                    { key: nextKey(), pause: true, dose: '', weeks: '4', label: '' },
                  ],
                })
              }
            >
              {t('protocols.addPause')}
            </Button>
          </div>
          {model.openEndedInMiddle && (
            <p role="alert" className="mt-3 text-[12.5px] text-danger">
              {t('protocols.openEndedLastOnly')}
            </p>
          )}
          {model.steps.length > 1 && !model.openEndedInMiddle && model.plan && (
            <div className="mt-4 rounded-control border border-line bg-panel-2 p-3">
              <div className="spec mb-2">{t('protocols.ladderPreview')}</div>
              <TitrationLadder
                protocol={model.plan}
                unit={native}
                color={compoundColor(draft.compoundId)}
                now={now}
                display={display}
              />
            </div>
          )}
        </Card>

        <PlanPreview
          model={model}
          origin={origin}
          vials={vials}
          now={now}
          color={compoundColor(draft.compoundId)}
          split={Boolean(model.offer) && fromThisWeek}
        />

        {preview && (
          <Card tone="signal" eyebrow={t('protocols.preview')} title={compound?.names.generic}>
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

        <Card title={t('protocols.details')}>
          <div className="flex flex-col gap-4">
            <Field label={t('protocols.name')}>
              {(id) => (
                <Input
                  id={id}
                  value={draft.name}
                  autoCapitalize="sentences"
                  enterKeyHint="done"
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
            <Field
              label={t('protocols.startDate')}
              hint={
                origin && draft.startDate !== origin.startDate
                  ? t('protocols.startMoves')
                  : undefined
              }
            >
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
            <ToggleRow
              checked={draft.saveAsTemplate}
              onChange={(saveAsTemplate) => patch({ saveAsTemplate })}
              label={t('protocols.saveAsTemplate')}
              hint={t('protocols.saveAsTemplateHint')}
            />
          </div>
        </Card>

        {/* Always in reach: above the dock, below the content. */}
        <div className="sticky bottom-[calc(max(env(safe-area-inset-bottom),10px)+84px)] z-30">
          <div className="flex items-center gap-3 rounded-[22px] border border-line-strong bg-panel/90 p-2 pl-4 shadow-2xl backdrop-blur-xl">
            <div className="min-w-0 flex-1">
              <div className={clsx('spec', dirty && 'text-warn')}>
                {dirty ? t('protocols.sticky.dirty') : t('protocols.sticky.clean')}
              </div>
              {stickyLine && (
                <div className="line-clamp-2 text-[12.5px] text-ink-2">{stickyLine}</div>
              )}
            </div>
            <Button size="md" loading={save.isPending || saveTemplate.isPending} onClick={submit}>
              {t('common.save')}
            </Button>
          </div>
        </div>
      </div>

      <SubstancePicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        exclude={[draft.compoundId, ...draft.components.map((c) => c.compoundId)].filter(Boolean)}
        onPick={pickSubstance}
      />
      <UnsavedSheet blocker={guard.blocker} />
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
