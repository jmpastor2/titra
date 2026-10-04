import { ChevronRight, Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
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

const tile =
  'flex w-full items-center gap-3 rounded-[18px] border border-line bg-panel-2 text-left transition active:scale-[0.99] active:border-signal/40'

/**
 * "¿Qué te has puesto?": instead of a dropdown, tiles for what a person actually injects.
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
    <div className="flex flex-col gap-5 pb-2 pt-1">
      <div>
        <h3 className="font-display text-[22px] font-bold leading-tight">
          {t('doses.choose.title')}
        </h3>
        <p className="mt-1 text-[13px] text-muted">{t('doses.choose.hint')}</p>
      </div>

      {choices.protocols.length > 0 && (
        <Section label={t('doses.choose.protocols')}>
          <ul className="flex flex-col gap-2">
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
          <ul className="flex flex-col gap-2">
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
          <ul className="flex flex-wrap gap-2">
            {choices.recent.map((c) => (
              <li key={c.key}>
                <RecentChip choice={c} onChoose={onChoose} />
              </li>
            ))}
          </ul>
        </Section>
      )}

      <button
        type="button"
        onClick={onOther}
        className="flex min-h-12 w-full items-center justify-center gap-2 rounded-[18px] border border-dashed border-line-strong text-[14px] font-semibold text-ink-2 transition active:scale-[0.99] active:border-signal/40"
      >
        <Search className="size-4" aria-hidden />
        {t('doses.choose.other')}
      </button>
    </div>
  )
}

function Section({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-2">
      <h4 className="spec">{label}</h4>
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
    <button type="button" onClick={() => onChoose(choice)} className={`${tile} px-4 py-3`}>
      <span className="flex shrink-0 items-center gap-1" aria-hidden>
        {choice.doses.map((d) => (
          <SubstanceDot key={d.compoundId} color={compoundColor(d.compoundId)} />
        ))}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[15px] font-semibold">{choice.protocol.name}</span>
        <span className="readout block truncate text-[12.5px] text-muted">
          {planned.length ? fmtDoseList(planned, locale) : t('doses.choose.resting')}
        </span>
      </span>
      {choice.units !== null ? (
        <span className="readout text-glow shrink-0 text-[20px] font-semibold leading-none text-signal">
          {fmtNumber(choice.units, locale, 1)}
          <span className="ml-0.5 text-[11px]">U</span>
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
    <button
      type="button"
      onClick={() => onChoose(choice)}
      className={`${tile} min-h-[68px] px-4 py-2.5`}
    >
      <Vial {...vialLook(vial)} size={44} className="shrink-0" />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[14.5px] font-semibold">{vial.label}</span>
        <span className="readout mt-0.5 block truncate text-[12px] text-muted">
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
      className="inline-flex min-h-11 items-center gap-2 rounded-full border border-line-strong bg-panel-2 px-3.5 text-[13.5px] font-semibold transition active:scale-[0.98]"
    >
      <span className="flex items-center gap-1" aria-hidden>
        {choice.compoundIds.map((id) => (
          <SubstanceDot key={id} color={compoundColor(id)} />
        ))}
      </span>
      {shortNames(choice.compoundIds)}
    </button>
  )
}
