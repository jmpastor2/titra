import { CalendarCheck, Pencil, Trash2, type LucideIcon } from 'lucide-react'
import { clsx } from 'clsx'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Sheet'
import { fmtDateTime } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { substanceLine, type Administration } from './administrations'

export interface DoseActionsSheetProps {
  open: boolean
  onClose: () => void
  administration: Administration | null
  /** An extra with missed administrations it could make up. */
  canAssign: boolean
  onEdit: (administration: Administration) => void
  onAssign: (administration: Administration) => void
  onDelete: (administration: Administration) => void
}

/** What can be done with a logged dose: edit it, make it cover a missed one, delete it. */
export function DoseActionsSheet({
  open,
  onClose,
  administration,
  canAssign,
  onEdit,
  onAssign,
  onDelete,
}: DoseActionsSheetProps) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  if (!open || !administration) return null

  const act = (run: (a: Administration) => void) => () => run(administration)
  return (
    <Sheet
      open
      onClose={onClose}
      title={substanceLine(administration)}
      description={fmtDateTime(administration.at, locale)}
    >
      <ul className="flex flex-col gap-2 pb-1 pt-2">
        <Action
          icon={Pencil}
          label={t('editDose.actions.edit')}
          hint={t('editDose.actions.editHint')}
          onClick={act(onEdit)}
        />
        {canAssign && (
          <Action
            icon={CalendarCheck}
            label={t('editDose.actions.assign')}
            hint={t('editDose.actions.assignHint')}
            onClick={act(onAssign)}
          />
        )}
        <Action
          icon={Trash2}
          label={t('editDose.actions.delete')}
          hint={t('editDose.actions.deleteHint')}
          danger
          onClick={act(onDelete)}
        />
      </ul>
    </Sheet>
  )
}

function Action({
  icon: Icon,
  label,
  hint,
  danger = false,
  onClick,
}: {
  icon: LucideIcon
  label: string
  hint: string
  danger?: boolean
  onClick: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onClick}
        className={clsx(
          'flex min-h-[60px] w-full items-center gap-3.5 rounded-[18px] border px-4 py-2.5 text-left transition active:scale-[0.99]',
          danger
            ? 'border-danger/25 bg-danger-soft text-danger'
            : 'border-line bg-panel-2 text-ink active:border-signal/40',
        )}
      >
        <span
          className={clsx(
            'grid size-10 shrink-0 place-items-center rounded-full border',
            danger ? 'border-danger/30' : 'border-signal/25 bg-signal-soft text-signal',
          )}
        >
          <Icon className="size-[18px]" aria-hidden />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-[15px] font-semibold">{label}</span>
          <span className={clsx('block text-[12.5px]', danger ? 'text-danger/80' : 'text-muted')}>
            {hint}
          </span>
        </span>
      </button>
    </li>
  )
}
