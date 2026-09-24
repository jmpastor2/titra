import { startOfDay } from 'date-fns'
import { useTranslation } from 'react-i18next'
import { compoundColor } from '@/content/substanceColor'
import type { TodayItem } from './agenda'

/**
 * A 24-hour instrument strip: each administration sits at its hour, filled when taken,
 * ringed when due, with a luminous needle at "now".
 */
export function DayStrip({ items, now }: { items: readonly TodayItem[]; now: Date }) {
  const { t } = useTranslation()
  const day = startOfDay(now).getTime()
  const pos = (d: Date) => Math.min(100, Math.max(0, ((d.getTime() - day) / 86_400_000) * 100))
  const nowPct = pos(now)
  return (
    <div className="relative mt-4 h-10" role="img" aria-label={t('today.strip')}>
      {/* baseline and hour ticks */}
      <div className="absolute inset-x-0 top-[18px] h-px bg-line-strong" />
      {Array.from({ length: 25 }, (_, h) => (
        <div
          key={h}
          className="absolute top-[14px] w-px bg-line-strong"
          style={{
            left: `${(h / 24) * 100}%`,
            height: h % 6 === 0 ? 9 : 4,
            top: h % 6 === 0 ? 14 : 16,
          }}
        />
      ))}
      {[0, 6, 12, 18, 24].map((h) => (
        <span
          key={h}
          className="readout absolute top-[27px] -translate-x-1/2 text-[9.5px] text-muted"
          style={{ left: `${(h / 24) * 100}%` }}
        >
          {String(h).padStart(2, '0')}
        </span>
      ))}
      {/* elapsed part of the day */}
      <div
        className="absolute left-0 top-[17px] h-[3px] rounded-full bg-signal/40"
        style={{ width: `${nowPct}%` }}
      />
      {items.map((i) => {
        const color = compoundColor(i.protocol.compound_id)
        const taken = i.status === 'taken'
        const alert = i.status === 'due' || i.status === 'overdue'
        return (
          <span
            key={i.key}
            className={`absolute top-[12px] size-[13px] -translate-x-1/2 rounded-full border-2 ${alert ? 'pulse-ring' : ''}`}
            style={{
              left: `${pos(i.takenAt ?? i.at)}%`,
              borderColor: i.status === 'missed' ? 'var(--danger)' : color,
              background: taken ? color : 'var(--panel)',
              boxShadow: taken ? `0 0 10px ${color}` : undefined,
            }}
          />
        )
      })}
      {/* now needle */}
      <div
        className="absolute top-[6px] h-[26px] w-[2px] -translate-x-1/2 rounded-full bg-signal"
        style={{ left: `${nowPct}%`, boxShadow: 'var(--signal-glow)' }}
      />
    </div>
  )
}
