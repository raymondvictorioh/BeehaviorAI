import * as React from "react"
import { format, formatDistanceToNow, isPast, isFuture, isToday } from "date-fns"
import { Calendar } from "lucide-react"

import { cn } from "@/lib/utils"

export interface DateFieldProps {
  date: Date | string
  className?: string
  showIcon?: boolean
  showRelative?: boolean
  formatString?: string
  "data-testid"?: string
}

export function DateField({
  date,
  className,
  showIcon = true,
  showRelative = false,
  formatString = "PPP",
  "data-testid": testId,
}: DateFieldProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const formattedDate = format(dateObj, formatString)
  const relativeDate = showRelative ? formatDistanceToNow(dateObj, { addSuffix: true }) : null

  return (
    <div className={cn("flex items-center gap-2", className)} data-testid={testId}>
      {showIcon && <Calendar className="h-4 w-4 text-muted-foreground" />}
      <span className="text-sm text-muted-foreground">
        {formattedDate}
        {showRelative && <span className="ml-1">({relativeDate})</span>}
      </span>
    </div>
  )
}

export interface DateBadgeProps {
  date: Date | string
  className?: string
  showStatus?: boolean
  "data-testid"?: string
}

export function DateBadge({
  date,
  className,
  showStatus = false,
  "data-testid": testId,
}: DateBadgeProps) {
  const dateObj = typeof date === "string" ? new Date(date) : date
  const formattedDate = format(dateObj, "MMM d, yyyy")

  let statusColor = ""
  let statusText = ""

  if (showStatus) {
    if (isToday(dateObj)) {
      statusColor = "text-blue-600 dark:text-blue-400"
      statusText = "Today"
    } else if (isPast(dateObj)) {
      statusColor = "text-red-600 dark:text-red-400"
      statusText = "Past"
    } else if (isFuture(dateObj)) {
      statusColor = "text-green-600 dark:text-green-400"
      statusText = "Upcoming"
    }
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1.5 text-sm",
        showStatus && statusColor,
        className
      )}
      data-testid={testId}
    >
      <Calendar className="h-3.5 w-3.5" />
      <span>{formattedDate}</span>
      {showStatus && statusText && (
        <span className="text-xs font-medium">• {statusText}</span>
      )}
    </div>
  )
}
