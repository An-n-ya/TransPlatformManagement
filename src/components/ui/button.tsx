import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default:
          'bg-[#262626] text-white hover:bg-[#404040] active:bg-[#171717]',
        primary:
          'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive:
          'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        outline:
          'border border-border bg-background hover:bg-accent hover:text-accent-foreground',
        secondary:
          'bg-black/5 text-foreground border border-border hover:bg-black/10',
        ghost:
          'hover:bg-black/5 hover:text-foreground text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        subtle:
          'bg-brand-50 text-brand-700 hover:bg-brand-100',
      },
      size: {
        default: 'h-9 px-4 py-2',
        sm: 'h-7 px-3 rounded-lg text-xs',
        md: 'h-8 px-3 rounded-lg',
        lg: 'h-10 px-5 rounded-lg',
        icon: 'h-8 w-8',
        'icon-sm': 'h-7 w-7',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
