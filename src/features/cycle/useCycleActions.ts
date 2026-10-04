/**
 * What the cycle card changes: a protocol's steps (hold a week, update a dose, or put the
 * old plan back), which decisions were dealt with, and which the person put off until
 * tomorrow.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { addDays, format } from 'date-fns'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import { compoundById } from '@/content/compounds'
import type { InventoryRow, Json, ProtocolRow } from '@/data/database.types'
import { qk, useDismissAlert, useRestoreAlert } from '@/data/hooks'
import { toProtocolLike } from '@/data/mappers'
import { holdStep } from '@/domain/dosing/stepEdit'
import { fmtDate } from '@/lib/format'
import { requireSupabase } from '@/lib/supabase'
import { useLocale } from '@/lib/useLocale'
import { decisionKey, type CycleDecision } from './decision'
import { doseInline, stepDose } from './dose'
import { driftKey, type DoseDrift } from './drift'
import { withStepDose } from './planEdit'
import type { Item } from './queue'

/** The parts of a protocol the cycle card edits. */
export type ProtocolPatch = Partial<Pick<ProtocolRow, 'steps' | 'components'>>

/**
 * Change some columns of a protocol without rewriting the rest (`useSaveProtocol` takes the
 * whole row). Optimistic, so the card answers at once; the old values come back if it fails.
 */
export function useProtocolPatch(patientId: string) {
  const qc = useQueryClient()
  const key = qk.protocols(patientId)
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ProtocolPatch }) => {
      const { error } = await requireSupabase().from('protocols').update(patch).eq('id', id)
      if (error) throw new Error(error.message)
    },
    onMutate: async ({ id, patch }) => {
      await qc.cancelQueries({ queryKey: key })
      const previous = qc.getQueryData<ProtocolRow[]>(key)
      qc.setQueryData<ProtocolRow[]>(key, (rows) =>
        rows?.map((r) => (r.id === id ? { ...r, ...patch } : r)),
      )
      return { previous }
    },
    onError: (_e, _vars, ctx) => qc.setQueryData(key, ctx?.previous),
    onSettled: () => qc.invalidateQueries({ queryKey: key }),
  })
}

/* ------------------------------------------------------------ answers */

const unitOf = (item: Item) => compoundById(item.protocol.compound_id)?.defaultUnit ?? 'mg'

/**
 * The answers to what the card asks, each with its way back: go ahead (remembered as dealt
 * with), hold a week, update the plan to the dose taken, or "it was a one-off". Each one
 * says what it did in the app's toast, with the way back.
 */
export function useCycleActions(patientId: string, userId: string, vials: readonly InventoryRow[]) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { toast } = useToast()
  const dismiss = useDismissAlert(userId)
  const restore = useRestoreAlert(userId)
  const patch = useProtocolPatch(patientId)
  const day = (d: Date) => fmtDate(d, locale, 'EEEE d')
  const fail = () => toast(t('common.error'), 'error')

  /** Say what was done, with the way back. */
  function announce(text: string, undo: () => Promise<unknown>) {
    toast(text, 'success', {
      action: {
        label: t('cycle.action.undo'),
        onAction: async () => {
          try {
            await undo()
          } catch {
            fail()
          }
        },
      },
    })
  }

  /** Remember "dealt with" and show the way back. */
  function dealWith(key: string, text: string) {
    dismiss.mutate(key, { onError: fail })
    announce(text, () => restore.mutateAsync(key))
  }

  return {
    /** Something is being saved: the buttons wait, so an answer is never given twice. */
    busy: dismiss.isPending || restore.isPending || patch.isPending,

    /** Go ahead as planned: the decision is dealt with. */
    acknowledge(item: Item, d: CycleDecision) {
      const to =
        d.to && !d.to.pause ? stepDose(toProtocolLike(item.protocol), vials, d.to.doseMg) : null
      const text =
        d.kind === 'increase' && to
          ? t(d.timing === 'today' ? 'cycle.notice.upToday' : 'cycle.notice.up', {
              date: day(d.on),
              dose: doseInline(to, unitOf(item), locale),
            })
          : t('cycle.notice.seen')
      dealWith(decisionKey(item.protocol.id, d), text)
    },

    /** One more week on the step: the change moves back a week. */
    hold(item: Item, d: CycleDecision) {
      if (d.holdIndex === null) return
      const { id, steps: before } = item.protocol
      const steps = holdStep(toProtocolLike(item.protocol).steps, d.holdIndex) as unknown as Json
      patch.mutate({ id, patch: { steps } }, { onError: fail })
      announce(t('cycle.notice.held', { date: day(addDays(d.on, 7)) }), () =>
        patch.mutateAsync({ id, patch: { steps: before } }),
      )
    },

    /** The plan follows what is actually taken. */
    updatePlan(item: Item, drift: DoseDrift) {
      const { id, steps, components } = item.protocol
      const pl = toProtocolLike(item.protocol)
      const edited = withStepDose(pl.steps, pl.components ?? [], drift.stepIndex, drift.actualMg)
      patch.mutate(
        {
          id,
          patch: {
            steps: edited.steps as unknown as Json,
            components: edited.components as unknown as Json,
          },
        },
        { onError: fail },
      )
      const dose = stepDose({ ...pl, ...edited }, vials, drift.actualMg)
      announce(t('cycle.notice.updated', { dose: doseInline(dose, unitOf(item), locale) }), () =>
        patch.mutateAsync({ id, patch: { steps, components } }),
      )
    },

    /** It was a one-off: the plan stays as it is and these doses are not asked about again. */
    once(item: Item, drift: DoseDrift) {
      dealWith(driftKey(item.protocol.id, drift.sinceDay), t('cycle.notice.once'))
    },
  }
}

/* ------------------------------------------------------------ decide later */

const laterKey = (userId: string | undefined) => `titra.cycle.later.${userId ?? ''}`

/** Decision key → the day (yyyy-MM-dd) it was put off. */
type Later = Record<string, string>

function readLater(storeKey: string): Later {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(storeKey) ?? '{}')
    if (typeof parsed !== 'object' || parsed === null) return {}
    return Object.fromEntries(
      Object.entries(parsed).filter((e): e is [string, string] => typeof e[1] === 'string'),
    )
  } catch {
    return {}
  }
}

/**
 * "Decide later" puts a decision off until tomorrow: it folds into a line instead of asking
 * again every time the app opens. Remembered on this device only (a convenience, not data).
 */
export function useDecideLater(userId: string | undefined, now: Date) {
  const storeKey = laterKey(userId)
  const [later, setLater] = useState<Later>(() => readLater(storeKey))
  const today = format(now, 'yyyy-MM-dd')

  const save = (next: Later) => {
    setLater(next)
    try {
      localStorage.setItem(storeKey, JSON.stringify(next))
    } catch {
      // Private mode: it lasts until the app is closed.
    }
  }
  // Only today's entries matter; the rest are old.
  const current = () => Object.fromEntries(Object.entries(later).filter(([, day]) => day === today))

  return {
    isLater: (key: string) => later[key] === today,
    postpone: (key: string) => save({ ...current(), [key]: today }),
    reopen: (key: string) =>
      save(Object.fromEntries(Object.entries(current()).filter(([k]) => k !== key))),
  }
}
