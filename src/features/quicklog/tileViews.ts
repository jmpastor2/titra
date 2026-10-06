/**
 * What each tile of the Registro rápido says: its reading, its caption and its look, from the
 * data behind it. Plain data (no JSX) so the same words feed the grid and the "Más" sheet and
 * can be tested in both languages. See tileViews.test.ts.
 */
import { isSameDay } from 'date-fns'
import type { TFunction } from 'i18next'
import {
  Activity,
  Beef,
  Droplets,
  Dumbbell,
  Gauge,
  Ruler,
  Scale,
  Syringe,
  Utensils,
  type LucideIcon,
} from 'lucide-react'
import type { SymptomRow } from '@/data/database.types'
import { clock, fastingState, fastProgress } from '@/features/fasting/fasting'
import { displayUnit } from '@/features/health/kinds'
import { fmtSigned } from '@/features/health/progress'
import { fmtDate, fmtHours, fmtNumber, type Locale } from '@/lib/format'
import type { DoseGlance } from './doseGlance'
import type { QuickData } from './quickData'
import type { LatestReading } from './readings'
import { changeBetween, stepSpec, toDisplay } from './stepper'
import { agoLabel, fmtFixed } from './text'
import { STRENGTH_WEEKLY_TARGET, type Tier, type TileId, type TileTone } from './tiles'
import { fmtVolume, splitVolume } from './water'

export type TileVisual =
  /** How far toward the day's goal, 0 to 1 (more is drawn full). */
  | { kind: 'gauge'; fraction: number; done: boolean }
  /** How far through a wait, 0 to 1. */
  | { kind: 'bar'; fraction: number }
  | { kind: 'spark'; values: number[] }
  /** Colour dots of the substances in a dose, beside the label. */
  | { kind: 'substances'; compoundIds: string[] }

export interface TileView {
  id: TileId
  icon: LucideIcon
  label: string
  /** The reading; `word` sets it in the display face instead of the instrument face. */
  value: { text: string; unit?: string; word?: boolean }
  caption?: string
  tone: TileTone
  /** Something here wants attention: a mark beside the label. */
  dot: boolean
  /** The whole tile read out, with what a tap does when it is not obvious. */
  aria: string
  visual?: TileVisual
}

export interface TileContext {
  t: TFunction
  locale: Locale
  now: Date
  data: QuickData
  glance: DoseGlance
  symptoms: readonly SymptomRow[]
  /** Daily water goal in ml. */
  goalMl: number
  lastMeal: Date | null
  tiers: ReadonlyMap<TileId, Tier>
}

/** A figure and its unit stay on one line in a caption that wraps. */
const nbsp = (reading: string) => reading.replace(' ', '\u00A0')

const toneOf = (tier: Tier): TileTone =>
  tier >= 3 ? 'urgent' : tier === 2 ? 'attention' : tier === 0 ? 'done' : 'idle'

function build(
  ctx: TileContext,
  id: TileId,
  icon: LucideIcon,
  parts: {
    value: TileView['value']
    caption?: string
    tone?: TileTone
    visual?: TileVisual
    /** What a tap does, when the label does not say it. */
    hint?: string
  },
): TileView {
  const tier = ctx.tiers.get(id) ?? 1
  const tone = parts.tone ?? toneOf(tier)
  const label = ctx.t(`quick.tile.${id}`)
  const reading = parts.value.unit ? `${parts.value.text} ${parts.value.unit}` : parts.value.text
  return {
    id,
    icon,
    label,
    value: parts.value,
    ...(parts.caption ? { caption: parts.caption } : {}),
    tone,
    dot: tone === 'attention',
    aria: [label, reading, parts.caption, parts.hint].filter(Boolean).join('. '),
    ...(parts.visual ? { visual: parts.visual } : {}),
  }
}

function doseView(ctx: TileContext): TileView {
  const { t, locale, now, glance } = ctx
  const { status, dose } = glance
  const detail = dose
    ? `${dose.name}${dose.units !== null ? ` · ${fmtNumber(dose.units, locale, 1)} U` : ''}`
    : undefined
  const visual: TileVisual | undefined = dose
    ? { kind: 'substances', compoundIds: dose.compoundIds }
    : undefined
  const make = (text: string, caption: string | undefined, withVisual = true) =>
    build(ctx, 'dose', Syringe, {
      value: { text, word: true },
      ...(caption ? { caption } : {}),
      ...(withVisual && visual ? { visual } : {}),
    })

  switch (status) {
    case 'due':
      return make(t('quick.dose.dueNow'), detail)
    case 'overdue':
      return make(
        t('quick.dose.overdue', {
          time: fmtHours(dose ? (now.getTime() - dose.at.getTime()) / 3_600_000 : 0, locale),
        }),
        detail,
      )
    case 'upcoming':
      return make(
        t('quick.dose.inTime', { time: fmtHours(glance.hoursAhead ?? 0, locale) }),
        detail,
      )
    case 'missed':
      return make(t('quick.dose.missed'), detail)
    case 'done':
      return make(
        t('quick.dose.done'),
        dose ? t('quick.dose.next', { when: fmtDate(dose.at, locale, 'EEE HH:mm') }) : undefined,
        false,
      )
    case 'none':
      return dose
        ? make(
            t('quick.dose.none'),
            t('quick.dose.next', { when: fmtDate(dose.at, locale, 'EEE HH:mm') }),
            false,
          )
        : make(t('quick.dose.free'), t('quick.dose.freeHint'), false)
  }
}

function waterView(ctx: TileContext): TileView {
  const { t, locale, data, goalMl } = ctx
  const { total } = data.water
  const reading = splitVolume(total, locale)
  const reached = total >= goalMl
  return build(ctx, 'water', Droplets, {
    value: { text: reading.value, unit: reading.unit },
    caption: reached
      ? t('quick.water.tileDone')
      : t('quick.counter.left', { amount: nbsp(fmtVolume(goalMl - total, locale)) }),
    visual: { kind: 'gauge', fraction: total / goalMl, done: reached },
    hint: t('quick.water.tileHint', {
      goal: fmtVolume(goalMl, locale),
      amount: fmtVolume(250, locale),
    }),
  })
}

/** Weight or waist: the last reading, how long ago, and the change from the one before. */
function bodyView(
  ctx: TileContext,
  id: 'weight' | 'waist',
  icon: LucideIcon,
  reading: LatestReading | null,
  spark?: number[],
): TileView {
  const { t, locale, now, data } = ctx
  if (!reading) {
    return build(ctx, id, icon, {
      value: { text: '—' },
      caption: t(`quick.${id}.first`),
    })
  }
  const spec = stepSpec(id, data.imperial)
  const value = toDisplay(id, reading.value, data.imperial)
  const delta = reading.previous
    ? changeBetween(id, reading.previous.value, reading.value, data.imperial)
    : 0
  const caption = [
    agoLabel(t, reading.at, now),
    delta !== 0 ? fmtSigned(delta, locale, spec.digits) : null,
  ]
    .filter(Boolean)
    .join(' · ')
  return build(ctx, id, icon, {
    value: { text: fmtFixed(value, locale, spec.digits), unit: displayUnit(id, data.imperial) },
    caption,
    ...(spark && spark.length >= 2
      ? { visual: { kind: 'spark', values: spark } satisfies TileVisual }
      : {}),
  })
}

function checkInView(ctx: TileContext): TileView {
  const { t, now, data } = ctx
  const c = data.checkIn
  if (c.doneToday) {
    return build(ctx, 'checkin', Gauge, {
      value: { text: t('quick.checkin.done'), word: true },
      caption: t('quick.checkin.streak', { count: c.streak }),
    })
  }
  if (c.ageDays === null) {
    return build(ctx, 'checkin', Gauge, {
      value: { text: t('quick.checkin.start'), word: true },
      caption: t('quick.checkin.startHint'),
    })
  }
  return build(ctx, 'checkin', Gauge, {
    value: { text: t('quick.checkin.pending'), word: true },
    caption:
      c.streak > 0 && c.lastAt
        ? t('quick.checkin.streak', { count: c.streak })
        : c.lastAt
          ? agoLabel(t, c.lastAt, now)
          : undefined,
  })
}

function symptomView(ctx: TileContext): TileView {
  const { t, now, symptoms } = ctx
  const kindName = (s: SymptomRow) => t(`symptoms.kinds.${s.kind}`)
  const today = symptoms.filter((s) => isSameDay(new Date(s.occurred_at), now))
  const [latestToday] = today
  if (latestToday) {
    return build(ctx, 'symptom', Activity, {
      value: { text: kindName(latestToday), word: true },
      caption:
        today.length > 1
          ? t('quick.symptom.many', { count: today.length })
          : t('quick.symptom.today', { severity: latestToday.severity }),
    })
  }
  const [last] = symptoms
  if (last) {
    return build(ctx, 'symptom', Activity, {
      value: { text: t('quick.symptom.noneToday'), word: true },
      caption: `${kindName(last)} · ${agoLabel(t, new Date(last.occurred_at), now)}`,
    })
  }
  return build(ctx, 'symptom', Activity, {
    value: { text: t('quick.symptom.none'), word: true },
    caption: t('quick.symptom.hint'),
  })
}

function proteinView(ctx: TileContext): TileView {
  const { t, locale, data } = ctx
  const { total, target } = data.protein
  const reached = target !== null && total >= target
  return build(ctx, 'protein', Beef, {
    value: { text: fmtNumber(total, locale, 0), unit: 'g' },
    caption:
      target === null
        ? t('quick.protein.noTargetShort')
        : reached
          ? t('quick.protein.tileDone')
          : t('quick.counter.left', { amount: nbsp(`${fmtNumber(target - total, locale, 0)} g`) }),
    visual: { kind: 'gauge', fraction: target ? total / target : 0, done: reached },
  })
}

function strengthView(ctx: TileContext): TileView {
  const { t, now, data } = ctx
  const w = data.strength
  return build(ctx, 'strength', Dumbbell, {
    value: { text: String(w.count), unit: `/ ${STRENGTH_WEEKLY_TARGET}` },
    caption: w.last ? agoLabel(t, w.last.at, now) : t('quick.strength.none'),
  })
}

function fastingView(ctx: TileContext): TileView {
  const { t, now, lastMeal } = ctx
  const s = fastingState(lastMeal, now)
  if (!lastMeal) {
    return build(ctx, 'fasting', Utensils, {
      value: { text: t('quick.fasting.none'), word: true },
      caption: t('quick.fasting.ask'),
    })
  }
  if (!s.ready) {
    return build(ctx, 'fasting', Utensils, {
      value: { text: t('quick.fasting.readyAt', { at: clock(s.readyAt ?? now) }), word: true },
      caption: t('fasting.minLeft', { min: s.waitMin }),
      visual: { kind: 'bar', fraction: fastProgress(lastMeal, now) },
    })
  }
  return build(ctx, 'fasting', Utensils, {
    value: { text: t('fasting.fasted'), word: true },
    caption: t('quick.fasting.since', { at: clock(s.readyAt ?? lastMeal) }),
    tone: 'done',
  })
}

export function tileView(id: TileId, ctx: TileContext): TileView {
  switch (id) {
    case 'dose':
      return doseView(ctx)
    case 'water':
      return waterView(ctx)
    case 'weight':
      return bodyView(ctx, 'weight', Scale, ctx.data.weight, ctx.data.weightSpark)
    case 'waist':
      return bodyView(ctx, 'waist', Ruler, ctx.data.waist)
    case 'checkin':
      return checkInView(ctx)
    case 'symptom':
      return symptomView(ctx)
    case 'protein':
      return proteinView(ctx)
    case 'strength':
      return strengthView(ctx)
    case 'fasting':
      return fastingView(ctx)
  }
}

/** The tile in one line, for the "Más" sheet: "77,0 kg · hace 2 días · −0,4". */
export function summaryOf(view: TileView): string {
  const value = view.value.unit ? `${view.value.text} ${view.value.unit}` : view.value.text
  return [value, view.caption].filter(Boolean).join(' · ')
}
