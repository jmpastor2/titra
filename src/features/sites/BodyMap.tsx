import { useTranslation } from 'react-i18next'

interface Spot {
  id: string
  cx: number
  cy: number
}

/** Centre lines of the two figures in the 300 × 300 viewBox. */
const FRONT = 78
const BACK = 222

/*
 * Drawn as you see yourself: your left on the left in both views. Front shows the
 * abdomen and thighs; back shows the back of the upper arms and the glutes.
 */
const SPOTS: Spot[] = [
  { id: 'abd_ul', cx: FRONT - 13, cy: 104 },
  { id: 'abd_ur', cx: FRONT + 13, cy: 104 },
  { id: 'abd_ll', cx: FRONT - 13, cy: 133 },
  { id: 'abd_lr', cx: FRONT + 13, cy: 133 },
  { id: 'thigh_l', cx: FRONT - 15, cy: 200 },
  { id: 'thigh_r', cx: FRONT + 15, cy: 200 },
  { id: 'arm_l', cx: BACK - 41.5, cy: 88 },
  { id: 'arm_r', cx: BACK + 41.5, cy: 88 },
  { id: 'glute_l', cx: BACK - 14, cy: 166 },
  { id: 'glute_r', cx: BACK + 14, cy: 166 },
]

function Figure({ cx, back }: { cx: number; back?: boolean }) {
  return (
    <g fill="var(--panel-2)" stroke="var(--line-strong)" strokeWidth={1.2}>
      <circle cx={cx} cy={27} r={15} />
      <rect x={cx - 6} y={40} width={12} height={12} rx={3} />
      {/* arms, behind the torso */}
      <rect x={cx - 48} y={58} width={13} height={94} rx={6.5} />
      <rect x={cx + 35} y={58} width={13} height={94} rx={6.5} />
      {/* legs */}
      <rect x={cx - 27} y={150} width={24} height={136} rx={11} />
      <rect x={cx + 3} y={150} width={24} height={136} rx={11} />
      {/* torso: shoulders, waist, hips */}
      <path
        d={`M${cx - 28} 52 Q${cx - 35} 52 ${cx - 35} 61 L${cx - 24} 128 Q${cx - 30} 146 ${cx - 28} 166 L${cx + 28} 166 Q${cx + 30} 146 ${cx + 24} 128 L${cx + 35} 61 Q${cx + 35} 52 ${cx + 28} 52 Z`}
      />
      {back ? (
        // spine and the line between the glutes
        <g fill="none" stroke="var(--line)" strokeWidth={1}>
          <path d={`M${cx} 56 V148`} />
          <path d={`M${cx} 152 V178`} />
        </g>
      ) : (
        <circle cx={cx} cy={118.5} r={1.8} fill="var(--line-strong)" stroke="none" />
      )}
    </g>
  )
}

export function BodyMap({
  usage,
  maxUse,
  suggestedId,
}: {
  usage: Record<string, number>
  maxUse: number
  suggestedId?: string
}) {
  const { t } = useTranslation()
  return (
    <figure className="m-0">
      <svg
        viewBox="0 0 300 312"
        className="mx-auto block w-full max-w-[360px]"
        role="img"
        aria-label={t('sites.title')}
      >
        <Figure cx={FRONT} />
        <Figure cx={BACK} back />

        {[FRONT, BACK].map((cx) => (
          <g key={cx} className="spec" fontSize={8.5} fill="var(--muted)" letterSpacing="0.12em">
            <text x={cx - 44} y={300} textAnchor="middle">
              {t('sites.leftShort')}
            </text>
            <text x={cx} y={300} textAnchor="middle" fill="var(--ink-2)" fontWeight={700}>
              {cx === FRONT ? t('sites.front') : t('sites.back')}
            </text>
            <text x={cx + 44} y={300} textAnchor="middle">
              {t('sites.rightShort')}
            </text>
          </g>
        ))}

        {SPOTS.map((s) => {
          const count = usage[s.id] ?? 0
          const intensity = count / maxUse
          const suggested = s.id === suggestedId
          return (
            <g key={s.id}>
              <title>{t(`sites.labels.${s.id}`)}</title>
              {suggested && (
                <circle
                  cx={s.cx}
                  cy={s.cy}
                  r={11.5}
                  fill="none"
                  stroke="var(--signal)"
                  strokeWidth={1.8}
                  strokeDasharray="3 2.5"
                />
              )}
              <circle
                cx={s.cx}
                cy={s.cy}
                r={8}
                fill={count === 0 ? 'var(--panel)' : 'var(--chart-3)'}
                fillOpacity={count === 0 ? 1 : 0.3 + intensity * 0.7}
                stroke={suggested ? 'var(--signal)' : 'var(--line-strong)'}
                strokeWidth={suggested ? 1.8 : 1.2}
              />
              <text
                x={s.cx}
                y={s.cy + 3.2}
                textAnchor="middle"
                fontSize={8.5}
                fontWeight={700}
                fill="var(--ink)"
                fontFamily="var(--font-mono)"
              >
                {count || ''}
              </text>
            </g>
          )
        })}
      </svg>
      <figcaption className="mt-2 flex items-center justify-center gap-4 text-[11.5px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full border border-line-strong bg-panel" />
          {t('sites.neverUsed')}
        </span>
        <span className="inline-flex items-center gap-1.5">
          <span className="inline-block size-2.5 rounded-full bg-[var(--chart-3)]" />
          {t('sites.uses', { count: maxUse })}
        </span>
      </figcaption>
    </figure>
  )
}
