import { Check, UserMinus, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate } from 'react-router-dom'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { Badge, SectionTitle } from '@/components/ui/primitives'
import { useToast } from '@/components/ui/Toast'
import type { AccessRequest, AccessStatus } from '@/data/database.types'
import { useSession } from '@/features/auth/SessionProvider'
import { fmtDate } from '@/lib/format'
import { useLocale } from '@/lib/useLocale'
import { useAccess, useAccessRequests, useDecideAccess } from './data'

const GROUPS: readonly AccessStatus[] = ['pending', 'approved', 'rejected']

/** The admin's list: who asked to come in, who is in, who was turned down. */
export function AccessPage() {
  const { t } = useTranslation()
  const { toast } = useToast()
  const { user } = useSession()
  const mine = useAccess(user?.id)
  const isAdmin = mine.data?.is_admin === true
  const list = useAccessRequests(isAdmin)
  const decide = useDecideAccess()

  if (mine.data !== undefined && !isAdmin) return <Navigate to="/more" replace />

  const rows = list.data ?? []

  async function set(person: AccessRequest, status: AccessStatus) {
    if (
      person.status === 'approved' &&
      status === 'rejected' &&
      !window.confirm(t('access.revokeConfirm', { name: person.display_name }))
    ) {
      return
    }
    try {
      await decide.mutateAsync({ userId: person.user_id, status })
      toast(t(`access.done.${status}`, { name: person.display_name }), 'success')
    } catch {
      toast(t('common.error'), 'error')
    }
  }

  return (
    <div className="pb-8">
      <PageHeader title={t('access.title')} back="/more" />
      <p className="mb-5 px-1 text-[13.5px] leading-snug text-muted">{t('access.intro')}</p>

      <div className="flex flex-col gap-5">
        {GROUPS.map((group) => {
          const people = rows.filter((r) => r.status === group)
          if (group === 'rejected' && people.length === 0) return null
          return (
            <section key={group} aria-label={t(`access.${group}`)}>
              <SectionTitle>{t(`access.${group}`)}</SectionTitle>
              <Card padded={false} className="px-4">
                {list.isPending ? (
                  <p className="py-4 text-[13.5px] text-muted">{t('common.loading')}</p>
                ) : people.length === 0 ? (
                  <p className="py-4 text-[13.5px] text-muted">{t('access.noPending')}</p>
                ) : (
                  <ul className="divide-y divide-line">
                    {people.map((p) => (
                      <Person
                        key={p.user_id}
                        person={p}
                        me={p.user_id === user?.id}
                        busy={decide.isPending && decide.variables?.userId === p.user_id}
                        onSet={(status) => set(p, status)}
                      />
                    ))}
                  </ul>
                )}
              </Card>
            </section>
          )
        })}
      </div>
    </div>
  )
}

function Person({
  person,
  me,
  busy,
  onSet,
}: {
  person: AccessRequest
  me: boolean
  busy: boolean
  onSet: (status: AccessStatus) => void
}) {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const when = fmtDate(new Date(person.decided_at ?? person.requested_at), locale)
  const line =
    person.status === 'pending'
      ? t('access.requested', { date: fmtDate(new Date(person.requested_at), locale) })
      : t(person.status === 'approved' ? 'access.since' : 'access.rejectedOn', { date: when })

  return (
    <li className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 py-3">
      <div className="flex min-w-[10rem] flex-1 items-center gap-3">
        <span
          aria-hidden
          className="grid size-10 shrink-0 place-items-center rounded-full bg-panel-3 text-[15px] font-semibold text-ink-2"
        >
          {person.display_name.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="truncate text-[15px] font-semibold leading-snug">
              {person.display_name}
            </span>
            {me ? (
              <Badge>{t('access.you')}</Badge>
            ) : (
              person.is_admin && <Badge tone="brand">{t('access.admin')}</Badge>
            )}
          </div>
          <div className="truncate text-[12.5px] text-ink-2">{person.email}</div>
          <div className="text-[12px] text-muted">{line}</div>
        </div>
      </div>

      {!me && (
        <div className="ml-auto flex shrink-0 gap-1.5">
          {person.status === 'pending' && (
            <>
              <Button
                size="sm"
                variant="ghost"
                disabled={busy}
                leading={<X className="size-4" aria-hidden />}
                onClick={() => onSet('rejected')}
              >
                {t('access.reject')}
              </Button>
              <Button
                size="sm"
                loading={busy}
                leading={<Check className="size-4" aria-hidden />}
                onClick={() => onSet('approved')}
              >
                {t('access.approve')}
              </Button>
            </>
          )}
          {person.status === 'approved' && (
            <Button
              size="sm"
              variant="ghost"
              className="-mr-2"
              loading={busy}
              leading={<UserMinus className="size-4" aria-hidden />}
              onClick={() => onSet('rejected')}
            >
              {t('access.revoke')}
            </Button>
          )}
          {person.status === 'rejected' && (
            <Button size="sm" variant="secondary" loading={busy} onClick={() => onSet('approved')}>
              {t('access.approve')}
            </Button>
          )}
        </div>
      )}
    </li>
  )
}
