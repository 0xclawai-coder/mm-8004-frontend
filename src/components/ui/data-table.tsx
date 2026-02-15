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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[]
  data: TData[]
  pageSize?: number
  emptyMessage?: string
  isLoading?: boolean
  skeletonRows?: number
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageSize = 10,
  emptyMessage = 'No results found',
  isLoading,
  skeletonRows = 5,
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

  // Generate visible page numbers
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
    <div>
      <div className="overflow-x-auto rounded-xl border border-border/50 bg-card/40">
        <Table className="min-w-[700px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow
                key={headerGroup.id}
                className="border-b border-border/50 hover:bg-transparent"
              >
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={cn(
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
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: skeletonRows }).map((_, i) => (
                <TableRow key={`skeleton-${i}`}>
                  {columns.map((col, j) => (
                    <TableCell key={`skeleton-${i}-${j}`}>
                      {(col.meta as any)?.skeleton ?? <Skeleton className="h-4 w-full" />}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} style={{ width: `${cell.column.getSize()}px` }}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
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
