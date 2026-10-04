/**
 * What the editor opens with: the protocol being edited, a copy of one, a saved protocol,
 * a label template or a blank page (optionally with a substance). Pure; see initialDraft.test.ts.
 */
import { templateById } from '@/content/protocols/templates'
import type { L10n } from '@/content/schema'
import type { ProtocolRow, SavedProtocolRow } from '@/data/database.types'
import { parseComponents, parseSteps, toProtocolLike } from '@/data/mappers'
import { toDateInputValue } from '@/lib/format'
import { defaultEntry } from './doseUnits'
import {
  draftFromParts,
  emptyDraft,
  originOf,
  unitOf,
  type ConcOf,
  type Draft,
  type Origin,
} from './draft'

export type DraftSource =
  /** Edit this protocol. */
  | { kind: 'existing'; row: ProtocolRow }
  /** A new protocol that starts as a copy of this one. */
  | { kind: 'copy'; row: ProtocolRow }
  | { kind: 'saved'; row: SavedProtocolRow }
  | { kind: 'template'; id: string }
  | { kind: 'blank'; compoundId: string | null }

export interface DraftContext {
  concOf: ConcOf
  pick: (text: L10n) => string
  now: Date
  /** "copia": appended to the name of a copy. */
  copySuffix: string
}

export function initialDraft(
  source: DraftSource,
  { concOf, pick, now, copySuffix }: DraftContext,
): { draft: Draft; origin: Origin | null } {
  switch (source.kind) {
    case 'existing':
    case 'copy': {
      const row = source.row
      const times = row.times?.length ? row.times : [row.time_of_day.slice(0, 5)]
      const parts = draftFromParts(
        row.compound_id,
        parseSteps(row.steps),
        parseComponents(row.components),
        times,
        concOf,
      )
      const isCopy = source.kind === 'copy'
      return {
        draft: {
          ...emptyDraft(),
          ...parts,
          name: isCopy ? `${row.name} (${copySuffix})` : row.name,
          startDate: isCopy ? toDateInputValue(now) : row.start_date,
          notes: row.notes ?? '',
        },
        origin: isCopy
          ? null
          : originOf(
              toProtocolLike(row),
              parts.steps.map((s) => s.key),
              now,
            ),
      }
    }
    case 'saved': {
      const row = source.row
      return {
        draft: {
          ...emptyDraft(),
          ...draftFromParts(
            row.compound_id,
            parseSteps(row.steps),
            parseComponents(row.components),
            row.times,
            concOf,
          ),
          templateRef: `saved:${row.id}`,
          name: row.name,
          notes: row.notes ?? '',
        },
        origin: null,
      }
    }
    case 'template': {
      const tpl = templateById(source.id)
      if (!tpl) return { draft: emptyDraft(), origin: null }
      return {
        draft: {
          ...emptyDraft(),
          ...draftFromParts(tpl.compoundId, tpl.steps, [], ['09:00'], concOf),
          templateRef: `label:${tpl.id}`,
          name: pick(tpl.name),
        },
        origin: null,
      }
    }
    case 'blank': {
      const compoundId = source.compoundId ?? ''
      return {
        draft: {
          ...emptyDraft(),
          compoundId,
          doseEntry: compoundId ? defaultEntry(unitOf(compoundId), concOf(compoundId)) : 'mg',
        },
        origin: null,
      }
    }
  }
}
