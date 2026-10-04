import { subDays } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { useToast } from '@/components/ui/Toast'
import type { MeasurementRow } from '@/data/database.types'
import { useLocale } from '@/lib/useLocale'
import { useQuickSave } from './useQuickSave'
import { fmtVolume, WATER_ADDS } from './water'

export type CounterKind = 'hydration_ml' | 'protein_g'

/**
 * What the one-tap parts of the panel do: a water tap, adding or removing an amount from a
 * counter sheet, a strength session. All of them show at once (the writes are optimistic).
 */
export function useQuickActions(patientId: string, closeSheet: () => void) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { toast } = useToast()
  const { save, writes } = useQuickSave(patientId)
  const fail = () => toast(t('common.error'), 'error')

  /** One tap on the water tile: the toast says where the day stands and takes the tap back. */
  function tapWater(totalMl: number, goalMl: number) {
    const amount = WATER_ADDS[0] ?? 250
    save(
      [{ kind: 'hydration_ml', value: amount, unit: 'ml' }],
      t('quick.water.added', {
        total: fmtVolume(totalMl + amount, locale),
        goal: fmtVolume(goalMl, locale),
      }),
      t('quick.counter.undoAmount', { amount: fmtVolume(amount, locale) }),
    )
  }

  /** From a counter sheet, which shows the list itself: no toast. */
  function addAmount(kind: CounterKind, amount: number) {
    void writes
      .addMany([{ kind, value: amount, unit: kind === 'hydration_ml' ? 'ml' : 'g' }])
      .then(({ saved }) => saved)
      .catch(fail)
  }

  function removeRow(row: MeasurementRow) {
    writes.remove(row).catch(fail)
  }

  function saveSession(minutes: number | null, daysBack: 0 | 1) {
    closeSheet()
    save(
      [
        {
          kind: 'resistance_session',
          value: minutes ?? 1,
          unit: minutes === null ? 'session' : 'min',
          ...(daysBack ? { measuredAt: subDays(new Date(), 1).toISOString() } : {}),
        },
      ],
      minutes === null ? t('quick.strength.saved') : t('quick.strength.savedMinutes', { minutes }),
    )
  }

  return { tapWater, addAmount, removeRow, saveSession }
}
