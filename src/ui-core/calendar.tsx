
"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/shared/lib/utils"
import { buttonVariants } from "@/ui-core/button" // Assuming you might have a button, if not we'll create

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
    className,
    classNames,
    showOutsideDays = true,
    ...props
}: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn("p-4 bg-white rounded-2xl border border-neutral-100 shadow-sm", className)}
            classNames={{
                months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                month: "space-y-4",
                caption: "flex justify-center pt-1 relative items-center mb-2",
                caption_label: "text-sm font-bold text-neutral-900 capitalize tracking-wide",
                nav: "space-x-1 flex items-center",
                nav_button: cn(
                    "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-all rounded-full hover:bg-neutral-100 flex items-center justify-center absolute"
                ),
                nav_button_previous: "left-1",
                nav_button_next: "right-1",
                table: "w-full border-collapse space-y-1",
                head_row: "flex",
                head_cell:
                    "text-neutral-400 rounded-md w-9 font-medium text-[0.8rem] uppercase",
                row: "flex w-full mt-2",
                cell: "text-center text-sm p-0 relative focus-within:relative focus-within:z-20",
                day: cn(
                    "h-9 w-9 p-0 font-medium aria-selected:opacity-100 rounded-full transition-all hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none"
                ),
                day_selected:
                    "bg-neutral-900 text-white hover:bg-neutral-800 hover:text-white shadow-md shadow-neutral-200",
                day_today: "text-blue-600 font-bold bg-blue-50",
                day_outside: "text-neutral-200 opacity-50",
                day_disabled: "text-neutral-300 opacity-50 line-through decoration-neutral-400 cursor-not-allowed hover:bg-transparent hover:text-neutral-300",
                day_range_middle:
                    "aria-selected:bg-neutral-100 aria-selected:text-neutral-900",
                day_hidden: "invisible",
                ...classNames,
            }}
            {...props}
        />
    )
}
Calendar.displayName = "Calendar"

export { Calendar }
