import { useTranslation } from 'react-i18next'
import { PageHeader } from '@/components/layout/PageHeader'
import { RemindersPanel } from './RemindersPanel'

export function RemindersPage() {
  const { t } = useTranslation()
  return (
    <div className="pb-8">
      <PageHeader title={t('more.items.reminders')} back="/more" />
      <RemindersPanel />
    </div>
  )
}
