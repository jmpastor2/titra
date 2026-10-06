import {
  ChevronRight,
  Droplet,
  FlaskConical,
  Footprints,
  HeartPulse,
  Moon,
  Percent,
  PersonStanding,
  Plus,
  Ruler,
  Stethoscope,
  type LucideIcon,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { usePatientScope } from '@/app/scope'
import { Sheet } from '@/components/ui/Sheet'
import type { MeasurementKind } from '@/data/database.types'
import { useLabs } from '@/data/hooks'
import { useNow } from '@/lib/useNow'
import { agoLabel } from './text'
import type { TileId } from './tiles'

/** Where a row of the sheet leads. */
export type MoreTarget =
  | { kind: 'tile'; id: TileId }
  | { kind: 'lab' }
  | { kind: 'body' }
  | { kind: 'dose' }
  | { kind: 'measure'; measure: MeasurementKind }

export interface HiddenTile {
  id: TileId
  icon: LucideIcon
  label: string
  /** The tile's state in a few words: "77,0 kg · hace 2 días". */
  summary: string
}

const OTHER_MEASURES: readonly { kind: MeasurementKind; icon: LucideIcon }[] = [
  { kind: 'steps', icon: Footprints },
  { kind: 'sleep_hours', icon: Moon },
  { kind: 'heart_rate', icon: HeartPulse },
  { kind: 'bp_systolic', icon: Stethoscope },
  { kind: 'glucose_fasting', icon: Droplet },
  { kind: 'body_fat_pct', icon: Percent },
  { kind: 'lean_mass', icon: PersonStanding },
]

function Entry({
  icon: Icon,
  title,
  subtitle,
  onPress,
}: {
  icon: LucideIcon
  title: string
  subtitle?: ReactNode
  onPress: () => void
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onPress}
        className="-mx-2 flex min-h-14 w-[calc(100%+1rem)] items-center gap-3.5 rounded-xl px-2 py-2.5 text-left outline-none transition active:bg-panel-2 focus-visible:ring-2 focus-visible:ring-signal/60"
      >
        <span aria-hidden className="grid w-6 shrink-0 place-items-center text-ink-2">
          <Icon className="size-5" strokeWidth={1.75} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block break-words text-[15px] font-semibold leading-snug">{title}</span>
          {subtitle && (
            <span className="mt-0.5 block break-words text-[12.5px] leading-snug text-muted">
              {subtitle}
            </span>
          )}
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted/70" aria-hidden />
      </button>
    </li>
  )
}

/**
 * Everything that does not fit the grid: the tiles left out today with their state, the
 * labs, the tape measurements and the other readings, and a free dose.
 */
export function MoreSheet({
  hidden,
  onPick,
  onClose,
}: {
  hidden: readonly HiddenTile[]
  onPick: (target: MoreTarget) => void
  onClose: () => void
}) {
  const { t } = useTranslation()
  const { patientId } = usePatientScope()
  const labs = useLabs(patientId)
  const now = useNow()
  const lastLab = labs.data?.[0]

  return (
    <Sheet open onClose={onClose} title={t('quick.more.title')}>
      <div className="flex flex-col gap-6 pb-2 pt-1">
        {hidden.length > 0 && (
          <section>
            <h3 className="spec mb-1">{t('quick.more.panel')}</h3>
            <ul className="divide-y divide-line">
              {hidden.map((h) => (
                <Entry
                  key={h.id}
                  icon={h.icon}
                  title={h.label}
                  subtitle={h.summary}
                  onPress={() => onPick({ kind: 'tile', id: h.id })}
                />
              ))}
            </ul>
          </section>
        )}
        <section>
          <h3 className="spec mb-1">{t('quick.more.records')}</h3>
          <ul className="divide-y divide-line">
            <Entry
              icon={FlaskConical}
              title={t('health.addLab')}
              subtitle={
                // A blank line while the labs load: no "none yet" that turns into a date.
                labs.isPending
                  ? '\u00a0'
                  : lastLab
                    ? t('quick.more.lastLab', {
                        when: agoLabel(t, new Date(`${lastLab.drawn_at}T12:00`), now),
                      })
                    : t('quick.more.noLab')
              }
              onPress={() => onPick({ kind: 'lab' })}
            />
            <Entry
              icon={Ruler}
              title={t('bodyMeasures.title')}
              subtitle={t('quick.more.girths')}
              onPress={() => onPick({ kind: 'body' })}
            />
            {OTHER_MEASURES.map(({ kind, icon }) => (
              <Entry
                key={kind}
                icon={icon}
                title={kind === 'bp_systolic' ? t('health.bp') : t(`health.kinds.${kind}`)}
                onPress={() => onPick({ kind: 'measure', measure: kind })}
              />
            ))}
          </ul>
        </section>
        <section>
          <h3 className="spec mb-1">{t('quick.more.other')}</h3>
          <ul className="divide-y divide-line">
            <Entry
              icon={Plus}
              title={t('quick.dose.free')}
              subtitle={t('quick.more.freeDoseHint')}
              onPress={() => onPick({ kind: 'dose' })}
            />
          </ul>
        </section>
      </div>
    </Sheet>
  )
}
