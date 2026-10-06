import { ChevronRight, FlaskConical } from 'lucide-react'
import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/Button'

/** First run: three steps to a working lab, as rows of one card. */
export function SetupLab({ readOnly, onFreeDose }: { readOnly?: boolean; onFreeDose: () => void }) {
  const { t } = useTranslation()
  const nav = useNavigate()
  const titleId = useId()
  const steps = [
    { n: 1, title: t('setupLab.protocol'), body: t('setupLab.protocolHint'), to: '/protocols/new' },
    { n: 2, title: t('setupLab.vial'), body: t('setupLab.vialHint'), to: '/inventory' },
    { n: 3, title: t('setupLab.learn'), body: t('setupLab.learnHint'), to: '/wiki' },
  ]
  return (
    <section className="card fade-up p-4" aria-labelledby={titleId}>
      <div className="flex items-center gap-3">
        <span className="grid size-11 shrink-0 place-items-center rounded-full bg-signal-soft text-signal">
          <FlaskConical aria-hidden className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 id={titleId} className="text-[19px] font-semibold leading-tight">
            {t('setupLab.title')}
          </h2>
          <p className="mt-0.5 text-[13px] leading-snug text-muted">{t('setupLab.intro')}</p>
        </div>
      </div>
      {!readOnly && (
        <>
          <ol className="mt-3 divide-y divide-line">
            {steps.map((s) => (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => nav(s.to)}
                  className="flex min-h-14 w-full items-center gap-3 py-3 text-left outline-none focus-visible:ring-2 focus-visible:ring-signal/60"
                >
                  <span className="readout w-5 shrink-0 text-[15px] font-semibold text-signal">
                    {s.n}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold leading-snug">{s.title}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-muted">
                      {s.body}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="size-4 shrink-0 text-muted" />
                </button>
              </li>
            ))}
          </ol>
          <Button variant="secondary" block className="mt-2" onClick={onFreeDose}>
            {t('setupLab.freeDose')}
          </Button>
        </>
      )}
    </section>
  )
}
