"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export interface DateRange {
  from: Date | undefined
  to?: Date | undefined
}

export type CalendarProps = {
  mode?: "single" | "range"
  selected?: Date | DateRange
  onSelect?: (date: Date | DateRange | undefined) => void
  defaultMonth?: Date
  numberOfMonths?: number
  className?: string
  initialFocus?: boolean
}

function Calendar({
  className,
  mode = "single",
  selected,
  onSelect,
  defaultMonth,
  numberOfMonths = 1,
  ...props
}: CalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(defaultMonth || new Date())

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate()
  }

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay()
  }

  const isSelected = (day: number) => {
    if (mode === "single" && selected instanceof Date) {
      const testDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
      return testDate.toDateString() === selected.toDateString()
    }
    return false
  }

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day)
    if (onSelect) {
      if (mode === "single") {
        onSelect(clickedDate)
      } else if (mode === "range") {
        // Simple range selection logic
        const range = selected as DateRange || { from: undefined, to: undefined }
        if (!range.from || (range.from && range.to)) {
          onSelect({ from: clickedDate, to: undefined })
        } else if (clickedDate < range.from) {
          onSelect({ from: clickedDate, to: range.from })
        } else {
          onSelect({ from: range.from, to: clickedDate })
        }
      }
    }
  }

  const daysInMonth = getDaysInMonth(currentMonth)
  const firstDay = getFirstDayOfMonth(currentMonth)
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ]
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]

  return (
    <div className={cn("p-3", className)}>
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1))}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h3 className="font-medium">
          {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1))}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {dayNames.map(day => (
          <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {Array.from({ length: firstDay }, (_, i) => (
          <div key={`empty-${i}`} className="p-2" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const day = i + 1
          const isSelectedDay = isSelected(day)
          return (
            <button
              key={day}
              onClick={() => handleDayClick(day)}
              className={cn(
                "p-2 text-sm hover:bg-gray-100 rounded",
                isSelectedDay && "bg-blue-500 text-white hover:bg-blue-600"
              )}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

Calendar.displayName = "Calendar"

export { Calendar }