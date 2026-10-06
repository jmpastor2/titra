import type { ReactNode } from 'react'
import { Meter } from '@/components/kpi/Meter'
import { Spark } from '@/components/kpi/Spark'
import { SubstanceDot } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { QuickTile, Readout, Word } from './QuickTile'
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
      trail={
        visual?.kind === 'spark' ? (
          <div className="w-[46px]">
            <Spark values={visual.values} height={26} area={false} />
          </div>
        ) : undefined
      }
      foot={
        visual?.kind === 'gauge' ? (
          <Meter value={visual.fraction} height={4} />
        ) : visual?.kind === 'bar' ? (
          <Meter value={visual.fraction} height={4} color="var(--warn)" />
        ) : undefined
      }
    />
  )
}
