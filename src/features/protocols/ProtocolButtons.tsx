import { Ellipsis, Pencil, Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import type { ProtocolActions } from './useProtocolActions'

/**
 * Edit and "⋯" along the foot of a card: quiet, both visible, both 44 px. A protocol that is
 * not running gets its way back in sight too.
 */
export function CardActions({ actions: a }: { actions: ProtocolActions }) {
  const { t } = useTranslation()
  const status = a.protocol.status
  return (
    <div className="flex items-center gap-2 border-t border-line px-3 py-2.5">
      <Button
        size="sm"
        variant="secondary"
        leading={<Pencil className="size-4" />}
        onClick={a.edit}
      >
        {t('common.edit')}
      </Button>
      {status !== 'active' && (
        <Button
          size="sm"
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
        className="grid size-11 place-items-center rounded-full text-ink-2 transition hover:bg-panel-2 active:scale-95"
      >
        <Ellipsis className="size-5" />
      </button>
    </div>
  )
}

/**
 * The actions of the protocol page: edit (the one ink button) and "⋯", which holds every
 * other change (keep a week, move up, dose, pause, duplicate, archive). A protocol that is
 * not running gets its way back in sight.
 */
export function DetailActions({ actions: a }: { actions: ProtocolActions }) {
  const { t } = useTranslation()
  const status = a.protocol.status
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Button
          size="lg"
          className="flex-1"
          leading={<Pencil className="size-5" />}
          onClick={a.edit}
        >
          {t('protocolDetail.edit')}
        </Button>
        <button
          type="button"
          aria-label={t('protocolDetail.moreActions')}
          onClick={() => a.open('menu')}
          className="grid size-14 shrink-0 place-items-center rounded-full border border-line bg-panel text-ink-2 transition active:scale-95"
        >
          <Ellipsis className="size-5" />
        </button>
      </div>
      {status !== 'active' && (
        <Button
          variant="secondary"
          leading={<Play className="size-4" />}
          onClick={() => void a.togglePause()}
        >
          {status === 'paused' ? t('protocolMenu.resume') : t('protocolMenu.restore')}
        </Button>
      )}
    </div>
  )
}
