import { Info, Plus, Syringe } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Button } from '@/components/ui/Button'
import { Field, Textarea } from '@/components/ui/Field'
import { Sheet } from '@/components/ui/Sheet'
import { SubstanceDot } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import { compoundColor } from '@/content/substanceColor'
import { useAddDose, useDeleteDoses, useDoses, useInventory, useProtocols } from '@/data/hooks'
import { suggestNextSite } from '@/domain/sites/injectionSites'
import { concentrationFor, vialHas } from '@/features/inventory/vials'
import { SubstancePicker } from '@/features/protocols/SubstancePicker'
import {
  fmtDose,
  fmtNumber,
  fromDateTimeInputs,
  toDateInputValue,
  toTimeInputValue,
} from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { FastingCard } from '@/features/fasting/FastingCard'
import { needsFasting } from '@/features/fasting/fasting'
import { SitePicker } from '@/features/sites/SitePicker'
import { siteHistory } from './administrations'
import { DoseLine } from './DoseLine'
import { DrawGuide } from './DrawGuide'
import {
  amountToLog,
  buildInsertRows,
  drawPlanOf,
  lastMgOf,
  linesForProtocol,
  makeLine,
  partnerMg,
  patchLine,
  type Line,
} from './doseLines'
import { FreeDoseChooser } from './FreeDoseChooser'
import { freeChoices, linesForChoice, type FreeChoice } from './freeChoices'
import { SlotPicker } from './SlotPicker'
import { slotDayText } from './slotText'
import { SheetSection } from './SheetSection'
import { shortNames } from './substanceNames'
import { useSlotAssignment } from './useSlotAssignment'
import { WhenField, type WhenMode } from './WhenField'

export interface LogDoseSheetProps {
  open: boolean
  onClose: () => void
  /** Log an administration of this protocol (all its stack compounds). */
  protocolId?: string | null
  /** Free dose of a single compound, outside any protocol. */
  compoundId?: string
  /** The planned time of the administration being logged: it is offered as what the dose covers. */
  plannedAt?: Date
}

/**
 * Mounted only while open, and only once protocols, vials and history are loaded, so each
 * opening starts from fresh, data-derived defaults (also when opened from a notification).
 */
export function LogDoseSheet(props: LogDoseSheetProps) {
  return props.open ? <LogDoseLoader {...props} /> : null
}

function LogDoseLoader(props: LogDoseSheetProps) {
  const { patientId } = usePatientScope()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 120)
  const inventory = useInventory(patientId)
  if (protocols.isPending || doses.isPending || inventory.isPending) return null
  return <LogDoseForm {...props} />
}

function LogDoseForm({
  onClose,
  protocolId: initialProtocolId,
  compoundId: initialCompoundId,
  plannedAt,
}: LogDoseSheetProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { patientId } = usePatientScope()
  const { toast } = useToast()
  const protocols = useProtocols(patientId)
  const doses = useDoses(patientId, 120)
  const inventory = useInventory(patientId)
  const addDose = useAddDose(patientId)
  const deleteDoses = useDeleteDoses(patientId)

  const active = useMemo(
    () => (protocols.data ?? []).filter((p) => p.status === 'active'),
    [protocols.data],
  )
  const vials = useMemo(() => inventory.data ?? [], [inventory.data])
  const doseRows = useMemo(() => doses.data ?? [], [doses.data])
  // When the sheet opened: fixed for the life of the form.
  const [openedAt] = useState(() => Date.now())
  const opened = useMemo(() => new Date(openedAt), [openedAt])

  const [protocolId, setProtocolId] = useState(() => initialProtocolId ?? '')
  const [lines, setLines] = useState<Line[]>(() =>
    initialProtocolId
      ? linesForProtocol(
          active.find((p) => p.id === initialProtocolId),
          vials,
          plannedAt,
        )
      : initialCompoundId
        ? [makeLine(initialCompoundId, undefined, vials)]
        : [],
  )
  // Free dose: the substance picker to replace the choice, or to add to the syringe.
  const [picker, setPicker] = useState<'replace' | 'add' | null>(null)
  // The choice can be changed only when it was not handed in by whoever opened the sheet.
  const free = !initialProtocolId && !initialCompoundId
  const [whenMode, setWhenMode] = useState<WhenMode>('now')
  const [date, setDate] = useState(() => toDateInputValue(new Date()))
  const [time, setTime] = useState(() => toTimeInputValue(new Date()))
  const sites = useMemo(() => siteHistory(doseRows), [doseRows])
  const [siteId, setSiteId] = useState(() => suggestNextSite(sites)?.siteId ?? '')
  const [notes, setNotes] = useState('')

  const protocol = active.find((p) => p.id === protocolId)
  const injectable = lines.some((l) =>
    compoundById(l.compoundId)?.routes.some((r) => r === 'sc' || r === 'im'),
  )

  const source = useMemo(
    () => ({ protocols: protocols.data ?? [], vials, doses: doseRows, now: opened }),
    [protocols.data, vials, doseRows, opened],
  )
  const choices = useMemo(() => freeChoices(source), [source])

  // The syringe guide: kept on screen (empty) while the amount is retyped, so nothing jumps.
  const plan = useMemo(
    () => (injectable ? drawPlanOf(lines, vials) : null),
    [injectable, lines, vials],
  )
  const drawable =
    injectable &&
    lines.some((l) => {
      const vial = vials.find((v) => v.id === l.inventoryId)
      return Boolean(vial && concentrationFor(vial, l.compoundId))
    })

  // The moment of the dose, to place it on the plan and to rotate the site.
  const doseAt = useMemo(
    () =>
      whenMode === 'now'
        ? opened
        : whenMode === 'planned' && plannedAt
          ? plannedAt
          : fromDateTimeInputs(date, time),
    [whenMode, opened, plannedAt, date, time],
  )
  const slot = useSlotAssignment({
    protocol,
    doses: doseRows,
    doseAt,
    now: opened,
    preferred: plannedAt ?? null,
  })

  function choose(choice: FreeChoice) {
    const chosen = linesForChoice(choice, source)
    setProtocolId(chosen.protocolId)
    setLines(chosen.lines)
  }

  function back() {
    setProtocolId('')
    setLines([])
  }

  async function submit() {
    const at = whenMode === 'now' ? new Date() : doseAt
    const rows = buildInsertRows(
      {
        patientId,
        protocolId: protocolId || null,
        at,
        siteId: injectable ? siteId || null : null,
        notes: notes.trim() || null,
        plannedAt: slot?.plannedAt ?? null,
      },
      lines,
      vials,
    )
    if (!rows) {
      toast(t('errors.positive'), 'warn')
      return
    }
    try {
      const created = await addDose.mutateAsync(rows)
      const ids = created.map((r) => r.id)
      onClose()
      toast(
        slot?.selected.kind === 'missed'
          ? t('doses.loggedAs', { slot: slotDayText(slot.selected.slot, locale) })
          : t('doses.logged'),
        'success',
        {
          action: {
            label: t('doses.undo'),
            onAction: async () => {
              try {
                await deleteDoses.mutateAsync(ids)
                toast(t('doses.undone'), 'info')
              } catch {
                toast(t('common.error'), 'error')
              }
            },
          },
        },
      )
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  const everyCompound = lines.flatMap((l) => [l.compoundId, ...l.partners])
  const title = protocol?.name || shortNames(everyCompound)
  const choosing = lines.length === 0
  const amount = amountToLog(lines, vials, plan)

  return (
    <>
      <Sheet
        // Fixed height: what loads after it opens (vial, sites, syringe) must not move it.
        tall
        open
        onClose={onClose}
        title={choosing ? t('doses.choose.title') : t('doses.logTitle')}
        description={choosing ? t('doses.choose.hint') : undefined}
        footer={
          !choosing && (
            <Button
              block
              size="lg"
              loading={addDose.isPending}
              leading={<Syringe className="size-5" />}
              onClick={submit}
            >
              {amount
                ? t('doses.confirmAmount', {
                    amount:
                      'units' in amount
                        ? `${fmtNumber(amount.units, locale, 1)} U`
                        : fmtDose(amount.mg, amount.unit, locale),
                  })
                : t('doses.confirm')}
            </Button>
          )
        }
      >
        {choosing ? (
          <FreeDoseChooser
            choices={choices}
            onChoose={choose}
            onOther={() => setPicker('replace')}
          />
        ) : (
          <div className="flex flex-col gap-6 pb-2 pt-1">
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center gap-3">
                <span className="flex shrink-0 items-center gap-1" aria-hidden>
                  {everyCompound.map((id) => (
                    <SubstanceDot key={id} color={compoundColor(id)} size={9} />
                  ))}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block break-words text-[17px] font-semibold leading-snug">
                    {title}
                  </span>
                  <span className="spec block">
                    {protocol ? t('doses.chosen.protocol') : t('doses.chosen.oneOff')}
                  </span>
                </span>
                {free && (
                  <button
                    type="button"
                    onClick={back}
                    className="-mr-2 min-h-11 shrink-0 rounded-full px-2 text-[14px] font-semibold text-signal"
                  >
                    {t('doses.choose.change')}
                  </button>
                )}
              </div>
              {protocol?.notes && (
                <p className="flex items-start gap-2 text-[13px] leading-snug text-muted">
                  <Info aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                  <span className="min-w-0 break-words">{protocol.notes}</span>
                </p>
              )}
            </div>

            <WhenField
              mode={whenMode}
              onMode={setWhenMode}
              plannedAt={plannedAt}
              openedAt={openedAt}
              date={date}
              time={time}
              onDate={setDate}
              onTime={setTime}
            />

            {slot && <SlotPicker assignment={slot} />}

            <SheetSection
              label={lines.length > 1 ? t('doses.sameSyringe') : t('doses.dose')}
              action={
                !protocolId && (
                  <button
                    type="button"
                    onClick={() => setPicker('add')}
                    className="tap-link flex items-center gap-1 text-[13px] font-semibold text-signal"
                  >
                    <Plus aria-hidden className="size-3.5" /> {t('doses.addToSyringe')}
                  </button>
                )
              }
            >
              <div className="flex flex-col divide-y divide-line">
                {lines.map((l) => (
                  <div key={l.key} className="py-3 first:pt-0 last:pb-0">
                    <DoseLine
                      line={l}
                      vials={vials.filter((v) => vialHas(v, l.compoundId))}
                      locale={locale}
                      named={lines.length > 1}
                      removable={!protocolId && lines.length > 1}
                      onChange={(p) => setLines((ls) => patchLine(ls, l.key, p, vials))}
                      onRemove={() => setLines((ls) => ls.filter((x) => x.key !== l.key))}
                      partnerDoses={l.partners.map((c) => ({
                        compoundId: c,
                        mg: partnerMg(l, c, vials),
                      }))}
                      lastMg={lastMgOf(doseRows, l.compoundId)}
                    />
                  </div>
                ))}
              </div>
              {drawable && <DrawGuide plan={plan} />}
              {needsFasting(everyCompound) && <FastingCard name={title} />}
            </SheetSection>

            {injectable && (
              <SheetSection label={t('doses.site')}>
                <SitePicker
                  value={siteId}
                  onChange={setSiteId}
                  history={sites}
                  now={doseAt}
                  compoundId={lines[0]?.compoundId}
                />
              </SheetSection>
            )}

            <Field label={`${t('common.notes')} · ${t('common.optional')}`}>
              {(id) => (
                <Textarea
                  id={id}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                />
              )}
            </Field>
          </div>
        )}
      </Sheet>

      <SubstancePicker
        open={picker !== null}
        onClose={() => setPicker(null)}
        exclude={picker === 'add' ? lines.map((l) => l.compoundId) : []}
        onPick={(cid) => {
          if (picker === 'add') {
            setLines((ls) => [...ls, makeLine(cid, undefined, vials)])
          } else {
            setProtocolId('')
            setLines([makeLine(cid, undefined, vials)])
          }
          setPicker(null)
        }}
      />
    </>
  )
}
