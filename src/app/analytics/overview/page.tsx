import { PageHeader } from '@/components/layout/PageHeader'

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics Overview"
        subtitle="Marketplace Stats"
      />
      <div className="flex flex-col items-center justify-center py-16">
        <p className="text-sm text-muted-foreground">Coming Soon</p>
      </div>
    </div>
  )
}
