import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { useToast } from '@/components/ui/Toast'
import type { InventoryRow, Json, ProtocolRow, ProtocolStatus } from '@/data/database.types'
import { useDeleteSavedProtocol, useSaveSavedProtocol, useSetProtocolStatus } from '@/data/hooks'
import { toProtocolLike } from '@/data/mappers'
import { splitNightTime } from '@/domain/dosing/schedule'
import { useSession } from '@/features/auth/SessionProvider'
import { useLocale } from '@/lib/useLocale'
import { useCycleText } from './cycleText'
import { cycleSummary, doseView, fmtDoseLine } from './cycleView'
import type { Habit } from './habit'
import { useUpdateProtocol } from './protocolMutations'
import { previewAction, type ActionPreview, type PlanEdit, type StepAction } from './stepChange'
import type { UndoOffer } from './useUndoOffer'

/** The sheet in front, if any. */
export type ActionSheet = 'menu' | 'hold' | 'moveUp' | 'dose' | 'archive'

export interface ActionContext {
  protocol: ProtocolRow
  vials: readonly InventoryRow[]
  now: Date
  /** Where to offer "Deshacer"; owned by the page so it outlives the card. */
  offerUndo: (offer: UndoOffer) => void
}

/**
 * What a person can do to a protocol from its card or its page, and doing it: change the
 * steps (keep the dose another week, move up, change the dose) or the status, each one
 * undoable by writing the previous values back.
 */
export function useProtocolActions({ protocol: p, vials, now, offerUndo }: ActionContext) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const text = useCycleText()
  const nav = useNavigate()
  const { toast } = useToast()
  const { user } = useSession()
  const { patientId } = usePatientScope()
  const update = useUpdateProtocol(patientId)
  const setStatus = useSetProtocolStatus(patientId)
  const saveSaved = useSaveSavedProtocol(user?.id ?? '')
  const deleteSaved = useDeleteSavedProtocol(user?.id ?? '')
  const [sheet, setSheet] = useState<ActionSheet | null>(null)

  const pl = useMemo(() => toProtocolLike(p), [p])
  const summary = useMemo(() => cycleSummary(pl, vials, now), [pl, vials, now])
  // Steps only move while the protocol is being followed.
  const following = p.status === 'active' || p.status === 'paused'
  const hold = useMemo(
    () => (following ? previewAction(pl, now, { kind: 'hold' }) : null),
    [following, pl, now],
  )
  const moveUp = useMemo(
    () => (following ? previewAction(pl, now, { kind: 'moveUp' }) : null),
    [following, pl, now],
  )
  const doseStep =
    following && summary?.info.step && !summary.info.step.pause ? summary.info.step : null

  /** A primary dose in mg as it is read: "12 U (200 + 200 mcg)". */
  const doseText = (mg: number | null) =>
    mg === null ? '—' : fmtDoseLine(doseView(pl, mg, vials), locale)

  const preview = (action: StepAction): ActionPreview | null => previewAction(pl, now, action)

  async function writeSteps(edit: PlanEdit, message: string): Promise<boolean> {
    const before = { steps: p.steps, components: p.components }
    try {
      await update.mutateAsync({
        id: p.id,
        patch: {
          steps: edit.steps as unknown as Json,
          components: edit.components as unknown as Json,
        },
      })
    } catch {
      toast(t('common.error'), 'error')
      return false
    }
    offerUndo({
      message,
      onUndo: async () => {
        await update.mutateAsync({ id: p.id, patch: before })
      },
    })
    return true
  }

  async function writeStatus(next: ProtocolStatus, message: string): Promise<boolean> {
    const before = p.status
    try {
      await setStatus.mutateAsync({ id: p.id, status: next })
    } catch {
      toast(t('common.error'), 'error')
      return false
    }
    offerUndo({
      message,
      onUndo: async () => {
        await setStatus.mutateAsync({ id: p.id, status: before })
      },
    })
    return true
  }

  /** Move the plan to the time the doses actually go in (reminders follow it), undoable. */
  async function moveToHabit(habit: Habit): Promise<boolean> {
    const before = { times: p.times, time_of_day: p.time_of_day }
    const clock = splitNightTime(habit.time).clock
    try {
      await update.mutateAsync({ id: p.id, patch: { times: [habit.time], time_of_day: clock } })
    } catch {
      toast(t('common.error'), 'error')
      return false
    }
    offerUndo({
      message: t('protocols.habit.done', { time: clock }),
      onUndo: async () => {
        await update.mutateAsync({ id: p.id, patch: before })
      },
    })
    return true
  }

  /** Run a step action from its confirmation; closes the sheet when it went through. */
  async function runStepAction(action: StepAction, message: (p: ActionPreview) => string) {
    const pending = previewAction(pl, now, action)
    if (!pending) return setSheet(null)
    if (await writeSteps(pending.edit, message(pending))) setSheet(null)
  }

  /** "El próximo cambio pasa al lun 12": what the done-toast says about the new date. */
  const movedTo = (pending: ActionPreview) =>
    pending.summary.next.after ? text.day(pending.summary.next.after.on) : null

  return {
    protocol: p,
    pl,
    vials,
    summary,
    now,
    following,
    /** Keep this step another week; null when the step in force has no end date to move. */
    hold,
    moveUp,
    /** The step in force, when it has a dose that can be changed. */
    doseStep,
    sheet,
    open: setSheet,
    close: () => setSheet(null),
    doseText,
    preview,
    busy: update.isPending || setStatus.isPending,
    edit: () => nav(`/protocols/${p.id}/edit`),
    duplicate: () => nav(`/protocols/new?copy=${p.id}`),
    applyHabit: moveToHabit,

    holdWeek: () =>
      runStepAction({ kind: 'hold' }, (a) => {
        const date = movedTo(a)
        return date ? t('protocolMenu.holdDone', { date }) : t('protocolMenu.holdDoneNoDate')
      }),
    moveUpWeek: () =>
      runStepAction({ kind: 'moveUp' }, (a) => {
        const date = movedTo(a)
        return date ? t('protocolMenu.moveUpDone', { date }) : t('protocolMenu.moveUpDoneNoDate')
      }),
    changeDose: (doseMg: number) =>
      runStepAction({ kind: 'setDose', doseMg }, () =>
        t('protocolMenu.doseDone', { dose: doseText(doseMg) }),
      ),

    togglePause: async () => {
      const next: ProtocolStatus = p.status === 'active' ? 'paused' : 'active'
      const key =
        next === 'paused'
          ? 'protocolMenu.pausedDone'
          : p.status === 'paused'
            ? 'protocolMenu.resumedDone'
            : 'protocolMenu.restoredDone'
      if (await writeStatus(next, t(key, { name: p.name }))) setSheet(null)
    },
    archive: async () => {
      if (await writeStatus('archived', t('protocolMenu.archivedDone', { name: p.name }))) {
        setSheet(null)
      }
    },
    saveAsReusable: async () => {
      if (!user) return
      try {
        const created: unknown = await saveSaved.mutateAsync({
          owner_id: user.id,
          name: p.name,
          compound_id: p.compound_id,
          unit: p.unit,
          steps: p.steps,
          components: p.components,
          times: p.times,
          notes: p.notes,
        })
        const savedId =
          typeof created === 'object' && created !== null && 'id' in created
            ? String(created.id)
            : null
        offerUndo({
          message: t('protocolMenu.savedDone', { name: p.name }),
          onUndo: async () => {
            if (savedId) await deleteSaved.mutateAsync(savedId)
          },
        })
        setSheet(null)
      } catch {
        toast(t('common.error'), 'error')
      }
    },
  }
}

export type ProtocolActions = ReturnType<typeof useProtocolActions>
