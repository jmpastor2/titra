import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Card } from '@/components/ui/Card'
import { Vial } from '@/components/ui/primitives'

/** Where the stock stands at a glance: vials in use, in reserve and finished. */
export function StockStrip({
  inUse,
  reserve,
  finished,
}: {
  inUse: number
  reserve: number
  finished: number
}) {
  const { t } = useTranslation()
  return (
    <Card instrument padded={false} className="mb-3">
      <dl className="grid grid-cols-3 divide-x divide-line">
        <Reading
          label={t('inventory.strip.inUse')}
          count={inUse}
          icon={<Vial color="var(--signal)" fill={0.72} size={34} />}
        />
        <Reading
          label={t('inventory.strip.reserve')}
          count={reserve}
          icon={<Vial color="var(--ink-2)" state="powder" size={34} />}
        />
        <Reading
          label={t('inventory.strip.finished')}
          count={finished}
          icon={<Vial color="var(--muted)" state="powder" size={34} className="opacity-50" />}
        />
      </dl>
    </Card>
  )
}

function Reading({ label, count, icon }: { label: string; count: number; icon: ReactNode }) {
  return (
    <div className="min-w-0 px-3.5 py-3">
      <dt className="spec truncate text-[9.5px]">{label}</dt>
      <dd className="mt-2 flex items-center gap-2.5">
        {icon}
        <span className="readout text-[28px] font-semibold leading-none">{count}</span>
      </dd>
    </div>
  )
}
