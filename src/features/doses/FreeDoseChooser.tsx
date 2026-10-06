import { ChevronRight, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { SubstanceDot, Vial } from '@/components/ui/primitives'
import { compoundColor } from '@/content/substanceColor'
import { vialLook } from '@/features/inventory/vials'
import { fmtDoseList, fmtNumber } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { unitOf } from './doseLines'
import { shortNames } from './substanceNames'
import type {
  FreeChoice,
  FreeChoices,
  ProtocolChoice,
  RecentChoice,
  VialChoice,
} from './freeChoices'

/** A choice is a plain row of the list: the whole row is the target. */
const row =
  'flex w-full items-center gap-3 py-3 text-left outline-none transition-opacity active:opacity-60 focus-visible:ring-2 focus-visible:ring-signal/60 rounded-control'

/**
 * "¿Qué te has puesto?" (the sheet's title): instead of a dropdown, rows for what a person
 * actually injects.
 * A protocol with its whole stack, each vial in stock (a blend is one entry) and what was
 * logged lately; anything else is one tap away.
 */
export function FreeDoseChooser({
  choices,
  onChoose,
  onOther,
}: {
  choices: FreeChoices
  onChoose: (choice: FreeChoice) => void
  onOther: () => void
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col gap-6 pb-2 pt-1">
      {choices.protocols.length > 0 && (
        <Section label={t('doses.choose.protocols')}>
          <ul className="flex flex-col divide-y divide-line">
            {choices.protocols.map((c) => (
              <li key={c.key}>
                <ProtocolTile choice={c} onChoose={onChoose} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {choices.vials.length > 0 && (
        <Section label={t('doses.choose.vials')}>
          <ul className="flex flex-col divide-y divide-line">
            {choices.vials.map((c) => (
              <li key={c.key}>
                <VialTile choice={c} onChoose={onChoose} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      {choices.recent.length > 0 && (
        <Section label={t('doses.choose.recent')}>
          <ul className="flex flex-wrap gap-x-2">
            {choices.recent.map((c) => (
              <li key={c.key}>
                <RecentChip choice={c} onChoose={onChoose} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <Button
        variant="secondary"
        block
        leading={<Search className="size-4" aria-hidden />}
        onClick={onOther}
      >
        {t('doses.choose.other')}
      </Button>
    </div>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h4 className="text-[13px] font-medium text-ink-2">{label}</h4>
      {children}
    </section>
  )
}

function ProtocolTile({
  choice,
  onChoose,
}: {
  choice: ProtocolChoice
  onChoose: (choice: FreeChoice) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const planned = choice.doses.flatMap((d) =>
    d.mg === undefined ? [] : [{ valueMg: d.mg, unit: unitOf(d.compoundId) }],
  )
  return (
    <button type="button" onClick={() => onChoose(choice)} className={`${row} min-h-[60px]`}>
      <span className="flex w-[22px] shrink-0 items-center gap-1" aria-hidden>
        {choice.doses.map((d) => (
          <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[15px] font-semibold">{choice.protocol.name}</span>
        <span className="readout block break-words text-[12.5px] text-muted">
          {planned.length ? fmtDoseList(planned, locale) : t('doses.choose.resting')}
        </span>
      </span>
      {choice.units !== null ? (
        <span className="readout shrink-0 text-[20px] font-semibold leading-none text-signal">
          {fmtNumber(choice.units, locale, 1)}
          <span className="ml-0.5 text-[12px]">U</span>
        </span>
      ) : (
        <ChevronRight className="size-4 shrink-0 text-muted" aria-hidden />
      )}
    </button>
  )
}

function VialTile({
  choice,
  onChoose,
}: {
  choice: VialChoice
  onChoose: (choice: FreeChoice) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const { vial } = choice
  return (
    <button type="button" onClick={() => onChoose(choice)} className={`${row} min-h-[64px]`}>
      <Vial {...vialLook(vial)} size={40} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block break-words text-[15px] font-semibold">{vial.label}</span>
        <span className="readout mt-0.5 block break-words text-[12px] text-muted">
          {choice.liquid
            ? t('doses.choose.left', {
                amount: `${fmtNumber(Number(vial.remaining_mg), locale, 2)} mg`,
              })
            : t('doses.choose.powder')}
        </span>
      </span>
    </button>
  )
}

function RecentChip({
  choice,
  onChoose,
}: {
  choice: RecentChoice
  onChoose: (choice: FreeChoice) => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChoose(choice)}
      className="group inline-flex min-h-11 items-center outline-none"
    >
      <span className="inline-flex items-center gap-2 rounded-full border border-line-strong px-3.5 py-2 text-[13.5px] font-semibold transition group-active:bg-panel-2 group-focus-visible:ring-2 group-focus-visible:ring-signal/60">
        <span className="flex items-center gap-1" aria-hidden>
          {choice.compoundIds.map((id) => (
            <SubstanceDot key={id} color={compoundColor(id)} />
          ))}
        </span>
        {shortNames(choice.compoundIds)}
      </span>
    </button>
  )
}
