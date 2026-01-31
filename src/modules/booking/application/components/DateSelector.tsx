
"use client"

import * as React from "react"
import { useBookingStore } from '@/modules/booking/application/store/booking.store'
import { Calendar } from "@/ui-core/calendar"
import { motion, AnimatePresence } from "framer-motion"
import { getAvailabilityAction } from "@/app/actions"
import { TimeSlot } from "@/modules/booking/domain/value-objects/time-slot"
import { Loader2 } from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"

export function DateSelector() {
    const { selectedDate, selectDate, selectedTime, selectTime } = useBookingStore()
    const [slots, setSlots] = React.useState<TimeSlot[]>([])
    const [loading, setLoading] = React.useState(false)

    // Fetch Slots when Date changes
    React.useEffect(() => {
        if (!selectedDate) {
            setSlots([])
            return
        }

        setLoading(true)
        const dateStr = format(selectedDate, "yyyy-MM-dd")

        // Call our NEW Smart Availability Action
        // Call our NEW Smart Availability Action
        // Use a dummy valid UUID for now as we don't have resource tables yet
        const DUMMY_RESOURCE_ID = "00000000-0000-0000-0000-000000000001";

        getAvailabilityAction(DUMMY_RESOURCE_ID, dateStr)
            .then((res) => {
                if (res.success && res.data) {
                    setSlots(res.data)
                } else {
                    console.error("Availability Error:", res.error);
                    setSlots([])
                }
            })
            .finally(() => setLoading(false))

    }, [selectedDate])

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="grid md:grid-cols-2 gap-8"
        >
            {/* Col 1: Calendar */}
            <div className="flex flex-col space-y-4 w-full items-center md:items-start">
                <h2 className="text-xl font-semibold tracking-tight self-start md:self-auto">Selecciona la fecha</h2>
                <div className="border rounded-xl p-4 bg-white shadow-sm w-fit max-w-full overflow-hidden">
                    <Calendar
                        mode="single"
                        required={false}
                        selected={selectedDate || undefined}
                        onSelect={(date) => {
                            console.log("📅 Date clicked:", date);
                            selectDate(date || null);
                        }}
                        className="rounded-md border-0"
                        disabled={(date) => {
                            // Fix: Ensure we only disable YESTERDAY and before.
                            // Normalize "today" to 00:00:00 to avoid blocking the current day.
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            return date < today;
                        }}
                    // TODO: Disable non-working days from config
                    />
                </div>
            </div>

            {/* Col 2: Time Slots */}
            <AnimatePresence mode="wait">
                {selectedDate && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="flex flex-col space-y-4 w-full"
                    >
                        <h2 className="text-xl font-semibold tracking-tight">Horarios Disponibles</h2>
                        <div className="border rounded-xl p-4 md:p-6 bg-neutral-50 min-h-[300px]">

                            {loading ? (
                                <div className="grid grid-cols-3 gap-2 md:gap-3">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                                        <div key={i} className="h-10 bg-neutral-200 rounded-lg animate-pulse" />
                                    ))}
                                </div>
                            ) : slots.length === 0 ? (
                                <div className="flex h-full items-center justify-center text-neutral-400">
                                    No hay horarios disponibles.
                                </div>
                            ) : (
                                <div className="grid grid-cols-3 gap-2 md:gap-3 animate-in fade-in duration-300">
                                    {slots.map((slot) => {
                                        const timeLabel = format(new Date(slot.start), 'HH:mm')
                                        const isSelected = selectedTime === timeLabel

                                        return (
                                            <button
                                                key={slot.start}
                                                onClick={() => selectTime(timeLabel)}
                                                className={`
                                 py-2 px-4 rounded-lg text-sm font-medium transition-all active:scale-95
                                 ${isSelected
                                                        ? "bg-neutral-900 text-white shadow-md transform scale-105"
                                                        : "bg-white border border-neutral-200 hover:border-neutral-400 text-neutral-700 hover:shadow-sm"
                                                    }
                               `}
                                            >
                                                {timeLabel}
                                            </button>
                                        )
                                    })}
                                </div>
                            )}
                        </div>
                        {selectedTime && (
                            <div className="text-sm text-neutral-500 text-center animate-in fade-in slide-in-from-bottom-2">
                                Seleccionado: {format(selectedDate, 'PPP', { locale: es })} a las {selectedTime}
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    )
}
