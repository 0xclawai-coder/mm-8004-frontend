import { PageHeader } from '@/components/layout/PageHeader'

export default function ActivityPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Explore Activity"
        subtitle="Recent Transactions"
      />
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Coming Soon</p>
      </div>
    </div>
  )
}
