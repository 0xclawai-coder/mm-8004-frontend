'use client'

import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

export function SearchBar({ value, onChange, className }: SearchBarProps) {
  const [internalValue, setInternalValue] = useState(value)

  // Sync external value changes
  useEffect(() => {
    setInternalValue(value)
  }, [value])

  // Debounce: fire onChange after 300ms of inactivity
  useEffect(() => {
    const timer = setTimeout(() => {
      if (internalValue !== value) {
        onChange(internalValue)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [internalValue, onChange, value])

  return (
    <div className={cn('relative', className)}>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="text"
        placeholder="Search agents..."
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className="h-10 bg-card/60 pl-9 glass-border"
      />
    </div>
  )
}
