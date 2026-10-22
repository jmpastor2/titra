import { useQueryClient } from '@tanstack/react-query'
import { LogOut } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/Button'
import { useToast } from '@/components/ui/Toast'
import { BrandMark } from '@/features/auth/BrandMark'
import { useSession } from '@/features/auth/SessionProvider'
import { signOut } from '@/features/auth/signOut'
import { useAccess } from './data'

/**
 * What a signed-in account sees until someone approves it, or after it was turned
 * down: the same quiet frame as the sign-in screen, a sentence and the way out.
 */
export function AccessPending({ verdict }: { verdict: 'pending' | 'rejected' }) {
  const { t } = useTranslation()
  const { toast } = useToast()
  const qc = useQueryClient()
  const { user } = useSession()
  const access = useAccess(user?.id)

  async function check() {
    const res = await access.refetch()
    if (res.data?.status === 'approved') {
      // Everything read while pending came back empty: start the account afresh.
      await qc.resetQueries({ predicate: (q) => q.queryKey[0] !== 'access' })
    } else {
      toast(t('access.stillPending'), 'info')
    }
  }

  return (
    <div className="safe-top safe-bottom mx-auto flex min-h-dvh w-full max-w-sm flex-col px-6">
      <div className="min-h-10 flex-[1.1]" />

      <BrandMark />

      <div className="mt-10 text-center" role="status">
        <h2 className="text-[20px] font-semibold tracking-[-0.015em]">
          {t(`access.${verdict}Title`)}
        </h2>
        <p className="mx-auto mt-2 max-w-[32ch] text-[14px] leading-relaxed text-muted">
          {t(`access.${verdict}Body`, { email: user?.email ?? '' })}
        </p>
      </div>

      <div className="mt-8 flex flex-col gap-2">
        {verdict === 'pending' && (
          <Button size="lg" block variant="secondary" loading={access.isFetching} onClick={check}>
            {t('access.checkAgain')}
          </Button>
        )}
        <Button
          size="lg"
          block
          variant="ghost"
          leading={<LogOut className="size-4" aria-hidden />}
          onClick={() => signOut(qc)}
        >
          {t('settings.signOut')}
        </Button>
      </div>

      <div className="min-h-8 flex-1" />
    </div>
  )
}
