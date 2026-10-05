import { clsx } from 'clsx'
import {
  Archive,
  CalendarPlus,
  Copy,
  Ellipsis,
  Pause,
  Pencil,
  Play,
  type LucideIcon,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import type { ProtocolActions } from './useProtocolActions'

/**
 * Edit and "⋯" along the foot of a card: both visible, both 44 px. A protocol that is not
 * running gets its way back in sight too.
 */
export function CardActions({ actions: a }: { actions: ProtocolActions }) {
  const { t } = useTranslation()
  const status = a.protocol.status
  return (
    <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
      <Button size="md" variant="soft" leading={<Pencil className="size-4" />} onClick={a.edit}>
        {t('common.edit')}
      </Button>
      {status !== 'active' && (
        <Button
          size="md"
          variant="secondary"
          leading={<Play className="size-4" />}
          onClick={() => void a.togglePause()}
        >
          {status === 'paused' ? t('protocolMenu.resume') : t('protocolMenu.restore')}
        </Button>
      )}
      <span className="flex-1" />
      <button
        type="button"
        aria-label={t('protocolMenu.more')}
        onClick={() => a.open('menu')}
        className="grid size-11 place-items-center rounded-full border border-line-strong bg-panel-2 text-ink-2 transition active:scale-95"
      >
        <Ellipsis className="size-5" />
      </button>
    </div>
  )
}

function Tile({
  icon: Icon,
  label,
  tone,
  onClick,
}: {
  icon: LucideIcon
  label: string
  tone?: 'danger'
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={clsx(
        'flex min-h-[76px] flex-col items-start justify-between gap-2 rounded-control border p-3 text-left transition active:scale-[0.98]',
        tone === 'danger'
          ? 'border-danger/30 bg-danger-soft text-danger'
          : 'border-line-strong bg-panel-2 text-ink',
      )}
    >
      <Icon className={clsx('size-5', tone !== 'danger' && 'text-signal')} />
      <span className="text-[14px] font-semibold leading-tight">{label}</span>
    </button>
  )
}

/** The big actions of the protocol page. Everything else is under "Más acciones". */
export function DetailActions({ actions: a }: { actions: ProtocolActions }) {
  const { t } = useTranslation()
  const status = a.protocol.status
  const rest = Boolean(a.summary?.info.step?.pause)
  // With a decision due, the card above already offers "keep one more week": not twice.
  const asked = Boolean(a.summary?.info.decisionDue && a.summary.next)
  const showHold = a.hold && !asked
  // Two or four tiles sit in pairs; three share one row.
  const tiles = [showHold, true, true, status !== 'archived'].filter(Boolean).length
  return (
    <div className="flex flex-col gap-2.5">
      <Button size="lg" block leading={<Pencil className="size-5" />} onClick={a.edit}>
        {t('protocolDetail.edit')}
      </Button>
      <div className={clsx('grid gap-2.5', tiles === 3 ? 'grid-cols-3' : 'grid-cols-2')}>
        {showHold && (
          <Tile
            icon={CalendarPlus}
            label={rest ? t('protocolMenu.holdRest') : t('protocolMenu.hold')}
            onClick={() => a.open('hold')}
          />
        )}
        <Tile
          icon={status === 'active' ? Pause : Play}
          label={
            status === 'active'
              ? t('protocols.pause')
              : status === 'paused'
                ? t('protocolMenu.resume')
                : t('protocolMenu.restore')
          }
          onClick={() => void a.togglePause()}
        />
        <Tile icon={Copy} label={t('protocolMenu.duplicate')} onClick={a.duplicate} />
        {status !== 'archived' && (
          <Tile
            icon={Archive}
            label={t('protocols.archive')}
            tone="danger"
            onClick={() => a.open('archive')}
          />
        )}
      </div>
      <Button
        size="md"
        block
        variant="ghost"
        leading={<Ellipsis className="size-5" />}
        onClick={() => a.open('menu')}
      >
        {t('protocolDetail.moreActions')}
      </Button>
    </div>
  )
}
