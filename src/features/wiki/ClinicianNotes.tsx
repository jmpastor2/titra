import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Textarea } from '@/components/ui/Field'
import { useToast } from '@/components/ui/Toast'
import { useSaveCompoundNote } from '@/data/hooks'
import { useSession } from '@/features/auth/SessionProvider'

interface Note {
  id: string
  body: string
  clinician_id: string
}

/**
 * A clinician's note on the entry: the patient reads the ones their clinicians shared, the
 * clinician edits their own.
 */
export function ClinicianNotes({
  compoundId,
  isClinician,
  notes,
}: {
  compoundId: string
  isClinician: boolean
  notes: Note[]
}) {
  const { t } = useTranslation()
  const { user } = useSession()
  const { toast } = useToast()
  const save = useSaveCompoundNote(user?.id ?? '', compoundId)
  const mine = notes.find((n) => n.clinician_id === user?.id)
  const others = notes.filter((n) => n.clinician_id !== user?.id)
  const [editing, setEditing] = useState(false)
  const [body, setBody] = useState(mine?.body ?? '')

  if (!isClinician) {
    if (others.length === 0) return null
    return (
      <Card title={t('wiki.clinicianNote')}>
        <div className="flex flex-col gap-2.5">
          {others.map((n) => (
            <p key={n.id} className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-2">
              {n.body}
            </p>
          ))}
        </div>
      </Card>
    )
  }

  return (
    <Card
      title={t('wiki.myNote')}
      subtitle={t('wiki.myNoteHint')}
      action={
        !editing && (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setBody(mine?.body ?? '')
              setEditing(true)
            }}
          >
            {mine ? t('common.edit') : t('common.add')}
          </Button>
        )
      }
    >
      {editing ? (
        <>
          <Textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} />
          <div className="mt-2 flex justify-end gap-2">
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              {t('common.cancel')}
            </Button>
            <Button
              size="sm"
              loading={save.isPending}
              onClick={async () => {
                try {
                  await save.mutateAsync(body)
                  setEditing(false)
                  toast(t('common.saved'), 'success')
                } catch {
                  toast(t('common.error'), 'error')
                }
              }}
            >
              {t('common.save')}
            </Button>
          </div>
        </>
      ) : mine ? (
        <p className="whitespace-pre-wrap text-[14px] leading-relaxed text-ink-2">{mine.body}</p>
      ) : (
        <p className="text-[13px] text-muted">{t('wiki.myNoteEmpty')}</p>
      )}
    </Card>
  )
}
