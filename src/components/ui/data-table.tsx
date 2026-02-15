'use client'

import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { useState } from 'react'
import { ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  emptyMessage?: string
  isLoading?: boolean
  skeletonRows?: number
  className?: string
  onRowClick?: (row: TData) => void
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = 'No results found',
  isLoading,
  skeletonRows = 5,
  className,
  onRowClick,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([])

  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    state: { sorting },
    initialState: { pagination: { pageSize } },
  })

  const currentPage = table.getState().pagination.pageIndex
  const totalPages = table.getPageCount()

  const pageNumbers: number[] = []
  const maxVisible = 5
  let startPage = Math.max(0, currentPage - Math.floor(maxVisible / 2))
  const endPage = Math.min(totalPages - 1, startPage + maxVisible - 1)
  if (endPage - startPage + 1 < maxVisible) {
    startPage = Math.max(0, endPage - maxVisible + 1)
  }
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i)
  }

  return (
    <div className="flex w-full flex-col gap-2">
      <div className={cn("flex w-full overflow-hidden rounded-xl border border-border/50 bg-card/40", className)}>
        <ScrollArea className="w-1 flex-1" type="auto">
          <table className="w-full caption-bottom text-sm">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-border/50 hover:bg-transparent"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className={cn(
                        'h-10 px-4 text-left align-middle text-xs font-medium uppercase tracking-wider text-muted-foreground',
                        header.column.getCanSort() && 'cursor-pointer select-none'
                      )}
                      style={{ width: `${header.getSize()}px` }}
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {header.isPlaceholder ? null : (
                        <div className="flex items-center gap-1">
                          {flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                          {header.column.getCanSort() && (
                            <ArrowUpDown className="size-3 text-muted-foreground/50" />
                          )}
                        </div>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: skeletonRows }).map((_, i) => (
                  <tr key={`skeleton-${i}`} className="border-b border-border/30">
                    {columns.map((col, j) => (
                      <td key={`skeleton-${i}-${j}`} className="px-4 py-3 align-middle">
                        {(col.meta as any)?.skeleton ?? <Skeleton className="h-4 w-full" />}
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className={cn(
                      "border-b border-border/30 transition-colors hover:bg-accent/50",
                      onRowClick && "cursor-pointer"
                    )}
                    onClick={() => onRowClick?.(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 align-middle"
                        style={{ width: `${cell.column.getSize()}px` }}
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
          <ScrollBar orientation="horizontal" className="h-2.5 w-full" />
        </ScrollArea>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-2 flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-sm text-muted-foreground">
            {table.getFilteredRowModel().rows.length} results
          </p>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              className="h-8 gap-1 border-border/50 bg-card/80 px-3 text-xs"
            >
              <ChevronLeft className="size-3.5" />
              Prev
            </Button>
            {pageNumbers.map((p) => (
              <Button
                key={p}
                variant={p === currentPage ? 'default' : 'outline'}
                size="sm"
                onClick={() => table.setPageIndex(p)}
                className={cn(
                  'size-8 p-0 text-xs',
                  p !== currentPage && 'border-border/50 bg-card/80'
                )}
              >
                {p + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              className="h-8 gap-1 border-border/50 bg-card/80 px-3 text-xs"
            >
              Next
              <ChevronRight className="size-3.5" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
