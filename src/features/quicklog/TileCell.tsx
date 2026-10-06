import type { ReactNode } from 'react'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { Sparkline } from '@/features/health/Spark'
import { MiniBar, MiniRing, QuickTile, Readout, Word } from './QuickTile'
import type { TileView } from './tileViews'

/** One tile of the grid, dressed from its view: the reading, its caption and its visual. */
export function TileCell({
  view,
  onPress,
  corner,
}: {
  view: TileView
  onPress: () => void
  /** A second control in the top-right corner (the water options). */
  corner?: ReactNode
}) {
  const { visual } = view
  const RingIcon = visual?.kind === 'ring' ? visual.icon : null
  // The substances of a dose lead its caption, as on the agenda.
  const caption =
    visual?.kind === 'substances' ? (
      <span className="inline-flex items-center gap-1.5">
        {[...new Set(visual.compoundIds.map(compoundColor))].slice(0, 3).map((color) => (
          <SubstanceDot key={color} color={color} size={7} />
        ))}
        {view.caption}
      </span>
    ) : (
      view.caption
    )
  return (
    <QuickTile
      icon={view.icon}
      label={view.label}
      value={
        view.value.word ? (
          <Word>{view.value.text}</Word>
        ) : (
          <Readout value={view.value.text} unit={view.value.unit} />
        )
      }
      caption={caption}
      tone={view.tone}
      dot={view.dot}
      ariaLabel={view.aria}
      onPress={onPress}
      corner={corner}
      lead={
        visual?.kind === 'ring' && RingIcon ? (
          <MiniRing fraction={visual.fraction} done={visual.done}>
            <RingIcon className="size-4 text-muted" aria-hidden />
          </MiniRing>
        ) : undefined
      }
      trail={
        visual?.kind === 'spark' ? (
          <Sparkline values={visual.values} height={26} className="w-[46px] shrink-0" />
        ) : undefined
      }
      foot={visual?.kind === 'bar' ? <MiniBar fraction={visual.fraction} /> : undefined}
    />
  )
}
