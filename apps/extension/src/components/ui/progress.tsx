import * as React from "react"
import { cn } from "@/lib/utils"

function Progress({
  className,
  value,
  indicatorClassName,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  value?: number
  indicatorClassName?: string
}) {
  const progressValue = Math.min(100, Math.max(0, value || 0))

  return (
    <div
      data-slot="progress"
      className={cn(
        "bg-neutral-200 dark:bg-neutral-800 h-1.5 rounded-full relative flex w-full items-center overflow-hidden",
        className
      )}
      {...props}
    >
      <div
        data-slot="progress-indicator"
        className={cn(
          "bg-neutral-900 dark:bg-white size-full flex-1 rounded-full transition-all duration-300",
          indicatorClassName
        )}
        style={{ transform: `translateX(-${100 - progressValue}%)` }}
      />
    </div>
  )
}

export { Progress }
