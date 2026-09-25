import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { RemindersCard } from './RemindersCard'

export function RemindersPage() {
  const { t } = useTranslation()
  return (
    <div className="pb-8">
      <PageHeader eyebrow={t('more.account')} title={t('more.reminders')} back="/more" />
      <RemindersCard />
    </div>
  )
}
