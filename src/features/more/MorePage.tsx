import {
  BellRing,
  TrendingUp,
  Calculator,
  ChevronRight,
  Download,
  FlaskConical,
  Package,
  Settings,
  Share2,
  Sparkles,
  Target,
} from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card } from '@/components/ui/Card'
import { SectionTitle } from '@/components/ui/primitives'
import { env } from '@/lib/env'

interface Item {
  icon: ReactNode
  label: string
  hint: string
  to: string
}

export function MorePage() {
  const { t } = useTranslation()
  const nav = useNavigate()

  const groups: { title: string; index: string; items: Item[] }[] = [
    {
      title: t('more.lab'),
      index: '01',
      items: [
        {
          icon: <FlaskConical className="size-[18px]" />,
          label: t('more.protocols'),
          hint: t('more.protocolsHint'),
          to: '/protocols',
        },
        {
          icon: <Package className="size-[18px]" />,
          label: t('more.inventory'),
          hint: t('more.inventoryHint'),
          to: '/inventory',
        },
        {
          icon: <Target className="size-[18px]" />,
          label: t('more.sites'),
          hint: t('more.sitesHint'),
          to: '/sites',
        },
      ],
    },
    {
      title: t('more.tools'),
      index: '02',
      items: [
        {
          icon: <Calculator className="size-[18px]" />,
          label: t('more.calculator'),
          hint: t('more.calculatorHint'),
          to: '/calculator',
        },
        {
          icon: <TrendingUp className="size-[18px]" />,
          label: t('more.outlook'),
          hint: t('more.outlookHint'),
          to: '/outlook',
        },
        {
          icon: <Sparkles className="size-[18px]" />,
          label: t('more.simulator'),
          hint: t('more.simulatorHint'),
          to: '/simulator',
        },
      ],
    },
    {
      title: t('more.account'),
      index: '03',
      items: [
        {
          icon: <BellRing className="size-[18px]" />,
          label: t('more.reminders'),
          hint: t('more.remindersHint'),
          to: '/reminders',
        },
        {
          icon: <Share2 className="size-[18px]" />,
          label: t('more.share'),
          hint: t('more.shareHint'),
          to: '/share',
        },
        {
          icon: <Download className="size-[18px]" />,
          label: t('more.export'),
          hint: t('more.exportHint'),
          to: '/export',
        },
        {
          icon: <Settings className="size-[18px]" />,
          label: t('more.settings'),
          hint: t('more.settingsHint'),
          to: '/settings',
        },
      ],
    },
  ]

  return (
    <div>
      <PageHeader eyebrow={t('more.eyebrow')} title={t('more.title')} large />

      <div className="flex flex-col gap-4">
        {groups.map((g) => (
          <section key={g.index}>
            <SectionTitle index={g.index}>{g.title}</SectionTitle>
            <Card padded={false} className="px-4">
              <ul className="divide-y divide-line">
                {g.items.map((item) => (
                  <li key={item.to}>
                    <button
                      type="button"
                      onClick={() => nav(item.to)}
                      className="-mx-2 flex w-[calc(100%+1rem)] items-center gap-3 rounded-xl px-2 py-3 text-left transition active:bg-panel-2"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-[14px] border border-signal/20 bg-signal-soft text-signal">
                        {item.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[15px] font-semibold">{item.label}</span>
                        <span className="block truncate text-[12.5px] text-muted">{item.hint}</span>
                      </span>
                      <ChevronRight className="size-4 shrink-0 text-muted" />
                    </button>
                  </li>
                ))}
              </ul>
            </Card>
          </section>
        ))}
      </div>

      <p className="spec mt-8 text-center">TITRA · {env.appVersion}</p>
      <p className="mt-2 px-2 text-center text-[11px] leading-relaxed text-muted">
        {t('app.disclaimer')}
      </p>
    </div>
  )
}
