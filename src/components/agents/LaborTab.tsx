'use client'

import { Briefcase, FileText, Zap, Clock } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

// ============================================================
// Mock labor records — will be replaced by real API data
// ============================================================

const MOCK_LABOR: {
  id: number
  task: string
  category: string
  status: 'completed' | 'in_progress' | 'pending'
  timestamp: string
}[] = [
  { id: 1, task: 'Smart contract audit for DeFi vault', category: 'Audit', status: 'completed', timestamp: '2025-02-10T12:00:00Z' },
  { id: 2, task: 'Generate trading strategy report', category: 'Analysis', status: 'completed', timestamp: '2025-02-11T09:30:00Z' },
  { id: 3, task: 'API endpoint load testing', category: 'Testing', status: 'in_progress', timestamp: '2025-02-12T16:00:00Z' },
  { id: 4, task: 'Code review for governance module', category: 'Review', status: 'pending', timestamp: '2025-02-13T00:00:00Z' },
]

function statusBadge(status: string) {
  switch (status) {
    case 'completed':
      return <Badge className="border-green-500/30 bg-green-500/10 text-green-400 text-[10px]">Completed</Badge>
    case 'in_progress':
      return <Badge className="border-yellow-500/30 bg-yellow-500/10 text-yellow-400 text-[10px]">In Progress</Badge>
    default:
      return <Badge className="border-muted-foreground/30 bg-muted/50 text-muted-foreground text-[10px]">Pending</Badge>
  }
}

export function LaborTab() {
  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Briefcase className="size-4 text-muted-foreground" />
          <h3 className="text-sm font-semibold text-foreground">Labor & Commissions</h3>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/5 px-3 py-1">
                <div className="relative flex size-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary/60 opacity-75" />
                  <span className="relative inline-flex size-1.5 rounded-full bg-primary" />
                </div>
                <span className="text-[10px] font-medium text-primary">Preview</span>
              </div>
            </TooltipTrigger>
            <TooltipContent>
              <p className="text-xs">Showing sample data — live tracking coming soon</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Labor list */}
      <div className="flex flex-col gap-2">
        {MOCK_LABOR.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 rounded-lg border border-border/40 bg-card/40 p-3 transition-colors hover:bg-card/60"
          >
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              {item.status === 'completed' ? (
                <FileText className="size-4 text-green-400" />
              ) : item.status === 'in_progress' ? (
                <Zap className="size-4 text-yellow-400" />
              ) : (
                <Clock className="size-4 text-muted-foreground" />
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <p className="truncate text-sm text-foreground">{item.task}</p>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px]">{item.category}</Badge>
                <span className="text-[10px] text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
            {statusBadge(item.status)}
          </div>
        ))}
      </div>
    </div>
  )
}
