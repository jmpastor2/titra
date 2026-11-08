import { clsx } from 'clsx'
import { useState, type KeyboardEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { ageShort, type SiteStatus } from '@/domain/sites/rotation'
import { Segmented } from '@/components/ui/primitives'
import { C, MIN_WIDTH_PX, SPOTS, VIEWBOX, viewOf, type BodyView } from './bodyMapGeometry'
import { SiteDetail } from './SiteDetail'
import { HEAT, LEGEND } from './siteHeat'

type Pt = readonly [number, number]

const r = (v: number) => Math.round(v * 10) / 10

/** A closed curve through the points (Catmull-Rom as cubic Béziers), so the outline has no corners. */
function smooth(points: readonly Pt[]): string {
  const n = points.length
  const at = (i: number) => points[(i + n) % n]!
  let d = `M${at(0)[0]} ${at(0)[1]}`
  for (let i = 0; i < n; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)]
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6] as const
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6] as const
    d += ` C${r(c1[0])} ${r(c1[1])} ${r(c2[0])} ${r(c2[1])} ${p2[0]} ${p2[1]}`
  }
  return `${d} Z`
}

/** Left half of the body, as offsets from the centre line: neck to knee, then up the inner leg. */
const BODY_LEFT: readonly Pt[] = [
  [-6.5, 34],
  [-7, 44],
  [-13, 50],
  [-30, 54],
  [-42, 61],
  [-41, 75],
  [-37, 84],
  [-35, 100],
  [-33, 118],
  [-36, 134],
  [-40, 152],
  [-38, 176],
  [-35, 204],
  [-31, 236],
  [-28, 258],
  [-28, 290],
  [-7, 290],
  [-7, 258],
  [-6, 230],
  [-5, 200],
  [-2.5, 176],
]
/** The left arm, hanging slightly away from the body: down the outside, up the inside. */
const ARM_LEFT: readonly Pt[] = [
  [-42, 63],
  [-50, 67],
  [-55, 82],
  [-60, 110],
  [-63, 134],
  [-65, 160],
  [-66, 184],
  [-63, 204],
  [-55, 204],
  [-54, 184],
  [-52, 160],
  [-49, 134],
  [-45, 112],
  [-40, 94],
  [-37, 84],
]

const mirror = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [-x, y] as const)
const place = (pts: readonly Pt[]): Pt[] => pts.map(([x, y]) => [C + x, y] as const)

const BODY = smooth(place([...BODY_LEFT, [0, 172], ...mirror(BODY_LEFT).toReversed()]))
const ARMS = [smooth(place(ARM_LEFT)), smooth(place(mirror(ARM_LEFT)))]

/** The figure, front or back: one outline, the navel in front; spine, shoulder blades and glutes behind. */
function Figure({ back }: { back?: boolean }) {
  return (
    <g fill="var(--panel-2)" stroke="var(--line-strong)" strokeWidth={1.1} strokeLinejoin="round">
      {ARMS.map((d) => (
        <path key={d} d={d} />
      ))}
      <path d={BODY} />
      <ellipse cx={C} cy={21} rx={12.5} ry={15} />
      <g fill="none" stroke="var(--line)" strokeWidth={1} strokeLinecap="round">
        {back ? (
          <>
            <path d={`M${C} 52 V150`} />
            <path d={`M${C - 9} 66 Q${C - 21} 64 ${C - 26} 76 Q${C - 22} 88 ${C - 11} 86`} />
            <path d={`M${C + 9} 66 Q${C + 21} 64 ${C + 26} 76 Q${C + 22} 88 ${C + 11} 86`} />
            <path d={`M${C} 156 V186`} />
            <path d={`M${C - 33} 190 Q${C - 18} 197 ${C - 3} 190`} />
            <path d={`M${C + 33} 190 Q${C + 18} 197 ${C + 3} 190`} />
          </>
        ) : (
          <>
            <path d={`M${C - 6} 55 Q${C - 18} 52 ${C - 30} 57`} />
            <path d={`M${C + 6} 55 Q${C + 18} 52 ${C + 30} 57`} />
            <path d={`M${C - 28} 160 Q${C - 14} 168 ${C - 3} 174`} />
            <path d={`M${C + 28} 160 Q${C + 14} 168 ${C + 3} 174`} />
          </>
        )}
      </g>
      {!back && <circle cx={C} cy={118.5} r={1.8} fill="var(--line-strong)" stroke="none" />}
    </g>
  )
}

export interface BodyMapProps {
  /** Recency of each site (from `siteStatuses`); spots without a status read as never used. */
  statuses: readonly SiteStatus[]
  now: Date
  suggestedId?: string
  /** Points outside the person's rotation: drawn faint, still tappable. */
  inRotation?: ReadonlySet<string>
  className?: string
}

/**
 * Body map of the injection sites, one side of the body at a time, coloured by how recently
 * each was used. It opens on the side of the suggested point; a tap shows that point's last
 * use underneath.
 */
export function BodyMap({ statuses, now, suggestedId, inRotation, className }: BodyMapProps) {
  const { t } = useTranslation()
  const [view, setView] = useState<BodyView>(() => (suggestedId && viewOf(suggestedId)) || 'front')
  const [inspected, setInspected] = useState<string | undefined>(undefined)
  const byId = new Map(statuses.map((s) => [s.siteId, s]))
  const detail = inspected ? byId.get(inspected) : undefined
  const spots = SPOTS.filter((s) => s.view === view)

  function onKey(e: KeyboardEvent, id: string) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setInspected(id)
    }
  }

  return (
    <figure className={clsx('m-0', className)}>
      <Segmented<BodyView>
        value={view}
        onChange={(v) => {
          setView(v)
          setInspected(undefined)
        }}
        size="sm"
        options={[
          { value: 'front', label: t('sites.front') },
          { value: 'back', label: t('sites.back') },
        ]}
      />
      {/*
        The tap targets are 26 units of a 160-wide map: below 280 px they would shrink under
        44 px, so on a 320 px phone the map keeps its 280 and spills into the card's margin.
      */}
      <div className="mt-2 flex justify-center">
        <div className="w-full shrink-0" style={{ maxWidth: 320, minWidth: MIN_WIDTH_PX }}>
          <svg
            viewBox={VIEWBOX}
            className="block w-full select-none"
            role="group"
            aria-label={view === 'front' ? t('sites.front') : t('sites.back')}
          >
            <Figure back={view === 'back'} />
            <g
              fontSize={8}
              fontWeight={500}
              fill="var(--muted)"
              style={{ fontFamily: 'var(--font-sans)' }}
            >
              <text x={C - 52} y={252} textAnchor="middle">
                {t('sites.leftShort')}
              </text>
              <text x={C + 52} y={252} textAnchor="middle">
                {t('sites.rightShort')}
              </text>
            </g>

            {spots.map((s) => {
              const status = byId.get(s.id)
              const heat = status?.heat ?? 'never'
              const colors = HEAT[heat]
              const suggested = s.id === suggestedId
              const focused = s.id === inspected
              const off = inRotation !== undefined && !inRotation.has(s.id)
              return (
                <g
                  key={s.id}
                  role="button"
                  aria-pressed={focused}
                  aria-label={t(`sites.labels.${s.id}`)}
                  tabIndex={0}
                  onClick={() => setInspected(s.id)}
                  onKeyDown={(e) => onKey(e, s.id)}
                  className="group cursor-pointer outline-none"
                  opacity={off && !focused ? 0.4 : 1}
                >
                  <rect
                    x={s.hit.x}
                    y={s.hit.y}
                    width={s.hit.w}
                    height={s.hit.h}
                    fill="transparent"
                  />
                  <circle
                    cx={s.cx}
                    cy={s.cy}
                    r={12.5}
                    fill="none"
                    stroke="var(--signal)"
                    strokeWidth={1.5}
                    className="opacity-0 group-focus-visible:opacity-100"
                  />
                  {suggested && (
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={10.5}
                      fill="none"
                      stroke="var(--signal)"
                      strokeWidth={1.4}
                      strokeDasharray="2.5 2"
                    />
                  )}
                  {focused && (
                    <circle
                      cx={s.cx}
                      cy={s.cy}
                      r={suggested ? 8.5 : 9}
                      fill="none"
                      stroke="var(--ink)"
                      strokeWidth={1.6}
                    />
                  )}
                  <circle
                    cx={s.cx}
                    cy={s.cy}
                    r={6.5}
                    style={{ fill: colors.fill }}
                    stroke={heat === 'never' ? 'var(--line-strong)' : 'none'}
                    strokeWidth={1}
                    className="transition-[fill] duration-300 group-active:opacity-75"
                  />
                  <text
                    x={s.cx}
                    y={s.cy + 2}
                    textAnchor="middle"
                    fontSize={5.6}
                    fontWeight={700}
                    fill={colors.ink}
                    style={{ fontFamily: 'var(--font-num)' }}
                    aria-hidden
                    className="pointer-events-none"
                  >
                    {ageShort(status?.hoursSince ?? null)}
                  </text>
                </g>
              )
            })}
          </svg>
        </div>
      </div>

      <figcaption className="mt-3 space-y-3">
        <ul className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[11.5px] text-muted">
          {LEGEND.map((h) => (
            <li key={h} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden
                className={clsx(
                  'inline-block size-2.5 rounded-full',
                  h === 'never' && 'border border-line-strong',
                )}
                style={{ background: HEAT[h].fill }}
              />
              {t(`sites.heat.${h}`)}
            </li>
          ))}
        </ul>
        <div aria-live="polite" className="min-h-[52px] border-t border-line pt-3">
          {detail ? (
            <SiteDetail status={detail} now={now} />
          ) : (
            <p className="text-[12.5px] text-muted">{t('sites.tapHint')}</p>
          )}
        </div>
      </figcaption>
    </figure>
  )
}
