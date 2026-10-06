import { FlaskConical } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

/** First run: three steps to a working lab. */
export function SetupLab({ readOnly, onFreeDose }: { readOnly?: boolean; onFreeDose: () => void }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const steps = [
    {
      n: '01',
      title: t('setupLab.protocol'),
      body: t('setupLab.protocolHint'),
      to: '/protocols/new',
    },
    { n: '02', title: t('setupLab.vial'), body: t('setupLab.vialHint'), to: '/inventory' },
    { n: '03', title: t('setupLab.learn'), body: t('setupLab.learnHint'), to: '/wiki' },
  ]
  return (
    <Card>
      <div className="flex items-center gap-3">
        <span className="glow grid size-12 shrink-0 place-items-center rounded-2xl border border-signal/30 bg-signal-soft text-signal">
          <FlaskConical aria-hidden className="size-6" />
        </span>
        <div className="min-w-0">
          <h2 className="font-display text-[20px] font-bold leading-tight">
            {t('setupLab.title')}
          </h2>
          <p className="text-[13px] text-muted">{t('setupLab.intro')}</p>
        </div>
      </div>
      {!readOnly && (
        <ol className="mt-4 flex flex-col gap-2">
          {steps.map((s) => (
            <li key={s.n}>
              <button
                type="button"
                onClick={() => nav(s.to)}
                className="flex w-full items-start gap-3 rounded-[16px] border border-line bg-panel-2 p-3 text-left transition active:scale-[0.99]"
              >
                <span className="readout pt-0.5 text-[13px] font-semibold text-signal">{s.n}</span>
                <span>
                  <span className="block text-[14.5px] font-semibold">{s.title}</span>
                  <span className="block text-[12.5px] text-muted">{s.body}</span>
                </span>
              </button>
            </li>
          ))}
        </ol>
      )}
      {!readOnly && (
        <Button variant="ghost" size="sm" className="mt-2" onClick={onFreeDose}>
          {t('setupLab.freeDose')}
        </Button>
      )}
    </Card>
  )
}
