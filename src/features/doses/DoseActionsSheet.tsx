import { CalendarCheck, Pencil, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Sheet'
import { fmtDateTime } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { ActionList, type ActionItem } from './ActionList'
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
  const items: ActionItem[] = [
    {
      key: 'edit',
      icon: Pencil,
      title: t('editDose.actions.edit'),
      hint: t('editDose.actions.editHint'),
      onClick: act(onEdit),
    },
    ...(canAssign
      ? [
          {
            key: 'assign',
            icon: CalendarCheck,
            title: t('editDose.actions.assign'),
            hint: t('editDose.actions.assignHint'),
            onClick: act(onAssign),
          },
        ]
      : []),
    {
      key: 'delete',
      icon: Trash2,
      title: t('editDose.actions.delete'),
      hint: t('editDose.actions.deleteHint'),
      tone: 'danger',
      onClick: act(onDelete),
    },
  ]
  return (
    <Sheet
      open
      onClose={onClose}
      title={substanceLine(administration)}
      description={fmtDateTime(administration.at, locale)}
    >
      <div className="pb-2">
        <ActionList items={items} />
      </div>
    </Sheet>
  )
}
