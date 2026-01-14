import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 shadow-sm",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground hover:bg-primary/90 hover:shadow",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/90",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/90 hover:shadow",
        outline: "text-foreground",
        success: "border-transparent bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-200 font-medium",
        warning: "border-transparent bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-200 font-medium",
        info: "border-transparent bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-200 font-medium",
        pending: "border-transparent bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-200 font-medium",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
