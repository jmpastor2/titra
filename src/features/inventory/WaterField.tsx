import { clsx } from 'clsx'
import { AlertTriangle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Field, Input } from '@/components/ui/Field'
import { compoundById } from '@/content/compounds'
import { fmtNumber, type Locale } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import {
  convertAmount,
  isPositive,
  issueKey,
  mlToAmount,
  parseAmount,
  plainAmount,
  waterShortcuts,
  waterToMl,
  type WaterIssue,
  type WaterUnit,
} from './reconstitute'
import type { WaterState } from './useWaterEntry'

const UNITS: WaterUnit[] = ['U', 'mL']

/**
 * The bacteriostatic water added to a vial, entered the way it is measured: syringe units
 * (100 U = 1 mL) by default, with a switch to mL, the equivalent always in view, shortcuts
 * and the warnings for amounts that look like the other unit.
 *
 * Steady while typing: the line under the field always holds one line (the hint or the
 * equivalent), the shortcuts sit above the warnings, and the warnings have a reserved place
 * of their own, so nothing a finger is aiming at moves when one comes or goes.
 */
export function WaterField({
  value,
  onChange,
  contentMg,
  issues,
}: {
  value: WaterState
  /** `typed` is true for keystrokes, whose checks wait until typing pauses. */
  onChange: (next: WaterState, typed?: boolean) => void
  /** mg in the whole vial, to offer amounts that make sense for it. */
  contentMg: number
  issues: readonly WaterIssue[]
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const amount = parseAmount(value.text)
  const other: WaterUnit = value.unit === 'U' ? 'mL' : 'U'
  const n = (x: number) => fmtNumber(x, locale, 2)
  const doubtful = issues.length > 0

  return (
    <div className="flex flex-col">
      <Field
        label={t('reconstitute.water')}
        trailing={
          <div
            role="radiogroup"
            aria-label={t('reconstitute.unitLabel')}
            className="inline-flex rounded-full border border-line bg-panel-2"
          >
            {UNITS.map((u) => (
              <button
                key={u}
                type="button"
                role="radio"
                aria-checked={u === value.unit}
                onClick={() =>
                  onChange({ text: convertAmount(value.text, value.unit, u), unit: u })
                }
                className="group grid min-h-11 min-w-14 place-items-center px-0.5 outline-none"
              >
                <span
                  className={clsx(
                    'grid h-[34px] w-full place-items-center rounded-full px-3.5 text-[14px] font-semibold transition group-focus-visible:ring-2 group-focus-visible:ring-signal/60',
                    u === value.unit
                      ? 'bg-panel text-ink shadow-[inset_0_0_0_1px_var(--line-strong)]'
                      : 'text-muted group-hover:text-ink-2',
                  )}
                >
                  {u}
                </span>
              </button>
            ))}
          </div>
        }
        // The same water in the other unit, always in view: the check against the 100-for-1 slip.
        hint={
          <span className="readout">
            {isPositive(amount)
              ? `${n(amount)} ${value.unit} = ${n(mlToAmount(waterToMl(amount, value.unit), other))} ${other}`
              : t('reconstitute.waterHint')}
          </span>
        }
      >
        {(id, describedBy) => (
          <Input
            id={id}
            data-autofocus
            inputMode="decimal"
            autoComplete="off"
            enterKeyHint="done"
            aria-describedby={describedBy}
            value={value.text}
            onChange={(e) => onChange({ ...value, text: e.target.value }, true)}
            // Leaving the field checks what was typed straight away.
            onBlur={() => onChange(value)}
            suffix={value.unit}
            placeholder={value.unit === 'U' ? '100' : '1'}
            className={clsx(
              'readout text-[17px] font-semibold',
              doubtful && 'border-warn/60 focus:border-warn/70 focus:ring-warn/15',
            )}
          />
        )}
      </Field>

      <div
        role="group"
        aria-label={t('reconstitute.shortcuts')}
        className="mt-3 grid grid-cols-3 gap-2"
      >
        {waterShortcuts(contentMg).map((ml) => {
          const target = mlToAmount(ml, value.unit)
          const active = Math.abs(amount - target) < 1e-9
          // The amount in the unit being typed first, the other one under it.
          const [main, sub] =
            value.unit === 'U'
              ? [`${n(ml * 100)} U`, `${n(ml)} mL`]
              : [`${n(ml)} mL`, `${n(ml * 100)} U`]
          return (
            <button
              key={ml}
              type="button"
              aria-pressed={active}
              onClick={() => onChange({ ...value, text: plainAmount(target) })}
              className={clsx(
                'flex min-h-12 flex-col items-center justify-center rounded-control border px-2 py-1.5 outline-none transition active:scale-[0.97] focus-visible:ring-2 focus-visible:ring-signal/60',
                active
                  ? 'border-signal/40 bg-signal-soft text-ink'
                  : 'border-line text-ink-2 hover:border-line-strong',
              )}
            >
              <span className="readout text-[14px] font-semibold leading-tight">{main}</span>
              <span className="readout text-[11.5px] leading-tight text-muted">{sub}</span>
            </button>
          )
        })}
      </div>

      {/* A line kept free for a warning, so a short one arrives without moving anything. */}
      <div role="status" className="mt-3 flex min-h-[18px] flex-col gap-2.5">
        {issues.map((issue) => (
          <Issue
            key={issueKey(issue)}
            issue={issue}
            value={value}
            onChange={onChange}
            locale={locale}
          />
        ))}
      </div>
    </div>
  )
}

const nameOf = (id: string) => compoundById(id)?.names.generic ?? id

/** One warning: a sentence with an amber mark and, when there is one, the fix as a link. */
function Issue({
  issue,
  value,
  onChange,
  locale,
}: {
  issue: WaterIssue
  value: WaterState
  onChange: (next: WaterState) => void
  locale: Locale
}) {
  const { t } = useTranslation()
  const n = (x: number) => fmtNumber(x, locale, 2)

  let text: string
  let fix: { label: string; apply: () => void } | null = null
  switch (issue.kind) {
    case 'unitsAsMl':
      text = t('reconstitute.warn.unitsAsMl', {
        amount: n(issue.amount),
        mg: n(issue.contentMg),
        ml: n(issue.ml),
      })
      fix = {
        label: t('reconstitute.warn.useUnits', { amount: n(issue.amount) }),
        apply: () => onChange({ ...value, unit: 'U' }),
      }
      break
    case 'mlAsUnits':
      text = t('reconstitute.warn.mlAsUnits', {
        amount: n(issue.amount),
        ml: n(issue.amount / 100),
      })
      fix = {
        label: t('reconstitute.warn.useMl', { amount: n(issue.amount) }),
        apply: () => onChange({ ...value, unit: 'mL' }),
      }
      break
    case 'tooMuch':
      text = t('reconstitute.warn.tooMuch', {
        ml: n(issue.ml),
        mg: n(issue.contentMg),
        conc: n(issue.concMgPerMl),
      })
      break
    case 'doseTooSmall':
      text = t('reconstitute.warn.doseTooSmall', {
        names: issue.compoundIds.map(nameOf).join(' + '),
        units: n(issue.units),
      })
      break
    case 'doseTooBig':
      text = t('reconstitute.warn.doseTooBig', {
        names: issue.compoundIds.map(nameOf).join(' + '),
        units: n(issue.units),
      })
      break
    case 'overBarrel':
      text = t('reconstitute.warn.overBarrel', {
        names: issue.compoundIds.map(nameOf).join(' + '),
        units: n(issue.units),
        capacity: n(issue.capacity),
        ml: n(issue.capacity / 100),
      })
      break
  }

  return (
    <p className="flex items-start gap-2.5 text-[13px] leading-snug text-ink">
      <AlertTriangle className="mt-px size-4 shrink-0 text-warn" aria-hidden />
      <span className="min-w-0">
        {text}
        {fix && (
          <>
            {' '}
            {/* A 44 px target that keeps the height of the line it sits in. */}
            <button
              type="button"
              onClick={fix.apply}
              className="tap-link inline-block whitespace-nowrap rounded-md px-1 font-semibold text-warn outline-none focus-visible:ring-2 focus-visible:ring-warn/60"
            >
              {fix.label}
            </button>
          </>
        )}
      </span>
    </p>
  )
}
