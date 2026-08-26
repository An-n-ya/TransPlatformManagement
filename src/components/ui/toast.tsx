import { Toaster as SonnerToaster, toast as sonnerToast } from 'sonner'
import { cn } from '@/lib/utils'

type ToastVariant = 'default' | 'success' | 'error' | 'warning' | 'info'

export function toast(message: string, options?: { variant?: ToastVariant; description?: string }) {
  const { variant = 'default', description } = options ?? {}
  const opts = {
    description,
    classNames: {
      toast: cn(
        'group rounded-xl border border-border bg-popover shadow-lg text-foreground',
        variant === 'success' && '!border-[#15a877]/20 !bg-[#15a877]/10',
        variant === 'error' && '!border-[#e8463a]/20 !bg-[#e8463a]/10',
        variant === 'warning' && '!border-[#e27900]/20 !bg-[#e27900]/10',
        variant === 'info' && '!border-[#2f74ff]/20 !bg-[#2f74ff]/10'
      ),
      title: 'text-sm font-medium text-foreground',
      description: 'text-xs text-muted-foreground',
    },
  }
  if (variant === 'success') {
    sonnerToast.success(message, opts)
  } else if (variant === 'error') {
    sonnerToast.error(message, opts)
  } else if (variant === 'warning') {
    sonnerToast.warning(message, opts)
  } else if (variant === 'info') {
    sonnerToast.info(message, opts)
  } else {
    sonnerToast(message, opts)
  }
}

export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      closeButton
      richColors={false}
      gap={8}
      toastOptions={{
        className:
          'group toast rounded-xl border border-border bg-popover shadow-lg text-foreground',
      }}
    />
  )
}
