import {
  Calculator,
  ChevronRight,
  Download,
  FlaskConical,
  Package,
  Settings,
  Sparkles,
  Stethoscope,
  Target,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { usePatientScope } from '@/app/scope'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { env } from '@/lib/env'

export function MorePage() {
  const { t } = useTranslation()
  const nav = useNavigate()
  const { patient } = usePatientScope()
  const isClinician = patient?.role === 'clinician'

  const groups: { items: { icon: React.ReactNode; label: string; to: string }[] }[] = [
    {
      items: [
        {
          icon: <FlaskConical className="size-[18px]" />,
          label: t('more.protocols'),
          to: '/protocols',
        },
        ...(isClinician
          ? []
          : [
              {
                icon: <Package className="size-[18px]" />,
                label: t('more.inventory'),
                to: '/inventory',
              },
              { icon: <Target className="size-[18px]" />, label: t('more.sites'), to: '/sites' },
            ]),
        {
          icon: <Calculator className="size-[18px]" />,
          label: t('more.calculator'),
          to: '/calculator',
        },
        {
          icon: <Sparkles className="size-[18px]" />,
          label: t('more.simulator'),
          to: '/simulator',
        },
      ],
    },
    {
      items: [
        ...(isClinician
          ? []
          : [
              {
                icon: <Stethoscope className="size-[18px]" />,
                label: t('more.clinician'),
                to: '/clinician',
              },
            ]),
        { icon: <Download className="size-[18px]" />, label: t('more.export'), to: '/export' },
        { icon: <Settings className="size-[18px]" />, label: t('more.settings'), to: '/settings' },
      ],
    },
  ]

  return (
    <div>
      <PageHeader title={t('more.title')} large />

      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <Card key={g.items[0]?.to ?? 'group'} padded={false} className="px-4">
            <ul className="divide-y divide-line">
              {g.items.map((item) => (
                <li key={item.to}>
                  <button
                    type="button"
                    onClick={() => nav(item.to)}
                    className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3.5 text-left transition active:bg-surface-2"
                  >
                    <span className="grid size-9 shrink-0 place-items-center rounded-full bg-brand-soft text-brand-strong">
                      {item.icon}
                    </span>
                    <span className="flex-1 text-[15px] font-medium">{item.label}</span>
                    <ChevronRight className="size-4 shrink-0 text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-center text-[11.5px] text-muted">
        {t('settings.version', { v: env.appVersion })}
      </p>
      <p className="mt-2 px-2 text-center text-[11px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>
    </div>
  )
}
