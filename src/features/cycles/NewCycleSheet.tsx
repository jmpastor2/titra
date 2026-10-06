import { addDays } from 'date-fns'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Input, Select } from '@/components/ui/Field'
import { Chip, Segmented } from '@/components/ui/primitives'
import { Sheet } from '@/components/ui/Sheet'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import type { InventoryRow } from '@/data/database.types'
import { useSaveProtocol, useSetProtocolStatus } from '@/data/hooks'
import { cycleInfo } from '@/domain/dosing/cycle'
import { useSession } from '@/features/auth/SessionProvider'
import { TitrationLadder } from '@/features/protocols/TitrationLadder'
import { fmtDate, toDateInputValue } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useCycleText } from './cycleText'
import { doseLabel } from './doseLabel'
import type { CycleView } from './model'
import {
  buildNextCycle,
  closesOnNewCycle,
  isStartDate,
  nextCycleLike,
  nextMonday,
  startChoices,
} from './newCycle'
import { stepWeeks } from './readout'
import { SheetSection } from '@/features/doses/SheetSection'

type Preset = 'first' | 'left' | 'custom'

/** Mounted only while open, so every opening starts from the defaults. */
export function NewCycleSheet({
  view,
  open,
  onClose,
  vials,
  now,
}: {
  view: CycleView | null
  open: boolean
  onClose: () => void
  vials: readonly InventoryRow[]
  now: Date
}) {
  return open && view ? (
    <NewCycleForm view={view} onClose={onClose} vials={vials} now={now} />
  ) : null
}

function NewCycleForm({
  view,
  onClose,
  vials,
  now,
}: {
  view: CycleView
  onClose: () => void
  vials: readonly InventoryRow[]
  now: Date
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const text = useCycleText()
  const { toast } = useToast()
  const { user } = useSession()
  const { patientId } = usePatientScope()
  const save = useSaveProtocol(patientId)
  const setStatus = useSetProtocolStatus(patientId)

  const choices = useMemo(() => startChoices(view, now), [view, now])
  const first = choices.find((c) => c.first)
  const leftOff = choices.find((c) => c.leftOff)
  const monday = toDateInputValue(nextMonday(now))
  const today = toDateInputValue(now)

  const [startDate, setStartDate] = useState(monday)
  const [fromStep, setFromStep] = useState(first?.stepIndex ?? 0)
  const valid = isStartDate(startDate)

  const nextLike = useMemo(
    () => nextCycleLike(view.row, valid ? startDate : monday, fromStep),
    [view.row, valid, startDate, monday, fromStep],
  )
  const preview = useMemo(() => (valid ? cycleInfo(nextLike, now) : null), [valid, nextLike, now])
  const ranges = useMemo(() => stepWeeks(preview?.steps ?? []), [preview])

  const label = (doseMg: number) =>
    doseLabel({ like: view.like, doseMg, vials, locale, withUnits: true })
  const doseText = (doseMg: number) => {
    const l = label(doseMg)
    return l.units ? `${l.full} · ${l.units}` : l.full
  }
  const preset: Preset =
    fromStep === first?.stepIndex ? 'first' : fromStep === leftOff?.stepIndex ? 'left' : 'custom'
  const date = (d: Date) => fmtDate(d, locale, 'EEE d MMM')
  const busy = save.isPending || setStatus.isPending

  async function submit() {
    if (!user || !valid) return
    try {
      await save.mutateAsync(
        buildNextCycle({ previous: view.row, userId: user.id, startDate, fromStep }),
      )
    } catch {
      toast(t('common.error'), 'error')
      return
    }
    // Insert first: if closing the old protocol fails nothing is lost, only two are open.
    if (closesOnNewCycle(view.row.status)) {
      try {
        await setStatus.mutateAsync({ id: view.row.id, status: 'completed' })
      } catch {
        toast(t('cycles.new.partial'), 'warn')
        onClose()
        return
      }
    }
    toast(t('cycles.new.started'), 'success')
    onClose()
  }

  return (
    <Sheet
      open
      onClose={onClose}
      title={t('cycles.new.title')}
      description={view.row.name}
      // The preview follows the date and the first step: a fixed height keeps the sheet still.
      tall
      footer={
        <Button block size="lg" loading={busy} disabled={!valid} onClick={() => void submit()}>
          {t('cycles.new.confirm')}
        </Button>
      }
    >
      <div className="flex flex-col gap-6 pb-4 pt-1">
        <p className="text-[13.5px] leading-snug text-ink-2">{t('cycles.new.intro')}</p>

        <div className="flex flex-col gap-2.5">
          <Field
            label={t('cycles.new.start')}
            hint={t('cycles.new.startHint')}
            error={valid ? undefined : t('cycles.new.badDate')}
          >
            {(id, describedBy) => (
              <Input
                id={id}
                type="date"
                value={startDate}
                aria-describedby={describedBy}
                invalid={!valid}
                onChange={(e) => setStartDate(e.target.value)}
              />
            )}
          </Field>
          <div className="-my-1 flex gap-2">
            <Chip active={startDate === monday} onClick={() => setStartDate(monday)}>
              {t('cycles.new.nextMonday')}
            </Chip>
            {today !== monday && (
              <Chip active={startDate === today} onClick={() => setStartDate(today)}>
                {t('cycles.new.today')}
              </Chip>
            )}
          </div>
        </div>

        {choices.length > 1 ? (
          <SheetSection label={t('cycles.new.first')}>
            <Segmented<Preset>
              value={preset}
              onChange={(p) => {
                const pick = p === 'first' ? first : leftOff
                if (pick) setFromStep(pick.stepIndex)
              }}
              options={[
                { value: 'first', label: t('cycles.new.fromStart') },
                { value: 'left', label: t('cycles.new.leftOff') },
              ]}
            />
            <Select
              aria-label={t('cycles.new.step')}
              value={fromStep}
              onChange={(e) => setFromStep(Number(e.target.value))}
            >
              {choices.map((c, i) => (
                <option key={c.stepIndex} value={c.stepIndex}>
                  {t('cycles.new.stepOption', { n: i + 1, dose: doseText(c.doseMg) })}
                </option>
              ))}
            </Select>
          </SheetSection>
        ) : (
          first && (
            <SheetSection label={t('cycles.new.first')}>
              <div className="readout text-[17px] font-semibold">{doseText(first.doseMg)}</div>
            </SheetSection>
          )
        )}

        {preview && (
          <SheetSection label={t('cycles.new.preview')} className="gap-3">
            <TitrationLadder
              protocol={nextLike}
              unit={compoundById(view.row.compound_id)?.defaultUnit ?? 'mg'}
              color={compoundColor(view.row.compound_id)}
              now={now}
              summary={false}
            />
            <p className="readout text-[12.5px] text-ink-2">
              {preview.endsOn
                ? t('cycles.new.range', {
                    from: date(preview.startsOn),
                    to: date(addDays(preview.endsOn, -1)),
                    span: text.span(
                      preview.totalWeeks ?? 0,
                      preview.doseWeeks ?? 0,
                      preview.restWeeks,
                    ),
                  })
                : t('cycles.new.rangeOpen', { from: date(preview.startsOn) })}
            </p>
            <ol className="divide-y divide-line border-y border-line">
              {preview.steps.map((s) => {
                const r = ranges[s.index]
                return (
                  <li key={s.index} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="min-w-0">
                      <div className="readout text-[14px] font-semibold">
                        {s.pause ? t('cycles.rest.title') : doseText(s.doseMg)}
                      </div>
                      <div className="text-[12.5px] text-muted">
                        {s.pause
                          ? t('common.weeks', { count: s.weeks ?? 0 })
                          : text.weekRange(r?.from ?? null, r?.to ?? null)}
                      </div>
                    </div>
                    <div className="readout shrink-0 text-right text-[12.5px] text-muted">
                      {date(s.startsOn)}
                    </div>
                  </li>
                )
              })}
            </ol>
          </SheetSection>
        )}

        <p className="text-[12.5px] leading-snug text-muted">
          {closesOnNewCycle(view.row.status)
            ? t('cycles.new.closes', { status: t('protocols.statuses.completed') })
            : t('cycles.new.keeps')}{' '}
          {t('cycles.new.editLater')}
        </p>
      </div>
    </Sheet>
  )
}
