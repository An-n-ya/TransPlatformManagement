import * as React from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface NativeSelectProps
  extends React.SelectHTMLAttributes<HTMLSelectElement> {
  wrapperClassName?: string
}

const NativeSelect = React.forwardRef<HTMLSelectElement, NativeSelectProps>(
  ({ className, wrapperClassName, children, ...props }, ref) => (
    <div className={cn('relative inline-flex w-full', wrapperClassName)}>
      <select
        ref={ref}
        className={cn(
          'flex h-9 w-full appearance-none items-center rounded-lg border border-border bg-background px-3 py-2 pr-8 text-sm text-foreground shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#000] focus-visible:border-[#000] disabled:cursor-not-allowed disabled:opacity-50',
          className
        )}
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  )
)
NativeSelect.displayName = 'NativeSelect'

export { NativeSelect }
