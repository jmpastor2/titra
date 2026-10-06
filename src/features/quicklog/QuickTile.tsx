import { clsx } from 'clsx'
import { Check, Ellipsis, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { ProgressRing } from '@/components/ui/primitives'
import type { TileTone } from './tiles'

const TONE: Record<TileTone, string> = {
  idle: 'border-line bg-panel',
  // What asks for a look is told by the amber mark beside its label, not by a second outline.
  attention: 'border-line bg-panel',
  // The one pulse of the panel: only what needs the person right now.
  urgent: 'pulse-ring border-warn/55 bg-warn-soft',
  done: 'border-signal/25 bg-signal-soft',
}

export interface QuickTileProps {
  icon: LucideIcon
  /** Silkscreen label; shown in capitals. */
  label: string
  /** The reading: a number, a word, a time. Style it with <Readout> or <Word>. */
  value: ReactNode
  caption?: ReactNode
  tone?: TileTone
  /** A ring on the left of the text. */
  lead?: ReactNode
  /** A small visual at the right of the reading (a sparkline). */
  trail?: ReactNode
  /** A small visual at the right of the caption (a bar for a wait). */
  foot?: ReactNode
  /** The tile read out as one sentence. */
  ariaLabel: string
  onPress: () => void
  /** A second control in the top-right corner: see <TileAction>. */
  corner?: ReactNode
  /** A small mark next to the label: something here wants attention. */
  dot?: boolean
}

/**
 * One cell of the Registro rápido. The whole tile is a button laid under its content, so a
 * second control (the water options) can sit on top without nesting buttons. A fixed height
 * keeps the grid from jumping as values change.
 */
export function QuickTile({
  icon: Icon,
  label,
  value,
  caption,
  tone = 'idle',
  lead,
  trail,
  foot,
  ariaLabel,
  onPress,
  corner,
  dot,
}: QuickTileProps) {
  const line = (caption || foot) && (
    <div className="mt-1.5 flex items-end justify-between gap-2">
      <div aria-hidden className="min-w-0 break-words text-[12px] leading-tight text-muted">
        {caption}
      </div>
      {foot}
    </div>
  )
  return (
    <div
      className={clsx(
        // isolate: the layers inside never climb over anything else on the page.
        'relative isolate min-h-[96px] min-w-0 overflow-hidden rounded-control border transition-colors',
        TONE[tone],
      )}
    >
      <button
        type="button"
        aria-label={ariaLabel}
        onClick={onPress}
        className="absolute inset-0 z-0 rounded-[inherit] outline-none transition-colors focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/60 active:bg-ink/5"
      />
      <div className="pointer-events-none relative z-10 flex h-full min-h-[96px] flex-col justify-between gap-2 px-3 pb-3 pt-2.5">
        <div aria-hidden className={clsx('flex items-center gap-1.5', corner && 'pr-10')}>
          <Icon className="size-3.5 shrink-0 text-muted" />
          <span className="spec">{label}</span>
          {dot && <span className="size-1.5 shrink-0 rounded-full bg-warn" />}
          {tone === 'done' && <Check className="size-3.5 shrink-0 text-signal" strokeWidth={3} />}
        </div>
        {lead ? (
          // A ring on the left, the reading and its caption beside it.
          <div className="flex items-end gap-2.5">
            {lead}
            <div className="min-w-0 flex-1">
              <div aria-hidden className="break-words">
                {value}
              </div>
              {line}
            </div>
          </div>
        ) : (
          // The reading and its caption, each with room for a small visual at its right.
          <div className="min-w-0">
            <div className="flex items-end justify-between gap-2">
              <div aria-hidden className="min-w-0 break-words">
                {value}
              </div>
              {/* A small chart only where the tile is wide enough to give the reading its room. */}
              {trail && <div className="hidden shrink-0 @min-[330px]:block">{trail}</div>}
            </div>
            {line}
          </div>
        )}
      </div>
      {corner}
    </div>
  )
}

/** The last cell of the grid: what does not fit waits behind it, so it stays quiet. */
export function MoreTile({
  label,
  hint,
  dot,
  ariaLabel,
  onPress,
}: {
  label: string
  hint: string
  /** Something behind it wants attention. */
  dot?: boolean
  ariaLabel: string
  onPress: () => void
}) {
  return (
    <button
      type="button"
      aria-label={ariaLabel}
      onClick={onPress}
      className="relative flex min-h-[96px] min-w-0 flex-col items-center justify-center gap-1 rounded-control border border-dashed border-line-strong px-3 py-2.5 text-center outline-none transition-colors focus-visible:ring-2 focus-visible:ring-signal/60 active:bg-ink/5"
    >
      <Ellipsis aria-hidden className="size-5 text-muted" />
      <span aria-hidden className="text-[13.5px] font-semibold leading-tight text-ink-2">
        {label}
      </span>
      <span aria-hidden className="text-[11.5px] leading-tight text-muted">
        {hint}
      </span>
      {dot && <span aria-hidden className="absolute right-3 top-3 size-1.5 rounded-full bg-warn" />}
    </button>
  )
}

/** A number in the instrument face, with its unit small beside it. */
export function Readout({
  value,
  unit,
  className,
}: {
  value: ReactNode
  unit?: ReactNode
  className?: string
}) {
  return (
    <span
      className={clsx(
        'readout whitespace-nowrap text-[20px] font-semibold leading-none',
        className,
      )}
    >
      {value}
      {unit && <span className="ml-1 text-[11.5px] font-medium text-muted">{unit}</span>}
    </span>
  )
}

/** A word as the reading ("Toca ahora", "Hecho"). */
export function Word({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span className={clsx('font-display text-[17px] font-semibold leading-none', className)}>
      {children}
    </span>
  )
}

/** The tile's second control, in its top-right corner, with a 44 px target. */
export function TileAction({
  icon: Icon,
  label,
  onPress,
}: {
  icon: LucideIcon
  label: string
  onPress: () => void
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onPress}
      className="absolute right-0 top-0 z-20 grid size-11 place-items-center rounded-full text-muted outline-none transition-colors hover:text-ink focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-signal/60 active:bg-ink/5"
    >
      <Icon className="size-4" />
    </button>
  )
}

/** A compact gauge for tiles that count towards a goal. */
export function MiniRing({
  fraction,
  done,
  children,
}: {
  fraction: number
  done?: boolean
  children?: ReactNode
}) {
  return (
    <ProgressRing
      fraction={fraction}
      size={44}
      stroke={5}
      ticks={false}
      color={done ? 'var(--ok)' : 'var(--signal)'}
    >
      {children}
    </ProgressRing>
  )
}

/** A thin gauge for a wait that is running (the fast before a dose). */
export function MiniBar({ fraction }: { fraction: number }) {
  return (
    <div aria-hidden className="mb-px h-1 w-8 shrink-0 overflow-hidden rounded-full bg-line-strong">
      <div
        className="h-full rounded-full bg-warn"
        style={{ width: `${Math.round(Math.min(1, Math.max(0, fraction)) * 100)}%` }}
      />
    </div>
  )
}
