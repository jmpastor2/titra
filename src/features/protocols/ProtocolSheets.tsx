import {
  Archive,
  Bookmark,
  CalendarPlus,
  ChevronRight,
  Copy,
  Pause,
  Pencil,
  Play,
  Syringe,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Sheet } from '@/components/ui/Sheet'
import { compoundById } from '@/content/compounds'
import { activeVial, concentrationFor } from '@/features/inventory/vials'
import { ChangeHeadline, ChangeRows } from './ChangeRows'
import { ConfirmSheet } from './ConfirmSheet'
import { DoseInput, EntryNote, EntryToggle } from './DoseField'
import {
  convertText,
  defaultEntry,
  entryToMg,
  formatAmount,
  mgToEntry,
  parseAmount,
  type DoseEntry,
} from './doseUnits'
import { changeRows } from './stepChange'
import { useCycleText } from './cycleText'
import type { ProtocolActions } from './useProtocolActions'

interface MenuItem {
  key: string
  icon: LucideIcon
  title: string
  hint?: string
  tone?: 'danger'
  run: () => void
}

/**
 * Everything a protocol's "⋯" opens: the action list and the sheets behind it, each one
 * showing before and after before anything moves.
 */
export function ProtocolSheets({ actions: a }: { actions: ProtocolActions }) {
  const { t } = useTranslation()
  const text = useCycleText()
  const rest = Boolean(a.summary?.info.step?.pause)
  const status = a.protocol.status

  const nextMoves = (rows: ReturnType<typeof changeRows>) => {
    const next = rows.find((r) => r.kind === 'next')
    return next?.kind === 'next'
      ? t('protocolMenu.nextMoves', { from: text.day(next.before), to: text.day(next.after) })
      : undefined
  }

  const items: MenuItem[] = [
    {
      key: 'edit',
      icon: Pencil,
      title: t('protocolMenu.edit'),
      hint: t('protocolMenu.editHint'),
      run: a.edit,
    },
    ...(a.hold
      ? [
          {
            key: 'hold',
            icon: CalendarPlus,
            title: rest ? t('protocolMenu.holdRest') : t('protocolMenu.hold'),
            hint: nextMoves(changeRows(a.hold.summary)),
            run: () => a.open('hold'),
          },
        ]
      : []),
    ...(a.moveUp
      ? [
          {
            key: 'moveUp',
            icon: TrendingUp,
            title: rest ? t('protocolMenu.moveUpRest') : t('protocolMenu.moveUp'),
            hint: nextMoves(changeRows(a.moveUp.summary)),
            run: () => a.open('moveUp'),
          },
        ]
      : []),
    ...(a.doseStep
      ? [
          {
            key: 'dose',
            icon: Syringe,
            title: t('protocolMenu.setDose'),
            hint: t('protocolMenu.setDoseHint', { dose: a.doseText(a.doseStep.doseMg) }),
            run: () => a.open('dose'),
          },
        ]
      : []),
    {
      key: 'pause',
      icon: status === 'active' ? Pause : Play,
      title:
        status === 'active'
          ? t('protocols.pause')
          : status === 'paused'
            ? t('protocolMenu.resume')
            : t('protocolMenu.restore'),
      hint:
        status === 'active'
          ? t('protocolMenu.pauseHint')
          : status === 'paused'
            ? t('protocolMenu.resumeHint')
            : t('protocolMenu.restoreHint'),
      run: () => void a.togglePause(),
    },
    {
      key: 'duplicate',
      icon: Copy,
      title: t('protocolMenu.duplicate'),
      hint: t('protocolMenu.duplicateHint'),
      run: a.duplicate,
    },
    {
      key: 'save',
      icon: Bookmark,
      title: t('protocols.saveAsTemplate'),
      hint: t('protocolMenu.saveHint'),
      run: () => void a.saveAsReusable(),
    },
    ...(status !== 'archived'
      ? [
          {
            key: 'archive',
            icon: Archive,
            title: t('protocols.archive'),
            hint: t('protocolMenu.archiveHint'),
            tone: 'danger' as const,
            run: () => a.open('archive'),
          },
        ]
      : []),
  ]

  const holdRows = a.hold ? changeRows(a.hold.summary) : []
  const moveUpRows = a.moveUp ? changeRows(a.moveUp.summary) : []

  return (
    <>
      {a.sheet === 'menu' && (
        <Sheet
          open
          onClose={a.close}
          title={a.protocol.name}
          description={a.summary ? text.phase(a.summary) : undefined}
        >
          <ul className="flex flex-col py-1">
            {items.map(({ key, icon: Icon, title, hint, tone, run }) => (
              <li key={key}>
                <button
                  type="button"
                  onClick={run}
                  className="flex min-h-[56px] w-full items-center gap-3 rounded-control px-1 py-2 text-left transition active:bg-panel-2"
                >
                  <span
                    className={
                      tone === 'danger'
                        ? 'grid size-10 shrink-0 place-items-center rounded-full bg-danger-soft text-danger'
                        : 'grid size-10 shrink-0 place-items-center rounded-full bg-panel-2 text-ink-2'
                    }
                  >
                    <Icon className="size-[18px]" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span
                      className={
                        tone === 'danger'
                          ? 'block text-[15px] font-semibold text-danger'
                          : 'block text-[15px] font-semibold'
                      }
                    >
                      {title}
                    </span>
                    {hint && (
                      <span className="block text-[12.5px] leading-snug text-muted">{hint}</span>
                    )}
                  </span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ul>
        </Sheet>
      )}

      {a.sheet === 'hold' && a.hold && (
        <ConfirmSheet
          title={rest ? t('protocolMenu.holdRest') : t('protocolMenu.hold')}
          description={a.protocol.name}
          confirmLabel={rest ? t('protocolMenu.holdRestConfirm') : t('protocolMenu.holdConfirm')}
          busy={a.busy}
          onConfirm={() => void a.holdWeek()}
          onClose={a.close}
        >
          <ChangeHeadline rows={holdRows} />
          <ChangeRows rows={holdRows} doseText={a.doseText} />
          <p className="text-[13px] leading-snug text-muted">{t('protocolMenu.holdNote')}</p>
        </ConfirmSheet>
      )}

      {a.sheet === 'moveUp' && a.moveUp && (
        <ConfirmSheet
          title={rest ? t('protocolMenu.moveUpRest') : t('protocolMenu.moveUp')}
          description={a.protocol.name}
          confirmLabel={rest ? t('protocolMenu.moveUpRest') : t('protocolMenu.moveUp')}
          busy={a.busy}
          onConfirm={() => void a.moveUpWeek()}
          onClose={a.close}
        >
          <ChangeHeadline rows={moveUpRows} />
          <ChangeRows rows={moveUpRows} doseText={a.doseText} />
          {moveUpRows.some((r) => r.kind === 'dose') && (
            <p className="rounded-control border border-warn/30 bg-warn-soft px-3 py-2 text-[12.5px] leading-snug text-ink-2">
              {t('protocolMenu.moveUpStartsNow')}
            </p>
          )}
          <p className="text-[13px] leading-snug text-muted">{t('protocolMenu.moveUpNote')}</p>
        </ConfirmSheet>
      )}

      {a.sheet === 'dose' && a.doseStep && <DoseSheet actions={a} />}

      {a.sheet === 'archive' && (
        <ConfirmSheet
          title={t('protocolMenu.archiveTitle', { name: a.protocol.name })}
          confirmLabel={t('protocols.archive')}
          tone="danger"
          busy={a.busy}
          onConfirm={() => void a.archive()}
          onClose={a.close}
        >
          <p className="text-[14px] leading-snug text-ink-2">{t('protocolMenu.archiveBody')}</p>
        </ConfirmSheet>
      )}
    </>
  )
}

/** Change the dose of the step in force: typed in U, mg or mcg, from this week on. */
function DoseSheet({ actions: a }: { actions: ProtocolActions }) {
  const { t } = useTranslation()
  const step = a.doseStep
  const compoundId = a.protocol.compound_id
  const native = compoundById(compoundId)?.defaultUnit ?? 'mg'
  const vial = useMemo(() => activeVial(a.vials, compoundId), [a.vials, compoundId])
  const conc = vial ? concentrationFor(vial, compoundId) : null

  const startEntry = defaultEntry(native, conc)
  const [entry, setEntry] = useState<DoseEntry>(startEntry)
  const [text, setText] = useState(() =>
    step ? formatAmount(mgToEntry(step.doseMg, startEntry, conc) ?? step.doseMg, startEntry) : '',
  )

  const mg = entryToMg(parseAmount(text), entry, conc)
  const pending = mg === null ? null : a.preview({ kind: 'setDose', doseMg: mg })
  const rows = pending ? changeRows(pending.summary) : []
  if (!step || !a.summary) return null

  const behind = a.summary.info.weekInStep - 1
  const next = a.pl.steps[step.index + 1]
  const nextBelow = mg !== null && next && !next.pause && mg > next.doseMg + 1e-9 ? next : null

  function choose(to: DoseEntry) {
    setText(convertText(text, entry, to, conc))
    setEntry(to)
  }

  return (
    <ConfirmSheet
      title={t('protocolMenu.setDose')}
      description={`${a.protocol.name} · ${t('protocolMenu.doseStepOf', { n: step.index + 1, week: a.summary.info.weekInStep })}`}
      confirmLabel={t('protocolMenu.doseConfirm')}
      busy={a.busy}
      onConfirm={() => {
        if (mg !== null && pending) void a.changeDose(mg)
      }}
      onClose={a.close}
    >
      <div className="flex flex-col gap-2">
        <EntryToggle entry={entry} native={native} conc={conc} onChange={choose} />
        <DoseInput
          autoFocus
          ariaLabel={t('protocolMenu.doseNew')}
          value={text}
          entry={entry}
          native={native}
          conc={conc}
          mg={mg}
          onChange={setText}
          className="readout bg-panel-2 text-[22px] font-semibold"
        />
        <EntryNote
          native={native}
          conc={conc}
          vialLabel={vial?.label}
          name={compoundById(compoundId)?.names.generic ?? compoundId}
        />
      </div>
      {mg !== null && !pending && (
        <p className="text-[13px] text-muted">{t('protocolMenu.doseSame')}</p>
      )}
      <ChangeRows rows={rows} doseText={a.doseText} />
      {pending && (
        <p className="text-[13px] leading-snug text-muted">
          {behind > 0
            ? t('protocolMenu.doseFromWeek', { count: behind, dose: a.doseText(step.doseMg) })
            : t('protocolMenu.doseWholeStep')}
        </p>
      )}
      {nextBelow && (
        <p className="rounded-control border border-warn/30 bg-warn-soft px-3 py-2 text-[12.5px] leading-snug text-ink-2">
          {t('protocolMenu.doseBelowNext', { dose: a.doseText(nextBelow.doseMg) })}
        </p>
      )}
    </ConfirmSheet>
  )
}
